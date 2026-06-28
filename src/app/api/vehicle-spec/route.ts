import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

// GET ?slug= — 차종 스펙(연비·출력·배기량). vehicle_trims 기본 트림. 공개.
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ spec: null });
  const supabase = createServiceRoleSupabaseClient();
  const { data: v } = await supabase.from('vehicles').select('id').eq('slug', slug).maybeSingle();
  if (!v) return NextResponse.json({ spec: null });
  const { data: trims } = await supabase
    .from('vehicle_trims')
    .select('fuel_eff_combined, displacement, spec_powertrain, fuel_type')
    .eq('vehicle_id', v.id)
    .order('display_order', { ascending: true })
    .limit(1);
  const t = trims?.[0];
  if (!t) return NextResponse.json({ spec: null });
  return NextResponse.json({
    spec: {
      eff: t.fuel_eff_combined ? `${t.fuel_eff_combined}` : null,
      power: t.spec_powertrain ?? (t.displacement ? `${t.displacement}cc` : null),
      fuel: t.fuel_type ?? null,
    },
  });
}
