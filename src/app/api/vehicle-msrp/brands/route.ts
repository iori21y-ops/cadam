/**
 * /api/vehicle-msrp/brands — 브랜드 목록 조회
 *
 * GET → 현대, 기아, 제네시스 등 전체 브랜드 목록 반환
 * 응답: { brands: string[] }
 */

import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

const CACHE_HEADER = 'public, max-age=3600, stale-while-revalidate=600';

export async function GET() {
  try {
    const supabase = createServiceRoleSupabaseClient();

    const { data, error } = await supabase
      .from('vehicle_msrp')
      .select('brand')
      .order('brand');

    if (error) throw error;

    // JS에서 중복 제거 (Supabase JS 클라이언트는 DISTINCT 미지원)
    const brands = [...new Set((data ?? []).map((r: { brand: string }) => r.brand))];

    const res = NextResponse.json({ brands });
    res.headers.set('Cache-Control', CACHE_HEADER);
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
