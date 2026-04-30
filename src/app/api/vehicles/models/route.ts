/**
 * /api/vehicles/models — 브랜드별 모델 목록 (vehicles 테이블)
 *
 * GET ?brand=BMW → 해당 브랜드의 활성 모델 목록
 * 응답: { models: { id: string; name: string; fuel_type: string | null }[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

const CACHE_HEADER = 'public, max-age=3600, stale-while-revalidate=600';

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand')?.trim() ?? '';

  if (!brand) {
    return NextResponse.json({ error: 'brand 파라미터가 필요합니다' }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleSupabaseClient();

    const { data, error } = await supabase
      .from('vehicles')
      .select('id, name, fuel_type')
      .eq('brand', brand)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    const res = NextResponse.json({ models: data ?? [] });
    res.headers.set('Cache-Control', CACHE_HEADER);
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
