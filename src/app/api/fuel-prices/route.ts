/**
 * /api/fuel-prices — 전국 평균 유류가 조회
 *
 * 데이터 소스: Supabase fuel_prices (오피넷 수집, sido='전국', 최신 trade_date)
 *
 * 반환:
 *   gasoline  — 휘발유 (원/L)
 *   diesel    — 자동차용경유 (원/L)
 *   lpg       — 자동차용부탄 (원/L)
 *   trade_date — 기준일
 *
 * product_code 매핑:
 *   B027 / 휘발유
 *   D047 / 자동차용경유
 *   K015 / 자동차용부탄 (LPG)
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

const TARGET_PRODUCTS = ['휘발유', '자동차용경유', '자동차용부탄'] as const;

const PRODUCT_TO_KEY: Record<string, 'gasoline' | 'diesel' | 'lpg'> = {
  '휘발유':       'gasoline',
  '자동차용경유': 'diesel',
  '자동차용부탄': 'lpg',
};

// 메모리 캐시 1시간
let cache: {
  data: FuelPriceResponse;
  expiry: number;
} | null = null;

interface FuelPriceResponse {
  status:     'ok';
  trade_date: string;
  gasoline:   number;
  diesel:     number;
  lpg:        number;
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
      return allowCors(req, NextResponse.json(cache.data));
    }

    // 최신 trade_date 조회
    const { data: latest, error: latestErr } = await supabase
      .from('fuel_prices')
      .select('trade_date')
      .eq('sido', '전국')
      .in('product_name', TARGET_PRODUCTS)
      .order('trade_date', { ascending: false })
      .limit(1);

    if (latestErr) throw latestErr;
    const trade_date = latest?.[0]?.trade_date;
    if (!trade_date) {
      return allowCors(req, NextResponse.json({ error: '데이터 없음' }, { status: 404 }));
    }

    // 해당 날짜의 전국 3개 유종 가격 조회
    const { data, error } = await supabase
      .from('fuel_prices')
      .select('product_name, price')
      .eq('sido', '전국')
      .eq('trade_date', trade_date)
      .in('product_name', TARGET_PRODUCTS);

    if (error) throw error;
    if (!data || data.length === 0) {
      return allowCors(req, NextResponse.json({ error: '데이터 없음' }, { status: 404 }));
    }

    const prices: Partial<Record<'gasoline' | 'diesel' | 'lpg', number>> = {};
    for (const row of data) {
      const key = PRODUCT_TO_KEY[row.product_name];
      if (key) prices[key] = Math.round(row.price);
    }

    if (!prices.gasoline || !prices.diesel || !prices.lpg) {
      return allowCors(req, NextResponse.json({ error: '일부 유종 데이터 없음' }, { status: 404 }));
    }

    const result: FuelPriceResponse = {
      status: 'ok',
      trade_date,
      gasoline: prices.gasoline,
      diesel:   prices.diesel,
      lpg:      prices.lpg,
    };

    cache = { data: result, expiry: now + 60 * 60 * 1000 };

    return allowCors(req, NextResponse.json(result));
  } catch (err) {
    return secureError(err, 500);
  }
}
