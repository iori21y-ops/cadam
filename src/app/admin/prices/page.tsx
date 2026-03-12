'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { PriceEditor, type PriceRangeData } from '@/components/admin/PriceEditor';
import type { Brand } from '@/constants/vehicles';

type PriceRow = PriceRangeData;

type BrandKey = Brand;

export default function AdminPricesPage() {
  const [priceRanges, setPriceRanges] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBrands, setExpandedBrands] = useState<Set<BrandKey>>(new Set(['현대']));
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceRangeData | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: err } = await supabase
        .from('price_ranges')
        .select('id, car_brand, car_model, contract_months, annual_km, min_monthly, max_monthly, conditions')
        .order('car_brand')
        .order('car_model')
        .order('contract_months')
        .order('annual_km');

      if (err) throw err;
      setPriceRanges((data as PriceRow[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '목록 로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const toggleBrand = (brand: BrandKey) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) {
        next.delete(brand);
      } else {
        next.add(brand);
      }
      return next;
    });
  };

  const handleAddNew = () => {
    setEditingPrice(null);
    setEditorOpen(true);
  };

  const handleEdit = (row: PriceRangeData) => {
    setEditingPrice(row);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingPrice(null);
  };

  const brands: BrandKey[] = ['현대', '기아', '제네시스'];
  const groupedByBrand = brands.map((brand) => {
    const rows = priceRanges.filter((r) => r.car_brand === brand);
    const byModel = new Map<string, PriceRow[]>();
    for (const row of rows) {
      const list = byModel.get(row.car_model) ?? [];
      list.push(row);
      byModel.set(row.car_model, list);
    }
    return { brand, byModel };
  });

  return (
    <div className="max-w-[1200px] mx-auto p-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-primary">가격표 관리</h1>
        <button
          type="button"
          onClick={handleAddNew}
          className="px-4 py-2 rounded-lg font-bold bg-accent text-white hover:opacity-90 transition-opacity"
        >
          새 가격 추가
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-danger font-medium">{error}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {groupedByBrand.map(({ brand, byModel }) => {
            const isExpanded = expandedBrands.has(brand);
            const modelCount = byModel.size;
            const rowCount = priceRanges.filter((r) => r.car_brand === brand).length;

            return (
              <div key={brand} className="border-b border-gray-100 last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-gray-900">
                    └ {brand}
                  </span>
                  <span className="text-sm text-gray-500">
                    {rowCount}건
                  </span>
                  <span className="text-gray-400">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </button>
                {isExpanded && (
                  <div className="bg-gray-50/50">
                    {Array.from(byModel.entries()).map(([model, rows]) => (
                      <div key={`${brand}-${model}`} className="border-t border-gray-100">
                        {rows
                          .sort(
                            (a, b) =>
                              a.contract_months - b.contract_months ||
                              a.annual_km - b.annual_km
                          )
                          .map((row) => (
                            <div
                              key={row.id}
                              onClick={() => handleEdit(row)}
                              className="flex items-center justify-between px-6 py-2.5 hover:bg-white cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <span className="text-gray-700">
                                └ {model} — {row.contract_months}개월/
                                {(row.annual_km / 10000).toFixed(0)}만km
                              </span>
                              <span className="text-accent font-semibold">
                                {row.min_monthly.toLocaleString()}~
                                {row.max_monthly.toLocaleString()}원
                              </span>
                            </div>
                          ))}
                      </div>
                    ))}
                    {modelCount === 0 && (
                      <div className="px-6 py-4 text-gray-500 text-sm">
                        등록된 가격이 없습니다
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editorOpen && (
          <PriceEditor
            key={editingPrice?.id ?? 'new'}
            priceRange={editingPrice}
            isOpen={editorOpen}
            onClose={handleCloseEditor}
            onSuccess={fetchPrices}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
