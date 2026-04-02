import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { rateLimiter } from '@/lib/rateLimit';
import { calculateLeadScore } from '@/lib/leadScore';
import {
  sendConsultationNotification,
  sendCustomerReport,
  type ConsultationEmailData,
} from '@/lib/notification';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

const consultationSchema = z.object({
  name: z.string().min(1).max(50),
  phone: z.string().default(''),
  email: z.string().default(''),
  contactMethod: z.enum(['phone', 'email', 'kakao', 'skip']).default('phone'),
  privacyAgreed: z.literal(true),
  selectionPath: z.enum(['car', 'budget']).nullish(),
  carBrand: z.string().nullish(),
  carModel: z.string().nullish(),
  trim: z.string().nullish(),
  contractMonths: z
    .number()
    .nullish()
    .refine((v) => v == null || [36, 48, 60].includes(v)),
  annualKm: z
    .number()
    .nullish()
    .refine((v) =>
      v == null || [10000, 20000, 30000, 40000].includes(v)
    ),
  deposit: z.number().nullish(),
  prepaymentPct: z.number().nullish(),
  monthlyBudget: z.number().nullish(),
  financeSummary: z.string().nullish(),
  stepCompleted: z.number().optional(),
});

type ConsultationInput = z.infer<typeof consultationSchema>;

function getLeadGrade(score: number): string {
  if (score >= 80) return '🔴 HOT';
  if (score >= 50) return '🟠 WARM';
  if (score >= 20) return '🟡 COOL';
  return '⚪ COLD';
}

function getIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '127.0.0.1';
}

