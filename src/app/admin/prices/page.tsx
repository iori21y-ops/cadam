'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { VEHICLE_LIST } from '@/constants/vehicles';
import { VehicleEditor } from '@/components/admin/VehicleEditor';

interface VehicleSummary {
  slug: string;
  brand: string;
  model: string;
  thumbnailUrl: string | null;
  minCarPrice: number | null;
  maxCarPrice: number | null;
  priceCount: number;
  isCustom: boolean;
  isVisible: boolean;
  displayOrder: number;
}

const STATIC_BRANDS = ['현대', '기아', '제네시스'] as const;

export default function AdminPricesPage() {
  const [summaries, setSummaries] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set(['현대']));
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [addForm, setAddForm] = useState<{ brand: string; model: string } | null>(null);
  const [addSaving, setAddSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const [{ data: settings }, { data: prices }] = await Promise.all([
        supabase.from('vehicle_settings').select('vehicle_slug, thumbnail_url, min_car_price, max_car_price, is_visible, display_order, car_brand, car_model'),
        supabase.from('price_ranges').select('car_brand, car_model').eq('is_active', true),
      ]);

      const settingMap = new Map(
        (settings ?? []).map((s: Record<string, unknown>) => [s.vehicle_slug as string, s])
      );

      const priceCountMap = new Map<string, number>();
      for (const p of (prices ?? []) as { car_brand: string; car_model: string }[]) {
        const key = `${p.car_brand}||${p.car_model}`;
        priceCountMap.set(key, (priceCountMap.get(key) ?? 0) + 1);
      }

      // Brand-local index for default display_order
      const brandLocalIdx: Record<string, number> = {};
      const list: VehicleSummary[] = VEHICLE_LIST.map((v) => {
        const pos = brandLocalIdx[v.brand] ?? 0;
        brandLocalIdx[v.brand] = pos + 1;
        const s = settingMap.get(v.slug) as Record<string, unknown> | undefined;
        return {
          slug: v.slug,
          brand: v.brand,
          model: v.model,
          thumbnailUrl: (s?.thumbnail_url as string) ?? null,
          minCarPrice: (s?.min_car_price as number) ?? null,
          maxCarPrice: (s?.max_car_price as number) ?? null,
          priceCount: priceCountMap.get(`${v.brand}||${v.model}`) ?? 0,
          isCustom: false,
          isVisible: (s?.is_visible as boolean) ?? true,
          displayOrder: (s?.display_order as number) ?? pos * 1000,
        };
      });

      // Custom vehicles (in vehicle_settings but not in VEHICLE_LIST)
      const vehicleListSlugs = new Set(VEHICLE_LIST.map((v) => v.slug));
      for (const s of (settings ?? []) as Record<string, unknown>[]) {
        if (!vehicleListSlugs.has(s.vehicle_slug as string) && s.car_brand && s.car_model) {
          list.push({
            slug: s.vehicle_slug as string,
            brand: s.car_brand as string,
            model: s.car_model as string,
            thumbnailUrl: (s.thumbnail_url as string) ?? null,
            minCarPrice: (s.min_car_price as number) ?? null,
            maxCarPrice: (s.max_car_price as number) ?? null,
            priceCount: priceCountMap.get(`${s.car_brand}||${s.car_model}`) ?? 0,
            isCustom: true,
            isVisible: (s.is_visible as boolean) ?? true,
            displayOrder: (s.display_order as number) ?? 999,
          });
        }
      }

      setSummaries(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allBrands = [
    ...STATIC_BRANDS,
    ...summaries.filter((s) => s.isCustom && !STATIC_BRANDS.includes(s.brand as typeof STATIC_BRANDS[number])).map((s) => s.brand),
  ].filter((b, i, arr) => arr.indexOf(b) === i);

  const toggleBrand = (brand: string) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand); else next.add(brand);
      return next;
    });
  };

  const handleOpen = (v: VehicleSummary) => {
    setSelectedSlug(v.slug);
    setSelectedBrand(v.isCustom ? v.brand : null);
    setSelectedModel(v.isCustom ? v.model : null);
    setEditorOpen(true);
  };

  const toggleVisible = async (v: VehicleSummary) => {
    const supabase = createBrowserSupabaseClient();
    await supabase.from('vehicle_settings').upsert({
      vehicle_slug: v.slug,
      car_brand: v.brand,
      car_model: v.model,
      is_visible: !v.isVisible,
      display_order: v.displayOrder,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'vehicle_slug' });
    await fetchData();
  };

  const moveOrder = async (brandVehicles: VehicleSummary[], idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= brandVehicles.length) return;

    const newOrder = [...brandVehicles];
    [newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]];

    const supabase = createBrowserSupabaseClient();
    await Promise.all(
      newOrder.map((v, i) =>
        supabase.from('vehicle_settings').upsert({
          vehicle_slug: v.slug,
          car_brand: v.brand,
          car_model: v.model,
          is_visible: v.isVisible,
          display_order: i,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'vehicle_slug' })
      )
    );
    await fetchData();
  };

  const handleAddVehicle = async () => {
    if (!addForm?.brand.trim() || !addForm?.model.trim()) return;
    setAddSaving(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const slug = `custom-${addForm.brand.trim()}-${addForm.model.trim()}`.replace(/\s+/g, '-');
      await supabase.from('vehicle_settings').upsert({
        vehicle_slug: slug,
        car_brand: addForm.brand.trim(),
        car_model: addForm.model.trim(),
        is_visible: true,
        display_order: 999,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'vehicle_slug' });
      const newBrand = addForm.brand.trim();
      const newModel = addForm.model.trim();
      setAddForm(null);
      await fetchData();
      setSelectedSlug(slug);
      setSelectedBrand(newBrand);
      setSelectedModel(newModel);
      setEditorOpen(true);
      setExpandedBrands((prev) => new Set([...prev, newBrand]));
    } catch {
      // ignore
    } finally {
      setAddSaving(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto p-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-primary">인기차종 관리</h1>
        <button
          type="button"
          onClick={() => setAddForm({ brand: '', model: '' })}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90"
        >
          + 새 차종 추가
        </button>
      </div>

      {/* 새 차종 추가 폼 */}
      {addForm && (
        <div className="mb-4 p-4 rounded-xl border border-accent bg-[#EBF5FB]">
          <p className="text-sm font-bold text-gray-700 mb-3">새 차종 추가</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="제조사 (예: BMW)"
              value={addForm.brand}
              onChange={(e) => setAddForm((f) => f ? { ...f, brand: e.target.value } : f)}
              className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-accent"
            />
            <input
              type="text"
              placeholder="차종명 (예: 5시리즈)"
              value={addForm.model}
              onChange={(e) => setAddForm((f) => f ? { ...f, model: e.target.value } : f)}
              className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={handleAddVehicle}
              disabled={addSaving}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
            >
              {addSaving ? '추가 중...' : '추가'}
            </button>
            <button
              type="button"
              onClick={() => setAddForm(null)}
              className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-200"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {allBrands.map((brand) => {
            const vehicles = summaries
              .filter((s) => s.brand === brand)
              .sort((a, b) => a.displayOrder - b.displayOrder);
            if (vehicles.length === 0) return null;
            const isExpanded = expandedBrands.has(brand);
            const registeredCount = vehicles.filter((v) => v.priceCount > 0).length;
            return (
              <div key={brand} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-gray-900">{brand}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{registeredCount}/{vehicles.length} 등록</span>
                    <span className="text-gray-400 text-sm">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {vehicles.map((v, idx) => (
                      <div key={v.slug} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50/50">
                        {/* 클릭 가능 영역 (편집 열기) */}
                        <button
                          type="button"
                          onClick={() => handleOpen(v)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <div className="shrink-0 w-14 h-9 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                            {v.thumbnailUrl ? (
                              <img src={v.thumbnailUrl} alt={v.model} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-gray-300 text-base">🚗</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{v.model}</p>
                            {v.minCarPrice ? (
                              <p className="text-xs text-gray-500">
                                {Math.round(v.minCarPrice / 10000).toLocaleString()}~{Math.round((v.maxCarPrice ?? 0) / 10000).toLocaleString()}만원
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400">차량가격 미등록</p>
                            )}
                          </div>
                          <div className="shrink-0 mr-1">
                            {v.priceCount > 0 ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/20 text-success">
                                {v.priceCount}건
                              </span>
                            ) : (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                                미등록
                              </span>
                            )}
                          </div>
                        </button>
                        {/* 컨트롤 버튼 */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleVisible(v)}
                            className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                              v.isVisible
                                ? 'bg-success/20 text-success hover:bg-success/30'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {v.isVisible ? '노출' : '비노출'}
                          </button>
                          <button
                            type="button"
                            onClick={() => moveOrder(vehicles, idx, -1)}
                            disabled={idx === 0}
                            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 text-xs"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveOrder(vehicles, idx, 1)}
                            disabled={idx === vehicles.length - 1}
                            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 text-xs"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editorOpen && (
          <VehicleEditor
            key={selectedSlug}
            vehicleSlug={selectedSlug}
            isOpen={editorOpen}
            onClose={() => { setEditorOpen(false); setSelectedSlug(null); setSelectedBrand(null); setSelectedModel(null); }}
            onSuccess={fetchData}
            customBrand={selectedBrand ?? undefined}
            customModel={selectedModel ?? undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
