import { Suspense } from 'react';
import { getVehicleBySlug } from '@/constants/vehicles';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ButtonLink } from '@/components/ui/Button';
import { PopularEstimatesClient } from './PopularEstimatesClient';

export const revalidate = 3600;

const FALLBACK_SLUGS = [
  // 현대
  'avante', 'tucson', 'k5', 'sportage', 'sorento', 'ioniq5',
  'grandeur', 'santafe', 'k8', 'palisade', 'ioniq6', 'carnival',
  // 르노코리아
  'qm6', 'xm3', 'xm3-hybrid', 'arkana', 'master',
  // KGM
  'tivoli', 'korando', 'korando-ev', 'torres', 'torres-evx',
  'rexton', 'rexton-sports', 'rexton-sports-khan',
] as const;

interface PriceRangeRow {
  car_brand: string;
  car_model: string;
  contract_months: number;
  annual_km: number;
  min_monthly: number;
  max_monthly: number;
}

interface VehicleRow {
  slug: string;
  is_active: boolean | null;
  display_order: number | null;
}

function VehiclesSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-white rounded-2xl border border-border-solid p-3 animate-pulse"
        >
          <div className="w-8 h-8 bg-surface-secondary rounded-full" />
          <div className="w-20 h-14 bg-surface-secondary rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-surface-secondary rounded w-2/3" />
            <div className="h-3 bg-surface-secondary rounded w-1/2" />
            <div className="h-3.5 bg-surface-secondary rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function VehicleListSection() {
  const supabase = await createServerSupabaseClient();

  const allModels = FALLBACK_SLUGS
    .map((slug) => getVehicleBySlug(slug))
    .filter((v): v is NonNullable<ReturnType<typeof getVehicleBySlug>> => v != null)
    .map((v) => v.model);

  const [{ data: allVehicles }, { data: priceRanges }] = await Promise.all([
    supabase.from('vehicles').select('slug, is_active, display_order'),
    supabase
      .from('pricing')
      .select('car_brand, car_model, contract_months, annual_km, min_monthly, max_monthly')
      .in('car_model', allModels)
      .eq('is_active', true)
      .eq('contract_months', 36)
      .eq('annual_km', 20000),
  ]);

  const settingMap = new Map(
    (allVehicles ?? [])
      .filter((s: VehicleRow) => s.slug != null)
      .map((s: VehicleRow) => [s.slug, s])
  );

  const orderedVehicles = FALLBACK_SLUGS
    .map((slug) => getVehicleBySlug(slug))
    .filter((v): v is NonNullable<typeof v> => v != null)
    .filter((v) => {
      const s = settingMap.get(v.slug);
      return s == null || s.is_active !== false;
    })
    .sort((a, b) => {
      const aOrder = settingMap.get(a.slug)?.display_order ?? 999;
      const bOrder = settingMap.get(b.slug)?.display_order ?? 999;
      return aOrder - bOrder;
    });

  const priceMap: Record<string, { min: number; max: number }> = {};
  for (const row of (priceRanges ?? []) as PriceRangeRow[]) {
    const key = `${row.car_brand}-${row.car_model}`;
    const existing = priceMap[key];
    if (!existing || row.min_monthly < existing.min) {
      priceMap[key] = { min: row.min_monthly, max: row.max_monthly };
    }
  }

  const vehicles = orderedVehicles.map((v) => {
    const price = priceMap[`${v.brand}-${v.model}`] ?? null;
    return { ...v, price };
  });

  return <PopularEstimatesClient vehicles={vehicles} />;
}

export default function PopularEstimatesPage() {
  return (
    <div className="min-h-screen bg-surface-secondary pb-24">
      <div className="px-5 pt-8 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-text tracking-tight">인기 차종</h1>
          <p className="text-sm text-text-sub mt-1">36개월 기준 · 보증금 0원</p>
        </div>

        <Suspense fallback={<VehiclesSkeleton />}>
          <VehicleListSection />
        </Suspense>

        <div className="mt-8 p-5 rounded-2xl bg-white border border-border-solid text-center">
          <p className="text-sm text-text font-semibold mb-1">원하는 차량이 없으신가요?</p>
          <p className="text-xs text-text-sub mb-4">내 조건에 맞는 맞춤 견적을 받아보세요</p>
          <ButtonLink href="/quote" variant="primary" size="lg" fullWidth>
            무료 견적 받기
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
