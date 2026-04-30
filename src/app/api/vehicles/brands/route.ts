/**
 * /api/vehicles/brands — vehicles 테이블 기반 브랜드 목록
 *
 * GET → is_active=true인 차량의 브랜드 목록 (중복 제거, 가나다순)
 * 응답: { brands: string[] }
 */

import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

const CACHE_HEADER = 'public, max-age=3600, stale-while-revalidate=600';

export async function GET() {
  try {
    const supabase = createServiceRoleSupabaseClient();

    const { data, error } = await supabase
      .from('vehicles')
      .select('brand')
      .eq('is_active', true)
      .order('brand');

    if (error) throw error;

    const brands = [...new Set((data ?? []).map((r: { brand: string }) => r.brand))];

    const res = NextResponse.json({ brands });
    res.headers.set('Cache-Control', CACHE_HEADER);
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
