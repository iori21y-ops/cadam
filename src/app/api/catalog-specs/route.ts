import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { pickRepresentative, type PowertrainRow, type RepSpec } from '@/lib/vehicle-spec';

// GET — 전 차종 스펙 배치. vehicle_powertrains ⋈ vehicles(slug). service_role(RLS 우회).
//   per-slug per-fuel_kind 대표행 → 클라(카드)가 자기 car.fuel 로 골라씀.
// 공개. 캐시 60s (catalog-pricing 동일 정책).
export const revalidate = 60;

interface JoinedRow extends PowertrainRow {
  fuel_kind: string | null;
  vehicles: { slug: string | null } | null;
}

export async function GET() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('vehicle_powertrains')
    .select('fuel_kind, fuel_eff_combined, electric_eff, driving_range, energy_grade, displacement_cc, vehicles!inner(slug)');
  if (error) return NextResponse.json({ specs: {} });

  // (slug, fuel_kind) 그룹핑
  const groups: Record<string, Record<string, PowertrainRow[]>> = {};
  for (const row of (data ?? []) as unknown as JoinedRow[]) {
    const slug = row.vehicles?.slug;
    const fk = row.fuel_kind;
    if (!slug || !fk) continue;
    ((groups[slug] ??= {})[fk] ??= []).push(row);
  }

  // 그룹별 대표행 → { [slug]: { [fuel_kind]: {eff,range,grade} } }
  const specs: Record<string, Record<string, RepSpec>> = {};
  for (const slug of Object.keys(groups)) {
    specs[slug] = {};
    for (const fk of Object.keys(groups[slug])) {
      specs[slug][fk] = pickRepresentative(groups[slug][fk], fk === 'ev');
    }
  }

  return NextResponse.json({ specs });
}
