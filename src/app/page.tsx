import { createServerSupabaseClient } from '@/lib/supabase-server';
import { VEHICLE_LIST } from '@/constants/vehicles';
import { HomeClient } from '@/components/home/HomeClient';

const TARGET_BRANDS = new Set(['현대', '기아', '제네시스', 'KGM', '르노코리아', '테슬라']);

interface VehicleRow {
  slug: string;
  id: string;
  is_active: boolean | null;
  display_order: number | null;
  spin_start_frame: number | null;
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
      supabase.from('vehicles').select('slug, id, is_active, display_order, spin_start_frame'),
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
      dbSpinStartFrame: settingMap.get(v.slug)?.spin_start_frame ?? null,
    }));

  return (
    <>
      {/* 서버 컴포넌트 — JS 없이 첫 번째 페인트에서 h1 즉시 렌더링 */}
      <div className="bg-primary text-white py-10 lg:max-w-2xl lg:mx-auto lg:rounded-2xl">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-xs text-accent font-semibold mb-3 tracking-widest uppercase">RenTailor</p>
          <h1 className="text-2xl font-bold leading-snug">
            내 차에 맞는<br />최적의 장기렌트를<br />찾아보세요
          </h1>
          <p className="text-sm text-white/60 mt-3">
            차량을 선택하고 무료 견적을 신청하세요
          </p>
          <a
            href="/estimate"
            className="mt-5 inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 bg-white text-primary rounded-xl font-bold text-base shadow-sm transition-transform active:scale-[0.98]"
          >
            30초 만에 월 렌트료 확인하기
          </a>
          <p className="text-xs text-white/50 mt-2">
            가입·전화번호 없이 바로 확인
          </p>
        </div>
      </div>
      <HomeClient vehicles={vehicles} />
    </>
  );
}
