/**
 * /api/insurance-stats — 차종·원산지·연령대별 연간 보험료 추정치 조회
 *
 * 데이터 소스: Supabase insurance_stats (금융위원회 자동차보험 통계, 117,033건)
 *   - 수집: cadam-pipeline/scripts/api-hub/domestic/insurance/fetch_insurance_stats.py
 *   - 갱신: 매일 09시 check_and_fetch_insurance.py (신규 월 데이터 감지 시 자동 적재)
 *
 * 계산 방식 (담보별 합산):
 *   각 coverage_type마다: monthly = SUM(elapsed_premium) / SUM(join_count) (원)
 *   estimated_annual = SUM(monthly per coverage) × 12
 *   — 기존 ×60 근사값보다 담보별 가입 비중 차이를 반영해 더 정확
 *
 * 파라미터:
 *   car_type      필수: '소형' | '중형' | '대형' | '다인승'
 *   origin        선택: '국산' | '외산'  (없으면 전체 평균)
 *   age_group     선택: '20대 이하' | '30대' | '40대' | '50대' | '60대' | '70대 이상'
 *   business_type 선택: 'personal'(개인용) | 'individual_business'(업무용) | 'corporation'(영업용)
 *
 * ※ 실제 보험료는 운전자 조건·사고이력·차량 연식에 따라 크게 다를 수 있음
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import {
  applyRateLimit,
  secureError,
  allowCors,
  handleCorsPreflight,
} from '@/lib/api/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const CAR_TYPES    = ['소형', '중형', '대형', '다인승'] as const;
const ORIGIN_TYPES = ['국산', '외산'] as const;
const AGE_GROUPS   = ['20대 이하', '30대', '40대', '50대', '60대', '70대 이상'] as const;
const BIZ_TYPES    = ['personal', 'individual_business', 'corporation'] as const;
const SEX_TYPES    = ['남자', '여자'] as const;
// 연도별 추이용: 각 연도 12월 (누적 기준이라 ratio = 연간 보험료 직접)
const TREND_YMS    = ['201812','201912','202012','202112','202212','202312','202412','202512'] as const;

const BIZ_TO_INSURANCE: Record<typeof BIZ_TYPES[number], string> = {
  personal:            '개인용',
  individual_business: '업무용',
  corporation:         '영업용',
};

const InsuranceStatsRequest = z.object({
  car_type:      z.enum(CAR_TYPES),
  origin:        z.enum(ORIGIN_TYPES).optional(),
  age_group:     z.enum(AGE_GROUPS).optional(),
  sex:           z.enum(SEX_TYPES).optional(),
  business_type: z.enum(BIZ_TYPES).optional(),
  include_trend: z.boolean().optional(),
});

const COVERAGES = ['대인배상1', '대인배상2', '대물배상', '자기신체사고', '자기차량손해'] as const;

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req);
  if (rl) return rl;

  try {
    const body = await req.json();
    const parsed = InsuranceStatsRequest.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
    }

    const { car_type, origin, age_group, sex, business_type, include_trend } = parsed.data;
    const insurance_type = BIZ_TO_INSURANCE[business_type ?? 'personal'];

    // 최신 base_ym 조회
    const { data: latestRows, error: latestErr } = await supabase
      .from('insurance_stats')
      .select('base_ym')
      .order('base_ym', { ascending: false })
      .limit(1);

    if (latestErr) throw latestErr;
    const base_ym = latestRows?.[0]?.base_ym ?? null;
    if (!base_ym) {
      return allowCors(req, NextResponse.json({ error: '데이터 없음' }, { status: 404 }));
    }

    // 차종·원산지·연령대·담보별 행 조회
    let query = supabase
      .from('insurance_stats')
      .select('coverage_type, elapsed_premium, join_count')
      .eq('car_type', car_type)
      .eq('insurance_type', insurance_type)
      .eq('stat_kind', 'contract')
      .eq('base_ym', base_ym)
      .gt('join_count', 0);

    if (origin)    query = query.eq('origin',    origin);
    if (age_group) query = query.eq('age_group', age_group);
    if (sex)       query = query.eq('sex',       sex);

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      // insurance_type 데이터가 없을 경우 개인용으로 fallback
      if (insurance_type !== '개인용') {
        let fallback = supabase
          .from('insurance_stats')
          .select('coverage_type, elapsed_premium, join_count')
          .eq('car_type', car_type)
          .eq('insurance_type', '개인용')
          .eq('stat_kind', 'contract')
          .eq('base_ym', base_ym)
          .gt('join_count', 0);
        if (origin)    fallback = fallback.eq('origin',    origin);
        if (age_group) fallback = fallback.eq('age_group', age_group);
        if (sex)       fallback = fallback.eq('sex',       sex);
        const { data: fbData, error: fbErr } = await fallback;
        if (fbErr) throw fbErr;
        if (!fbData || fbData.length === 0) {
          return allowCors(req, NextResponse.json({ error: '데이터 없음' }, { status: 404 }));
        }
        data?.push(...(fbData as typeof data));
      } else {
        return allowCors(req, NextResponse.json({ error: '데이터 없음' }, { status: 404 }));
      }
    }

    // 담보별 월 평균 보험료 계산 → 합산 × 12
    const coverageMap = new Map<string, { premium: number; joins: number }>();
    for (const row of data ?? []) {
      const key = row.coverage_type as string;
      const cur = coverageMap.get(key) ?? { premium: 0, joins: 0 };
      coverageMap.set(key, {
        premium: cur.premium + (row.elapsed_premium ?? 0),
        joins:   cur.joins   + (row.join_count    ?? 0),
      });
    }

    const breakdown: Record<string, number> = {};
    let totalMonthly = 0;
    for (const cov of COVERAGES) {
      const entry = coverageMap.get(cov);
      if (entry && entry.joins > 0) {
        const monthly = entry.premium / entry.joins;
        breakdown[cov] = Math.round(monthly);
        totalMonthly  += monthly;
      }
    }

    const estimated_annual_won = Math.round(totalMonthly * 12);

    // 연도별 추이 (include_trend=true일 때만)
    let trend: { year: string; annual_mk: number }[] | undefined;
    if (include_trend) {
      let trendQuery = supabase
        .from('insurance_stats')
        .select('base_ym, coverage_type, elapsed_premium, join_count')
        .eq('car_type', car_type)
        .eq('insurance_type', insurance_type)
        .eq('stat_kind', 'contract')
        .in('base_ym', [...TREND_YMS])
        .gt('join_count', 0);
      if (origin)    trendQuery = trendQuery.eq('origin',    origin);
      if (age_group) trendQuery = trendQuery.eq('age_group', age_group);
      if (sex)       trendQuery = trendQuery.eq('sex',       sex);
      const { data: trendData } = await trendQuery;
      if (trendData && trendData.length > 0) {
        // base_ym × coverage → premium/join 집계
        const ymCovMap = new Map<string, Map<string, { p: number; j: number }>>();
        for (const row of trendData) {
          if (!ymCovMap.has(row.base_ym)) ymCovMap.set(row.base_ym, new Map());
          const covMap = ymCovMap.get(row.base_ym)!;
          const cov = row.coverage_type as string;
          const cur = covMap.get(cov) ?? { p: 0, j: 0 };
          covMap.set(cov, { p: cur.p + (row.elapsed_premium ?? 0), j: cur.j + (row.join_count ?? 0) });
        }
        trend = [];
        for (const ym of TREND_YMS) {
          const covMap = ymCovMap.get(ym);
          if (!covMap) continue;
          let total = 0;
          for (const cov of COVERAGES) {
            const entry = covMap.get(cov);
            // 12월 누적 데이터: elapsed/join = 연간 보험료 (×12 불필요)
            if (entry && entry.j > 0) total += entry.p / entry.j;
          }
          if (total > 0) trend.push({ year: ym.slice(0, 4), annual_mk: Math.round(total / 10000) });
        }
        if (trend.length === 0) trend = undefined;
      }
    }

    return allowCors(req, NextResponse.json({
      status:              'ok',
      car_type,
      origin:              origin    ?? null,
      age_group:           age_group ?? null,
      sex:                 sex       ?? null,
      insurance_type,
      base_ym,
      estimated_annual_won,
      estimated_annual_mk: Math.round(estimated_annual_won / 10000),
      breakdown_monthly:   breakdown,  // 담보별 월 보험료 (원)
      ...(trend !== undefined ? { trend } : {}),
    }));
  } catch (err) {
    return secureError(err, 500);
  }
}
