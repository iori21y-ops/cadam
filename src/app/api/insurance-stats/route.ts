/**
 * /api/insurance-stats — 차종·원산지별 연간 보험료 추정치 조회
 *
 * 데이터 소스: Supabase insurance_stats (금융위원회 자동차보험 통계, 15,133건)
 *   - 수집: cadam-pipeline/scripts/api-hub/domestic/insurance/fetch_insurance_stats.py
 *   - 갱신: 매일 09시 check_and_fetch_insurance.py (신규 월 데이터 감지 시 자동 적재)
 *
 * 계산 방식:
 *   raw_avg = SUM(elapsed_premium) / SUM(join_count)  — 담보 1개당 월 평균 보험료 (원)
 *   estimated_annual = raw_avg × 60  (12개월 × 5개 주요 담보)
 *
 * origin 필터(선택): '국산' | '외산' — 제공 시 원산지별 더 정확한 추정 반환
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
type CarType = typeof CAR_TYPES[number];

const InsuranceStatsRequest = z.object({
  car_type: z.enum(CAR_TYPES),
  origin:   z.enum(ORIGIN_TYPES).optional(),
});

// 담보 1개당 월 평균 → 연간 전체 추정 (12개월 × 5개 주요 담보)
const ANNUAL_MULTIPLIER = 60;

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

    const { car_type, origin } = parsed.data;

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

    // 차종 + 원산지별 집계 — 개인용 계약정보만
    let query = supabase
      .from('insurance_stats')
      .select('elapsed_premium, join_count')
      .eq('car_type', car_type)
      .eq('insurance_type', '개인용')
      .eq('stat_kind', 'contract')
      .eq('base_ym', base_ym)
      .gt('join_count', 0);

    if (origin) {
      query = query.eq('origin', origin);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      return allowCors(req, NextResponse.json({ error: '데이터 없음' }, { status: 404 }));
    }

    const totalPremium = data.reduce((s, r) => s + (r.elapsed_premium ?? 0), 0);
    const totalJoins   = data.reduce((s, r) => s + (r.join_count ?? 0), 0);
    const rawAvg       = totalJoins > 0 ? totalPremium / totalJoins : 0;
    const estimated_annual_won = Math.round(rawAvg * ANNUAL_MULTIPLIER);

    const res = NextResponse.json({
      status:                'ok',
      car_type,
      origin:                origin ?? null,
      base_ym,
      estimated_annual_won,
      estimated_annual_mk: Math.round(estimated_annual_won / 10000),
    });
    return allowCors(req, res);
  } catch (err) {
    return secureError(err, 500);
  }
}
