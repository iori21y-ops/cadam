/**
 * /api/vehicle-msrp/models — 브랜드별 모델 목록 조회
 *
 * GET ?brand=현대 → 해당 브랜드의 모델 목록 반환
 * 응답: { models: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

const CACHE_HEADER = 'public, max-age=3600, stale-while-revalidate=600';

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand')?.trim() ?? '';

  if (!brand) {
    return NextResponse.json(
      { error: 'brand 파라미터가 필요합니다' },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceRoleSupabaseClient();

    const { data, error } = await supabase
      .from('vehicle_msrp')
      .select('model')
      .eq('brand', brand)
      .order('model');

    if (error) throw error;

    const models = [...new Set((data ?? []).map((r: { model: string }) => r.model))];

    const res = NextResponse.json({ models });
    res.headers.set('Cache-Control', CACHE_HEADER);
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
