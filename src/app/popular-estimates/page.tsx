import { Suspense } from 'react';
import { VEHICLE_LIST } from '@/constants/vehicles';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ButtonLink } from '@/components/ui/Button';
import { PopularEstimatesClient } from './PopularEstimatesClient';
import type { VehicleCard, PricingEntry } from './types';

export const revalidate = 60;

const DOMESTIC_BRANDS = new Set(['현대', '기아', '제네시스', 'KGM', '르노코리아', '쉐보레']);
const vehicleLocalMap = new Map(VEHICLE_LIST.map(v => [v.slug, v]));

function VehiclesSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between bg-white rounded-2xl border border-border-solid p-4 animate-pulse"
        >
          <div className="flex flex-col gap-2 flex-1 mr-4">
            <div className="h-3 bg-gray-100 rounded w-14" />
            <div className="h-5 bg-gray-100 rounded w-32" />
            <div className="h-3 bg-gray-100 rounded w-20" />
            <div className="h-5 bg-gray-100 rounded w-24 mt-1" />
          </div>
          <div className="w-32 h-20 bg-gray-100 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
}

async function VehicleListSection() {
  const supabase = await createServerSupabaseClient();

  const { data: dbVehicles } = await supabase
    .from('vehicles')
    .select('id, slug, name, brand, category, fuel_type, base_price, image_key, display_order')
    .eq('is_active', true);

  if (!dbVehicles?.length) return <PopularEstimatesClient vehicles={[]} />;

  const vehicleIds = dbVehicles.map(v => v.id);

  // 전 계약기간 / 10000km 기준 pricing 수집 (필터링용)
  const { data: priceRows } = await supabase
    .from('pricing')
    .select('vehicle_id, min_monthly, contract_months, conditions')
    .in('vehicle_id', vehicleIds)
    .eq('is_active', true)
    .eq('annual_km', 10000)
    .gt('min_monthly', 0)
    .limit(5000);

  // vehicle별 pricing options 집계
  const pricingByVehicle = new Map<string, PricingEntry[]>();
  const defaultPriceMap = new Map<string, number>(); // 60개월/rent 기본 가격

  for (const row of priceRows ?? []) {
    const cond = row.conditions as { product_type?: string; deposit_rate?: number } | null;
    const productType = (cond?.product_type ?? 'rent') as PricingEntry['productType'];
    const depositRate = typeof cond?.deposit_rate === 'number' ? cond.deposit_rate : 0;

    const entry: PricingEntry = {
      contractMonths: row.contract_months,
      productType,
      depositZero: depositRate === 0,
      minMonthly: row.min_monthly,
    };

    const arr = pricingByVehicle.get(row.vehicle_id) ?? [];
    arr.push(entry);
    pricingByVehicle.set(row.vehicle_id, arr);

    // 기본 표시 가격: 60개월 rent 최저
    if (row.contract_months === 60 && productType === 'rent') {
      const existing = defaultPriceMap.get(row.vehicle_id);
      if (!existing || row.min_monthly < existing) {
        defaultPriceMap.set(row.vehicle_id, row.min_monthly);
      }
    }
  }

  const vehicles: VehicleCard[] = dbVehicles
    .filter(v => v.slug)
    .map(v => {
      const local = vehicleLocalMap.get(v.slug!);
      return {
        id: v.id,
        slug: v.slug!,
        name: v.name,
        brand: v.brand ?? '',
        category: v.category ?? '',
        fuelType: v.fuel_type ?? '',
        basePrice: v.base_price ?? null,
        imageKey: local?.imageKey ?? v.image_key ?? null,
        displayOrder: v.display_order ?? 999,
        isDomestic: DOMESTIC_BRANDS.has(v.brand ?? ''),
        price: defaultPriceMap.has(v.id) ? { min: defaultPriceMap.get(v.id)! } : null,
        pricingOptions: pricingByVehicle.get(v.id) ?? [],
      };
    });

  return <PopularEstimatesClient vehicles={vehicles} />;
}

export default function PopularEstimatesPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-24">
      <div className="px-4 pt-8 max-w-lg mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-text tracking-tight">전체 차종</h1>
          <p className="text-sm text-text-sub mt-1">60개월 기준 · 월 납부금 비교</p>
        </div>

        <Suspense fallback={<VehiclesSkeleton />}>
          <VehicleListSection />
        </Suspense>

        <div className="mt-8 p-5 rounded-2xl bg-white border border-border-solid text-center">
          <p className="text-sm text-text font-semibold mb-1">내 조건에 맞는 차량이 없으신가요?</p>
          <p className="text-xs text-text-sub mb-4">맞춤 견적을 무료로 받아보세요</p>
          <ButtonLink href="/quote" variant="primary" size="lg" fullWidth>
            무료 견적 받기
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
