/**
 * /api/used-prices — 엔카 중고차 시세 조회
 *
 * 데이터 소스: Supabase vehicle_used_prices (scrape_encar.py --v2 수집)
 *
 * 쿼리 파라미터:
 *   brand  (필수) — 브랜드명 (예: 현대)
 *   model  (필수) — 모델명  (예: 그랜저)
 *
 * 반환:
 *   prices: Record<year, { low, mid, high }> — 연식별 주행거리 구간별 중간가 (만원)
 *   latestWeek: 집계에 사용된 수집 주차 (YYYY-Www)
 *
 * 집계 방식:
 *   최신 week_key 기준, 같은 연식·구간 내 트림별 listing_count 가중 평균 median_price
 *
 * 주행거리 구간 매핑:
 *   '0~3만km'  → low
 *   '3~6만km'  → mid
 *   '6~10만km' → high
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

const MILEAGE_KEY: Record<string, 'low' | 'mid' | 'high'> = {
  '0~3만km':  'low',
  '3~6만km':  'mid',
  '6~10만km': 'high',
};

// 메모리 캐시 1시간 (모델별)
const cache = new Map<string, { data: UsedPricesResult; ts: number }>();
const CACHE_TTL = 3600_000;

interface YearPrices {
  low:  number | null;
  mid:  number | null;
  high: number | null;
}

interface UsedPricesResult {
  status:     'ok' | 'not_found';
  brand:      string;
  model:      string;
  latestWeek: string | null;
  prices:     Record<number, YearPrices> | null;
}

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req);
  if (rl) return rl;

  try {
    const { searchParams } = new URL(req.url);
    const brand = searchParams.get('brand')?.trim();
    const model = searchParams.get('model')?.trim();

    if (!brand || !model) {
      return NextResponse.json({ error: 'brand, model 파라미터 필수' }, { status: 400 });
    }

    const cacheKey = `${brand}::${model}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return allowCors(req, NextResponse.json(cached.data));
    }

    // 1. 최신 week_key 조회
    const { data: weekRows, error: weekErr } = await supabase
      .from('vehicle_used_prices')
      .select('week_key')
      .eq('brand', brand)
      .eq('model', model)
      .order('week_key', { ascending: false })
      .limit(1);

    if (weekErr) throw weekErr;

    if (!weekRows || weekRows.length === 0) {
      const res: UsedPricesResult = { status: 'not_found', brand, model, latestWeek: null, prices: null };
      return allowCors(req, NextResponse.json(res, { status: 404 }));
    }

    const latestWeek = weekRows[0].week_key as string;

    // 2. 해당 week_key 전체 행 조회
    const { data: rows, error: rowsErr } = await supabase
      .from('vehicle_used_prices')
      .select('model_year, mileage_range, median_price, listing_count')
      .eq('brand', brand)
      .eq('model', model)
      .eq('week_key', latestWeek)
      .gt('listing_count', 0);

    if (rowsErr) throw rowsErr;
    if (!rows || rows.length === 0) {
      const res: UsedPricesResult = { status: 'not_found', brand, model, latestWeek, prices: null };
      return allowCors(req, NextResponse.json(res, { status: 404 }));
    }

    // 3. (model_year, mileage_range) 기준 listing_count 가중 평균 집계
    const agg = new Map<string, { sumWprice: number; sumCount: number }>();

    for (const row of rows) {
      const mk = MILEAGE_KEY[row.mileage_range as string];
      if (!mk) continue;
      const key = `${row.model_year as number}::${mk}`;
      const prev = agg.get(key) ?? { sumWprice: 0, sumCount: 0 };
      agg.set(key, {
        sumWprice: prev.sumWprice + (row.median_price as number) * (row.listing_count as number),
        sumCount:  prev.sumCount  + (row.listing_count as number),
      });
    }

    // 4. prices 객체 조립
    const prices: Record<number, YearPrices> = {};
    for (const [key, { sumWprice, sumCount }] of agg) {
      const [yearStr, mk] = key.split('::') as [string, 'low' | 'mid' | 'high'];
      const year = Number(yearStr);
      if (!prices[year]) prices[year] = { low: null, mid: null, high: null };
      prices[year][mk] = sumCount > 0 ? Math.round(sumWprice / sumCount) : null;
    }

    const result: UsedPricesResult = { status: 'ok', brand, model, latestWeek, prices };
    cache.set(cacheKey, { data: result, ts: Date.now() });

    return allowCors(req, NextResponse.json(result));
  } catch (err) {
    return secureError(err, 500);
  }
}