export async function POST(request: NextRequest) {
  try {
    // 1단계 - Rate Limit 체크
    const ip = getIp(request);
    const rateLimitResult = await rateLimiter.limit(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // 2단계 - zod 입력 검증
    const body = await request.json();
    const parseResult = consultationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const input: ConsultationInput = parseResult.data;

    // 3단계 - IP 해시 생성
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    const supabase = createServiceRoleSupabaseClient();

    // 4단계 - 중복 체크 (24시간 내 동일 ip_hash) — 상용화 배포 시 활성화
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();
      const { data: duplicate } = await supabase
        .from('consultations')
        .select('id')
        .eq('ip_hash', ipHash)
        .gte('created_at', twentyFourHoursAgo)
        .limit(1)
        .maybeSingle();

      if (duplicate) {
        return NextResponse.json(
          {
            warning: 'duplicate',
            message: '이미 접수된 신청이 있습니다',
          },
          { status: 409 }
        );
      }
    }

    // 5단계 - Lead Score 계산
    const inflowPage = request.cookies.get('inflow_page')?.value ?? null;
    const leadScore = calculateLeadScore({
      stepCompleted: input.stepCompleted ?? 6,
      carModel: input.carModel ?? null,
      contractMonths: input.contractMonths ?? null,
      deposit: input.deposit ?? null,
      monthlyBudget: input.monthlyBudget ?? null,
      inflowPage,
    });

    // 6단계 - Cookie 파싱
    const deviceType = request.cookies.get('device_type')?.value ?? null;
    const utmSource = request.cookies.get('utm_source')?.value ?? null;
    const referrer = request.cookies.get('referrer')?.value ?? null;
    const inflowPageCookie = request.cookies.get('inflow_page')?.value ?? null;

    // 7단계 - Supabase INSERT
    const { data: consultation, error: insertError } = await supabase
      .from('consultations')
      .insert({
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        contact_method: input.contactMethod,
        car_brand: input.carBrand,
        car_model: input.carModel,
        trim: input.trim,
        contract_months: input.contractMonths,
        annual_km: input.annualKm,
        deposit: input.deposit,
        prepayment_pct: input.prepaymentPct,
        monthly_budget: input.monthlyBudget,
        estimated_min: null,
        estimated_max: null,
        status: 'pending',
        step_completed: input.stepCompleted ?? 6,
        privacy_agreed: input.privacyAgreed,
        device_type: deviceType,
        utm_source: utmSource,
        referrer: referrer,
        inflow_page: inflowPageCookie,
        lead_score: leadScore,
        ip_hash: ipHash,
      })
      .select('id')
      .single();

    if (insertError || !consultation) {
      console.error('Consultation INSERT error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save consultation' },
        { status: 500 }
      );
    }

    let estimatedMin: number | null = null;
    let estimatedMax: number | null = null;

    // 가격 매칭 (차종 정보가 있을 때)
    if (
      input.carBrand &&
      input.carModel &&
      input.contractMonths &&
      input.annualKm
    ) {
      const { data: priceRange } = await supabase
        .from('pricing')
        .select('min_monthly, max_monthly')
        .eq('car_brand', input.carBrand)
        .eq('car_model', input.carModel)
        .eq('contract_months', input.contractMonths)
        .eq('annual_km', input.annualKm)
        .eq('is_active', true)
        .maybeSingle();

      if (priceRange) {
        estimatedMin = priceRange.min_monthly;
        estimatedMax = priceRange.max_monthly;
        await supabase
          .from('consultations')
          .update({
            estimated_min: estimatedMin,
            estimated_max: estimatedMax,
            updated_at: new Date().toISOString(),
          })
          .eq('id', consultation.id);
      }
    }

    // 9단계 - 이메일 발송 (실패해도 상담 신청은 성공)
    const carDisplay =
      [input.carBrand, input.carModel, input.trim].filter(Boolean).join(' ') ||
      '—';
    const leadGrade = getLeadGrade(leadScore);
    const emailData: ConsultationEmailData = {
      name: input.name,
      carBrand: input.carBrand ?? null,
      carModel: input.carModel ?? null,
      trim: input.trim ?? null,
      contractMonths: input.contractMonths ?? null,
      annualKm: input.annualKm ?? null,
      deposit: input.deposit ?? null,
      prepaymentPct: input.prepaymentPct ?? null,
      monthlyBudget: input.monthlyBudget ?? null,
      estimatedMin,
      estimatedMax,
      leadScore,
      leadGrade,
    };

    try {
      const emailResult = await sendConsultationNotification(emailData);
      if (!emailResult.success) {
        console.error('[Consultation] Email failed:', emailResult.error);
      }
      await supabase.from('notification_log').insert({
        consultation_id: consultation.id,
        channel: 'email',
        status: emailResult.success ? 'sent' : 'failed',
        error_message: emailResult.error ?? null,
      });
    } catch (emailErr) {
      console.error('[Consultation] Email send error:', emailErr);
      await supabase.from('notification_log').insert({
        consultation_id: consultation.id,
        channel: 'email',
        status: 'failed',
        error_message:
          emailErr instanceof Error ? emailErr.message : 'Unknown error',
      });
    }

    // 10단계 - 고객에게 결과 리포트 이메일 발송 (이메일 방식일 때)
    if (input.contactMethod === 'email' && input.email) {
      try {
        const reportResult = await sendCustomerReport({
          email: input.email,
          name: input.name,
          carBrand: input.carBrand ?? null,
          carModel: input.carModel ?? null,
          trim: input.trim ?? null,
          contractMonths: input.contractMonths ?? null,
          annualKm: input.annualKm ?? null,
          deposit: input.deposit ?? null,
          prepaymentPct: input.prepaymentPct ?? null,
          estimatedMin,
          estimatedMax,
          financeSummary: input.financeSummary ?? null,
        });
        if (!reportResult.success) {
          console.error('[Consultation] Customer report email failed:', reportResult.error);
        }
        await supabase.from('notification_log').insert({
          consultation_id: consultation.id,
          channel: 'customer_email',
          status: reportResult.success ? 'sent' : 'failed',
          error_message: reportResult.error ?? null,
        });
      } catch (reportErr) {
        console.error('[Consultation] Customer report error:', reportErr);
      }
    }

    // 11단계 - 응답
    return NextResponse.json({
      success: true,
      estimatedMin,
      estimatedMax,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('Consultation API error:', err);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { detail: message, stack }),
      },
      { status: 500 }
    );
  }
}
