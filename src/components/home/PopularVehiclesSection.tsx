import Link from 'next/link';
import { getVehicleBySlug } from '@/constants/vehicles';
import type { Category } from '@/constants/vehicles';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { PopularVehiclesScroll } from './PopularVehiclesScroll';

const FALLBACK_SLUGS = [
  'avante', 'tucson', 'k5', 'sportage', 'sorento', 'ioniq5',
  'grandeur', 'santafe', 'k8', 'palisade', 'ioniq6', 'carnival',
  'qm6', 'xm3', 'torres', 'tivoli',
] as const;

interface PriceRangeRow {
  vehicle_id: string;
  min_monthly: number;
  max_monthly: number;
}

interface VehicleRow {
  slug: string;
  id: string;
  is_active: boolean | null;
  display_order: number | null;
}

export async function PopularVehiclesSection() {
  const vehicles = FALLBACK_SLUGS
    .map((slug) => getVehicleBySlug(slug))
    .filter((v): v is NonNullable<typeof v> => v != null);

  let priceMap: Record<string, { min: number; max: number }> = {};
  let settingMap = new Map<string, VehicleRow>();

  try {
    const supabase = await createServerSupabaseClient();

    // Step 1: vehicles 조회 (id 포함)
    const { data: allVehicles } = await supabase
      .from('vehicles')
      .select('slug, id, is_active, display_order');

    settingMap = new Map(
      (allVehicles ?? [])
        .filter((s: VehicleRow) => s.slug != null)
        .map((s: VehicleRow) => [s.slug, s])
    );

    // slug ↔ vehicle_id 매핑
    const vehicleIdBySlug = new Map<string, string>();
    const slugByVehicleId = new Map<string, string>();
    for (const s of (allVehicles ?? []) as VehicleRow[]) {
      if (s.slug && s.id) {
        vehicleIdBySlug.set(s.slug, s.id);
        slugByVehicleId.set(s.id, s.slug);
      }
    }

    // Step 2: pricing 조회 by vehicle_id
    const vehicleIds = vehicles
      .map((v) => vehicleIdBySlug.get(v.slug))
      .filter((id): id is string => id != null);

    if (vehicleIds.length > 0) {
      const { data: priceRanges } = await supabase
        .from('pricing')
        .select('vehicle_id, min_monthly, max_monthly')
        .in('vehicle_id', vehicleIds)
        .eq('is_active', true)
        .eq('contract_months', 36)
        .eq('annual_km', 20000)
        .gt('min_monthly', 0);

      for (const row of (priceRanges ?? []) as PriceRangeRow[]) {
        const slug = slugByVehicleId.get(row.vehicle_id);
        if (!slug) continue;
        const existing = priceMap[slug];
        if (!existing || row.min_monthly < existing.min) {
          priceMap[slug] = { min: row.min_monthly, max: row.max_monthly };
        }
      }
    }
  } catch {
    // Supabase 연결 실패 시 가격 없이 표시
  }

  const orderedVehicles = vehicles
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
      slug: v.slug,
      brand: v.brand,
      model: v.model,
      category: v.category as Category,
      imageKey: v.imageKey,
      price: priceMap[v.slug] ?? null,
    }));

  return (
    <section className="bg-background py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 px-5">
          <h2 className="text-primary font-bold text-xl">
            렌테일러 추천 차량
          </h2>
          <Link href="/popular-estimates" className="text-accent text-sm font-medium">
            전체보기 &rarr;
          </Link>
        </div>
        <PopularVehiclesScroll vehicles={orderedVehicles} />
      </div>
    </section>
  );
}
