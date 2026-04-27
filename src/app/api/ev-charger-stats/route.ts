/**
 * /api/ev-charger-stats — EV 충전소 전국 집계 통계 조회
 *
 * 데이터 소스: Supabase ev_chargers (환경부 전기차 충전소, 99,419건)
 *
 * 반환:
 *   total_count       — 전체 충전기 수
 *   fast_count        — 급속 충전기 수 (charger_type ≠ '02')
 *   slow_count        — 완속 충전기 수 (charger_type = '02')
 *   avg_price_kwh     — 환경부 공개 충전단가 (원/kWh, 고정값)
 *   fast_price_kwh    — 급속 충전단가 (원/kWh)
 *   slow_price_kwh    — 완속 충전단가 (원/kWh)
 *
 * 충전단가: 환경부 고시 기준 (2024년 현재)
 *   급속: 347.2원/kWh / 완속: 324.4원/kWh
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

// 환경부 고시 충전단가 (원/kWh, 2024년 기준)
const FAST_PRICE_KWH = 347.2;
const SLOW_PRICE_KWH = 324.4;

// 완속 충전기 타입 코드
const SLOW_TYPE = '02';

// 결과 캐싱 (1시간) — 전국 집계는 자주 바뀌지 않음
let cache: {
  data: EvChargerStats;
  expiry: number;
} | null = null;

interface EvChargerStats {
  total_count: number;
  fast_count:  number;
  slow_count:  number;
  fast_ratio:  number;   // 0~1
  avg_price_kwh:  number;
  fast_price_kwh: number;
  slow_price_kwh: number;
}

export function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req);
  if (rl) return rl;

  try {
    const now = Date.now();
    if (cache && cache.expiry > now) {
      return allowCors(req, NextResponse.json({ status: 'ok', ...cache.data }));
    }

    // 전체 건수 조회
    const { count: totalCount, error: totalErr } = await supabase
      .from('ev_chargers')
      .select('*', { count: 'exact', head: true });

    if (totalErr) throw totalErr;

    // 완속(02) 건수 조회
    const { count: slowCount, error: slowErr } = await supabase
      .from('ev_chargers')
      .select('*', { count: 'exact', head: true })
      .eq('charger_type', SLOW_TYPE);

    if (slowErr) throw slowErr;

    const total = totalCount ?? 0;
    const slow  = slowCount  ?? 0;
    const fast  = total - slow;

    const stats: EvChargerStats = {
      total_count:    total,
      fast_count:     fast,
      slow_count:     slow,
      fast_ratio:     total > 0 ? fast / total : 0,
      avg_price_kwh:  Math.round((FAST_PRICE_KWH + SLOW_PRICE_KWH) / 2 * 10) / 10,
      fast_price_kwh: FAST_PRICE_KWH,
      slow_price_kwh: SLOW_PRICE_KWH,
    };

    cache = { data: stats, expiry: now + 60 * 60 * 1000 };

    return allowCors(req, NextResponse.json({ status: 'ok', ...stats }));
  } catch (err) {
    return secureError(err, 500);
  }
}
