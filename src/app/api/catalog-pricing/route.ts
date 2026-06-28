import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

// GET — 차종 slug → 최저 월납(만원). pricing⋈vehicles. 카탈로그 from(근사) 실값 덮어쓰기용.
// 공개(고객 사이트). 캐시 60s.
export const revalidate = 60;

export async function GET() {
  const supabase = createServiceRoleSupabaseClient();
  // pricing(min_monthly 원) ⋈ vehicles(slug). 활성차 최저.
  const { data, error } = await supabase
    .from('pricing')
    .select('min_monthly, vehicles!inner(slug, is_active)')
    .not('min_monthly', 'is', null);
  if (error) return NextResponse.json({ prices: {} });
  const map: Record<string, number> = {};
  for (const row of (data ?? []) as unknown as { min_monthly: number; vehicles: { slug: string; is_active: boolean } }[]) {
    const v = row.vehicles;
    if (!v?.is_active || !v.slug || row.min_monthly == null) continue;
    const manwon = Math.round(row.min_monthly / 10000);
    if (manwon <= 0) continue;
    if (map[v.slug] == null || manwon < map[v.slug]) map[v.slug] = manwon;
  }
  return NextResponse.json({ prices: map });
}
