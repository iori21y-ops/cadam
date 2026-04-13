import Link from 'next/link';
import { getVehicleBySlug } from '@/constants/vehicles';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { PopularVehiclesScroll } from './PopularVehiclesScroll';

const FALLBACK_SLUGS = [
  'avante', 'tucson', 'k5', 'sportage', 'sorento', 'ioniq5',
  'grandeur', 'santafe', 'k8', 'palisade', 'ioniq6', 'carnival',
] as const;

interface PriceRangeRow {
  car_brand: string;
  car_model: string;
  min_monthly: number;
  max_monthly: number;
}

interface VehicleRow {
  slug: string;
  is_active: boolean | null;
  display_order: number | null;
}

export async function PopularVehiclesSection() {
  const vehicles = FALLBACK_SLUGS
    .map((slug) => getVehicleBySlug(slug))
    .filter((v): v is NonNullable<typeof v> => v != null);

  const allModels = vehicles.map((v) => v.model);

  let priceMap: Record<string, { min: number; max: number }> = {};
  let settingMap = new Map<string, VehicleRow>();

  try {
    const supabase = await createServerSupabaseClient();
    const [{ data: allVehicles }, { data: priceRanges }] = await Promise.all([
      supabase.from('vehicles').select('slug, is_active, display_order'),
      supabase
        .from('pricing')
        .select('car_brand, car_model, min_monthly, max_monthly')
        .in('car_model', allModels)
        .eq('is_active', true)
        .eq('contract_months', 36)
        .eq('annual_km', 20000),
    ]);

    settingMap = new Map(
      (allVehicles ?? [])
        .filter((s: VehicleRow) => s.slug != null)
        .map((s: VehicleRow) => [s.slug, s])
    );

    for (const row of (priceRanges ?? []) as PriceRangeRow[]) {
      const key = `${row.car_brand}-${row.car_model}`;
      const existing = priceMap[key];
      if (!existing || row.min_monthly < existing.min) {
        priceMap[key] = { min: row.min_monthly, max: row.max_monthly };
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
      model: v.model,
      imageKey: v.imageKey,
      price: priceMap[`${v.brand}-${v.model}`] ?? null,
    }));

  return (
    <section className="bg-background py-12 px-5">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-primary font-bold text-xl">
            렌테일러가 추천하는 차량
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
