import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { pickRepresentative, pickRepresentativeRow, type PowertrainRow } from '@/lib/vehicle-spec';

// GET ?slug=&fuel= — 차종 스펙(연비·주행거리·등급·배기량).
//   소스: vehicle_powertrains (service_role, RLS 우회). slug→vehicle_id 조인.
//   매칭키: powertrain.fuel_kind === fuel(=car.fuel FuelKey: gasoline|diesel|hybrid|ev, 영문 직접 일치).
//   대표행: 연료 분기 — EV는 electric_eff/driving_range, 그 외는 fuel_eff_combined max 1행.
// 공개.
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const slug = sp.get('slug');
  const fuel = sp.get('fuel'); // FuelKey 영문 — powertrain.fuel_kind 직접 매칭
  if (!slug) return NextResponse.json({ spec: null });

  const supabase = createServiceRoleSupabaseClient();
  const { data: v } = await supabase.from('vehicles').select('id').eq('slug', slug).maybeSingle();
  if (!v) return NextResponse.json({ spec: null });

  let q = supabase
    .from('vehicle_powertrains')
    .select('fuel_kind, fuel_eff_combined, electric_eff, driving_range, energy_grade, displacement_cc')
    .eq('vehicle_id', v.id);
  if (fuel) q = q.eq('fuel_kind', fuel); // fuel 없으면 vehicle 전체 행에서 fallback
  const { data } = await q;
  const rows = (data ?? []) as PowertrainRow[];
  if (rows.length === 0) return NextResponse.json({ spec: null });

  const isEv = fuel === 'ev';
  // eff/range/grade는 공용 헬퍼. power(cc)는 같은 대표행에서 route가 별도 유지(WL3 전까지).
  const { eff, range, grade } = pickRepresentative(rows, isEv);
  const rep = pickRepresentativeRow(rows, isEv);
  const power = rep?.displacement_cc != null ? `${rep.displacement_cc}cc` : null;

  return NextResponse.json({
    spec: { eff, power, fuel: fuel ?? null, range, grade },
  });
}
