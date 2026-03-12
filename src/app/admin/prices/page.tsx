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
}

const BRANDS = ['현대', '기아', '제네시스'] as const;

export default function AdminPricesPage() {
  const [summaries, setSummaries] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set(['현대']));
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const [{ data: settings }, { data: prices }] = await Promise.all([
        supabase.from('vehicle_settings').select('vehicle_slug, thumbnail_url, min_car_price, max_car_price'),
        supabase.from('price_ranges').select('car_brand, car_model').eq('is_active', true),
      ]);

      const settingMap = new Map(
        (settings ?? []).map((s: { vehicle_slug: string; thumbnail_url: string | null; min_car_price: number | null; max_car_price: number | null }) => [
          s.vehicle_slug,
          { thumbnailUrl: s.thumbnail_url, minCarPrice: s.min_car_price, maxCarPrice: s.max_car_price },
        ])
      );

      const priceCount = new Map<string, number>();
      for (const p of (prices ?? []) as { car_brand: string; car_model: string }[]) {
        const v = VEHICLE_LIST.find((x) => x.brand === p.car_brand && x.model === p.car_model);
        if (v) priceCount.set(v.slug, (priceCount.get(v.slug) ?? 0) + 1);
      }

      const list: VehicleSummary[] = VEHICLE_LIST.map((v) => {
        const s = settingMap.get(v.slug);
        return {
          slug: v.slug,
          brand: v.brand,
          model: v.model,
          thumbnailUrl: s?.thumbnailUrl ?? null,
          minCarPrice: s?.minCarPrice ?? null,
          maxCarPrice: s?.maxCarPrice ?? null,
          priceCount: priceCount.get(v.slug) ?? 0,
        };
      });

      setSummaries(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleBrand = (brand: string) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand); else next.add(brand);
      return next;
    });
  };

  const handleOpen = (slug: string) => {
    setSelectedSlug(slug);
    setEditorOpen(true);
  };

  return (
    <div className="max-w-[1200px] mx-auto p-5">
      <h1 className="text-xl font-bold text-primary mb-6">인기차종 관리</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {BRANDS.map((brand) => {
            const vehicles = summaries.filter((s) => s.brand === brand);
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
                    {vehicles.map((v) => (
                      <button
                        key={v.slug}
                        type="button"
                        onClick={() => handleOpen(v.slug)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        {/* 썸네일 */}
                        <div className="shrink-0 w-16 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                          {v.thumbnailUrl ? (
                            <img src={v.thumbnailUrl} alt={v.model} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-gray-300 text-lg">🚗</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{v.model}</p>
                          {v.minCarPrice ? (
                            <p className="text-xs text-gray-500">
                              {Math.round(v.minCarPrice / 10000).toLocaleString()}만 ~ {Math.round((v.maxCarPrice ?? 0) / 10000).toLocaleString()}만원
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400">차량가격 미등록</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {v.priceCount > 0 ? (
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-success/20 text-success">
                              {v.priceCount}건
                            </span>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-400">
                              미등록
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 text-sm shrink-0">›</span>
                      </button>
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
            onClose={() => { setEditorOpen(false); setSelectedSlug(null); }}
            onSuccess={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
