import { createServerSupabaseClient } from '@/lib/supabase-server';
import { VEHICLE_LIST } from '@/constants/vehicles';
import { HomeClient } from '@/components/home/HomeClient';

const TARGET_BRANDS = new Set(['현대', '기아', '제네시스', 'KGM', '르노코리아', '테슬라']);

interface VehicleRow {
  slug: string;
  id: string;
  is_active: boolean | null;
  display_order: number | null;
}

interface PriceRangeRow {
  vehicle_id: string;
  min_monthly: number;
  max_monthly: number;
}

export default async function HomePage() {
  let settingMap = new Map<string, VehicleRow>();
  let priceMap: Record<string, { min: number; max: number }> = {};

  try {
    const supabase = await createServerSupabaseClient();
    const [{ data: allVehicles }, { data: priceRanges }] = await Promise.all([
      supabase.from('vehicles').select('slug, id, is_active, display_order'),
      supabase
        .from('pricing')
        .select('vehicle_id, min_monthly, max_monthly')
        .eq('is_active', true)
        .eq('contract_months', 36)
        .eq('annual_km', 20000)
        .gt('min_monthly', 0),
    ]);

    settingMap = new Map(
      (allVehicles ?? [])
        .filter((s: VehicleRow) => s.slug != null)
        .map((s: VehicleRow) => [s.slug, s])
    );

    const slugByVehicleId = new Map<string, string>();
    for (const s of (allVehicles ?? []) as VehicleRow[]) {
      if (s.slug && s.id) slugByVehicleId.set(s.id, s.slug);
    }
    for (const row of (priceRanges ?? []) as PriceRangeRow[]) {
      const slug = slugByVehicleId.get(row.vehicle_id);
      if (!slug) continue;
      const existing = priceMap[slug];
      if (!existing || row.min_monthly < existing.min) {
        priceMap[slug] = { min: row.min_monthly, max: row.max_monthly };
      }
    }
  } catch {
    // Supabase 연결 실패 시 가격·is_active 없이 표시
  }

  const vehicles = VEHICLE_LIST
    .filter((v) => TARGET_BRANDS.has(v.brand))
    .filter((v) => {
      const s = settingMap.get(v.slug);
      return s == null || s.is_active !== false;
    })
    .sort((a, b) => {
      const aOrder = settingMap.get(a.slug)?.display_order ?? 999;
      const bOrder = settingMap.get(b.slug)?.display_order ?? 999;
      return aOrder - bOrder;
    })
    .map((v) => ({
      ...v,
      isActive: settingMap.get(v.slug)?.is_active !== false,
      displayOrder: settingMap.get(v.slug)?.display_order ?? 999,
      price: priceMap[v.slug] ?? null,
    }));

  return <HomeClient vehicles={vehicles} />;
}
