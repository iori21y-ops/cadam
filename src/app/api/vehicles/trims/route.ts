/**
 * /api/vehicles/trims — vehicle_trims 테이블 기반 트림 목록 (제조사 PDF 공식 신차가)
 *
 * GET ?vehicle_id=uuid → 해당 차량의 트림 목록
 * 응답: { trims: TrimRow[] }
 *   - base_price: 원(원화) 단위 — 프론트에서 Math.round(base_price / 10000)으로 만원 변환
 *   - displacement: 리터 단위 (예: 2.0) — 프론트에서 * 1000 하여 cc 변환
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

const CACHE_HEADER = 'public, max-age=86400, stale-while-revalidate=3600';

export async function GET(req: NextRequest) {
  const vehicleId = req.nextUrl.searchParams.get('vehicle_id')?.trim() ?? '';

  if (!vehicleId) {
    return NextResponse.json({ error: 'vehicle_id 파라미터가 필요합니다' }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleSupabaseClient();

    const { data, error } = await supabase
      .from('vehicle_trims')
      .select('trim_name, base_price, fuel_type, displacement, fuel_eff_combined, co2_emission, drive_type')
      .eq('vehicle_id', vehicleId)
      .gt('base_price', 0)
      .order('display_order', { ascending: true })
      .order('base_price', { ascending: true });

    if (error) throw error;

    const res = NextResponse.json({ trims: data ?? [] });
    res.headers.set('Cache-Control', CACHE_HEADER);
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
