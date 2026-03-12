import Link from 'next/link';
import { getVehicleBySlug, VEHICLE_LIST } from '@/constants/vehicles';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Footer } from '@/components/Footer';
import { PopularEstimatesClient } from './PopularEstimatesClient';

export const revalidate = 3600;

const FALLBACK_SLUGS = [
  'avante',
  'tucson',
  'k5',
  'sportage',
  'sorento',
  'ioniq5',
  'grandeur',
  'santafe',
  'k8',
  'palisade',
  'ioniq6',
  'carnival',
] as const;

interface PriceRangeRow {
  car_brand: string;
  car_model: string;
  contract_months: number;
  annual_km: number;
  min_monthly: number;
  max_monthly: number;
}

interface VehicleSettingRow {
  vehicle_slug: string;
  is_visible: boolean | null;
  display_order: number | null;
}

export default async function PopularEstimatesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: visibleSettings } = await supabase
    .from('vehicle_settings')
    .select('vehicle_slug, is_visible, display_order')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  // Determine which vehicles to show and in what order
  let orderedVehicles;
  if (visibleSettings && visibleSettings.length > 0) {
    // Use vehicle_settings ordering (only VEHICLE_LIST vehicles for now)
    orderedVehicles = (visibleSettings as VehicleSettingRow[])
      .map((s) => getVehicleBySlug(s.vehicle_slug))
      .filter((v): v is NonNullable<typeof v> => v !== null);
  } else {
    // Fallback to hardcoded list
    orderedVehicles = FALLBACK_SLUGS
      .map((slug) => getVehicleBySlug(slug))
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }

  const { data: priceRanges } = await supabase
    .from('price_ranges')
    .select('car_brand, car_model, contract_months, annual_km, min_monthly, max_monthly')
    .in('car_model', orderedVehicles.map((v) => v.model))
    .eq('is_active', true)
    .eq('contract_months', 36)
    .eq('annual_km', 20000);

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <section className="bg-gradient-to-br from-primary to-accent text-white px-5 py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">인기차종 견적 미리보기</h1>
        <p className="text-white/85 text-sm">
          36개월 · 연 2만km 기준 월 납부금 (보증금 0원)
        </p>
      </section>

      {/* 차종 목록 */}
      <section className="px-5 py-8 flex-1">
        <PopularEstimatesClient vehicles={vehicles} />
      </section>

      {/* 하단 CTA */}
      <section className="px-5 py-8 text-center bg-white border-t border-gray-200">
        <p className="text-gray-600 text-sm mb-4">
          내 조건에 맞는 정확한 견적을 받아보세요
        </p>
        <Link
          href="/quote"
          className="inline-block px-8 py-3.5 rounded-lg font-bold bg-accent text-white hover:opacity-90 transition-opacity"
        >
          무료 견적 받기
        </Link>
      </section>

      <Footer />
    </div>
  );
}
