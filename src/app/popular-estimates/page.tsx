import { Suspense } from 'react';
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

function VehiclesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border-2 border-gray-200 bg-white overflow-hidden animate-pulse">
          <div className="w-full aspect-[5/3] bg-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-2.5 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function VehicleListSection() {
  const supabase = await createServerSupabaseClient();

  const { data: allSettings } = await supabase
    .from('vehicle_settings')
    .select('vehicle_slug, is_visible, display_order');

  const settingMap = new Map(
    (allSettings ?? []).map((s: VehicleSettingRow) => [s.vehicle_slug, s])
  );

  const orderedVehicles = FALLBACK_SLUGS
    .map((slug) => getVehicleBySlug(slug))
    .filter((v): v is NonNullable<typeof v> => v != null)
    .filter((v) => {
      const s = settingMap.get(v.slug);
      return s == null || s.is_visible !== false;
    })
    .sort((a, b) => {
      const aOrder = settingMap.get(a.slug)?.display_order ?? 999;
      const bOrder = settingMap.get(b.slug)?.display_order ?? 999;
      return aOrder - bOrder;
    });

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

  return <PopularEstimatesClient vehicles={vehicles} />;
}

export default function PopularEstimatesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 헤더 - 즉시 렌더링 */}
      <section className="bg-gradient-to-br from-primary to-accent text-white px-5 py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">인기차종 견적 미리보기</h1>
        <p className="text-white/85 text-sm">
          36개월 · 연 2만km 기준 월 납부금 (보증금 0원)
        </p>
      </section>

      {/* 차종 목록 - DB 응답 전까지 스켈레톤 표시 */}
      <section className="px-5 py-8 flex-1">
        <Suspense fallback={<VehiclesSkeleton />}>
          <VehicleListSection />
        </Suspense>
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
