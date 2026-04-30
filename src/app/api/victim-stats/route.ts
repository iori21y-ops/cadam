/**
 * /api/victim-stats — 교통사고 부상 경중 분포 조회
 *
 * 데이터 소스: Supabase insurance_victim_stats (금융위원회 피해자 통계)
 *   - 수집: cadam-pipeline/scripts/api-hub/domestic/insurance/fetch_victim_stats.py
 *   - getVictimInfo API: 연도 파라미터 무관, 항상 최신 9개월 슬라이딩 윈도우 반환
 *   - 12,612행, 사고처리연월(accident_ym) 기준 최근 9개월
 *
 * 부상등급 구분 (낮을수록 중증):
 *   중증(01-05) · 중상(06-11) · 경상(12-14) · 사망(death_inj_type='사망')
 *
 * ※ 차종별 필터 없음 (스키마에 car_type 컬럼 미존재 — 전체 자동차 통계)
 */

import { NextRequest, NextResponse } from 'next/server';
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

const MINOR_CODES    = ['12', '13', '14'];           // 경상: 염좌·타박상·2주 이하
const MODERATE_CODES = ['06', '07', '08', '09', '10', '11'];  // 중상
const SEVERE_CODES   = ['01', '02', '03', '04', '05'];  // 중증: 장해·골절 등

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req);
  if (rl) return rl;

  try {
    const { data, error } = await supabase
      .from('insurance_victim_stats')
      .select('death_inj_type, inj_level_cd, person_count, accident_ym');

    if (error) throw error;
    if (!data || data.length === 0) {
      return allowCors(req, NextResponse.json({ error: '데이터 없음' }, { status: 404 }));
    }

    let total = 0;
    const counts = { minor: 0, moderate: 0, severe: 0, death: 0 };
    let periodFrom = '999999';
    let periodTo   = '000000';

    for (const row of data) {
      const n  = row.person_count ?? 0;
      const ym = row.accident_ym as string;
      total += n;
      if (ym < periodFrom) periodFrom = ym;
      if (ym > periodTo)   periodTo   = ym;

      if (row.death_inj_type === '사망') {
        counts.death += n;
      } else {
        const cd = row.inj_level_cd as string;
        if (MINOR_CODES.includes(cd))        counts.minor    += n;
        else if (MODERATE_CODES.includes(cd)) counts.moderate += n;
        else if (SEVERE_CODES.includes(cd))   counts.severe   += n;
        // grade 00 (미분류)은 현재 데이터에서 0건 — 집계 생략
      }
    }

    const pct = (n: number) => total > 0 ? Math.round((n / total) * 1000) / 10 : 0;

    return allowCors(req, NextResponse.json({
      status: 'ok',
      total_persons: total,
      severity: {
        minor:    { count: counts.minor,    pct: pct(counts.minor) },
        moderate: { count: counts.moderate, pct: pct(counts.moderate) },
        severe:   { count: counts.severe,   pct: pct(counts.severe) },
        death:    { count: counts.death,    pct: pct(counts.death) },
      },
      period: { from: periodFrom, to: periodTo },
    }));
  } catch (err) {
    return secureError(err, 500);
  }
}
