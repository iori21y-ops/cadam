/**
 * /api/vehicle-msrp — 차량 신차가(MSRP) 조회
 *
 * GET ?brand=현대&model=아반떼
 *   → 해당 모델의 전체 트림 목록 반환
 *   응답: { trims: [{ trim_name, msrp_price, fuel_type, model_year }] }
 *
 * GET ?brand=현대&model=아반떼&trim=스마트
 *   → 특정 트림의 신차가 반환 (최신 연식 우선)
 *   응답: { trim_name, msrp_price, fuel_type, model_year }
 *
 * 데이터 소스: Supabase vehicle_msrp 테이블
 * 캐싱: 24시간 (신차가는 변경 빈도가 낮음)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

/** 응답 캐시 헤더 — 24시간 캐시, 1시간 stale-while-revalidate */
const CACHE_HEADER = 'public, max-age=86400, stale-while-revalidate=3600';

export async function GET(req: NextRequest) {
  const sp    = req.nextUrl.searchParams;
  const brand = sp.get('brand')?.trim() ?? '';
  const model = sp.get('model')?.trim() ?? '';
  const trim  = sp.get('trim')?.trim()  ?? '';

  if (!brand || !model) {
    return NextResponse.json(
      { error: 'brand, model 파라미터가 필요합니다' },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceRoleSupabaseClient();

    // ── 특정 트림 단건 조회 ───────────────────────────────────────────
    if (trim) {
      const { data, error } = await supabase
        .from('vehicle_msrp')
        .select('trim_name, msrp_price, fuel_type, model_year')
        .eq('brand', brand)
        .eq('model', model)
        .eq('trim_name', trim)
        .order('model_year', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // PGRST116 = 결과 0건 (PostgREST single() 에러 코드)
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: '해당 트림을 찾을 수 없습니다' },
            { status: 404 },
          );
        }
        throw error;
      }

      const res = NextResponse.json(data);
      res.headers.set('Cache-Control', CACHE_HEADER);
      return res;
    }

    // ── 전체 트림 목록 조회 ───────────────────────────────────────────
    const { data, error } = await supabase
      .from('vehicle_msrp')
      .select('trim_name, msrp_price, fuel_type, model_year')
      .eq('brand', brand)
      .eq('model', model)
      .order('model_year', { ascending: false })
      .order('msrp_price', { ascending: true });

    if (error) throw error;

    const res = NextResponse.json({ trims: data ?? [] });
    res.headers.set('Cache-Control', CACHE_HEADER);
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
