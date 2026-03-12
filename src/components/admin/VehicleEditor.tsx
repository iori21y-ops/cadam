'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { VEHICLE_LIST } from '@/constants/vehicles';

const CONTRACT_MONTHS = [36, 48, 60] as const;
const ANNUAL_KM = [10000, 20000, 30000, 40000] as const;

type PriceKey = `${number}-${number}`;

interface PriceCell {
  min: number;
  max: number;
}

interface VehicleSetting {
  thumbnailUrl: string;
  minCarPrice: string;
  maxCarPrice: string;
}

export interface VehicleEditorProps {
  vehicleSlug: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customBrand?: string;
  customModel?: string;
}

function makePriceKey(months: number, km: number): PriceKey {
  return `${months}-${km}` as PriceKey;
}

function emptyMatrix(): Record<PriceKey, PriceCell> {
  const m: Record<PriceKey, PriceCell> = {} as Record<PriceKey, PriceCell>;
  for (const months of CONTRACT_MONTHS) {
    for (const km of ANNUAL_KM) {
      m[makePriceKey(months, km)] = { min: 0, max: 0 };
    }
  }
  return m;
}

function formatWon(n: number): string {
  if (!n) return '';
  return Math.round(n / 10000) + '만';
}

export function VehicleEditor({ vehicleSlug, isOpen, onClose, onSuccess, customBrand, customModel }: VehicleEditorProps) {
  const [setting, setSetting] = useState<VehicleSetting>({ thumbnailUrl: '', minCarPrice: '', maxCarPrice: '' });
  const [priceMatrix, setPriceMatrix] = useState<Record<PriceKey, PriceCell>>(emptyMatrix());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editBrand, setEditBrand] = useState(customBrand ?? '');
  const [editModel, setEditModel] = useState(customModel ?? '');

  const vehicleFromList = vehicleSlug ? VEHICLE_LIST.find((v) => v.slug === vehicleSlug) ?? null : null;
  const isCustom = vehicleFromList === null && !!vehicleSlug;
  const brand = vehicleFromList?.brand ?? editBrand;
  const model = vehicleFromList?.model ?? editModel;

  const loadData = useCallback(async () => {
    if (!vehicleSlug) return;
    const vFromList = VEHICLE_LIST.find((v) => v.slug === vehicleSlug) ?? null;
    const currentBrand = vFromList?.brand ?? customBrand ?? '';
    const currentModel = vFromList?.model ?? customModel ?? '';
    if (!currentBrand || !currentModel) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const [{ data: vs }, { data: prices }] = await Promise.all([
        supabase
          .from('vehicle_settings')
          .select('thumbnail_url, min_car_price, max_car_price')
          .eq('vehicle_slug', vehicleSlug)
          .maybeSingle(),
        supabase
          .from('price_ranges')
          .select('contract_months, annual_km, min_monthly, max_monthly')
          .eq('car_brand', currentBrand)
          .eq('car_model', currentModel)
          .eq('is_active', true),
      ]);

      setSetting({
        thumbnailUrl: vs?.thumbnail_url ?? '',
        minCarPrice: vs?.min_car_price ? String(Math.round(vs.min_car_price / 10000)) : '',
        maxCarPrice: vs?.max_car_price ? String(Math.round(vs.max_car_price / 10000)) : '',
      });

      const matrix = emptyMatrix();
      for (const p of (prices ?? [])) {
        const key = makePriceKey(p.contract_months, p.annual_km);
        matrix[key] = { min: p.min_monthly, max: p.max_monthly };
      }
      setPriceMatrix(matrix);
    } catch {
      setError('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [vehicleSlug, customBrand, customModel]);

  useEffect(() => {
    if (isOpen && vehicleSlug) {
      setEditBrand(customBrand ?? '');
      setEditModel(customModel ?? '');
      loadData();
    } else {
      setSetting({ thumbnailUrl: '', minCarPrice: '', maxCarPrice: '' });
      setPriceMatrix(emptyMatrix());
      setError(null);
      setEditBrand('');
      setEditModel('');
    }
  }, [isOpen, vehicleSlug, customBrand, customModel, loadData]);

  const updateCell = (key: PriceKey, field: 'min' | 'max', raw: string) => {
    const value = Number(raw.replace(/[^0-9]/g, '')) || 0;
    setPriceMatrix((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!vehicleSlug || !brand || !model) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();

      await supabase.from('vehicle_settings').upsert({
        vehicle_slug: vehicleSlug,
        car_brand: brand,
        car_model: model,
        thumbnail_url: setting.thumbnailUrl.trim() || null,
        min_car_price: setting.minCarPrice ? Number(setting.minCarPrice) * 10000 : null,
        max_car_price: setting.maxCarPrice ? Number(setting.maxCarPrice) * 10000 : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'vehicle_slug' });

      for (const months of CONTRACT_MONTHS) {
        for (const km of ANNUAL_KM) {
          const key = makePriceKey(months, km);
          const cell = priceMatrix[key];
          if (!cell || (!cell.min && !cell.max)) continue;

          const { data: existing } = await supabase
            .from('price_ranges')
            .select('id')
            .eq('car_brand', brand)
            .eq('car_model', model)
            .eq('contract_months', months)
            .eq('annual_km', km)
            .maybeSingle();

          if (existing) {
            await supabase
              .from('price_ranges')
              .update({ min_monthly: cell.min, max_monthly: cell.max, is_active: true })
              .eq('id', existing.id);
          } else {
            await supabase.from('price_ranges').insert({
              car_brand: brand,
              car_model: model,
              contract_months: months,
              annual_km: km,
              min_monthly: cell.min,
              max_monthly: cell.max,
              is_active: true,
            });
          }
        }
      }

      try {
        await fetch('/api/admin/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: vehicleSlug }),
        });
      } catch { /* ignore */ }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={false}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'tween', duration: 0.25 }}
        className="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <div>
            <p className="text-xs text-gray-400">{brand || '새 차종'}</p>
            <h2 className="text-lg font-bold text-gray-900">{model || '정보 입력'}</h2>
          </div>
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            닫기
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* 커스텀 차종: 제조사/차종명 편집 */}
            {isCustom && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">제조사 / 차종명</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">제조사</label>
                    <input
                      type="text"
                      value={editBrand}
                      onChange={(e) => setEditBrand(e.target.value)}
                      placeholder="예: BMW"
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">차종명</label>
                    <input
                      type="text"
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                      placeholder="예: 5시리즈"
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 썸네일 & 차량 가격 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">기본 정보</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">썸네일 이미지 URL</label>
                <input
                  type="url"
                  value={setting.thumbnailUrl}
                  onChange={(e) => setSetting((p) => ({ ...p, thumbnailUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-accent"
                />
                {setting.thumbnailUrl && (
                  <img src={setting.thumbnailUrl} alt="미리보기" className="mt-2 h-24 rounded-lg object-contain bg-gray-100 w-full" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">차량가격 최소 (만원)</label>
                  <input
                    type="number"
                    value={setting.minCarPrice}
                    onChange={(e) => setSetting((p) => ({ ...p, minCarPrice: e.target.value }))}
                    placeholder="예: 2500"
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">차량가격 최대 (만원)</label>
                  <input
                    type="number"
                    value={setting.maxCarPrice}
                    onChange={(e) => setSetting((p) => ({ ...p, maxCarPrice: e.target.value }))}
                    placeholder="예: 3200"
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* 월납부금 매트릭스 */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1 mb-3">
                월 납부금 (원) — 계약기간 × 주행거리
              </h3>
              <p className="text-xs text-gray-400 mb-3">각 셀에 최소/최대 입력. 미입력 셀은 저장 제외.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="p-1.5 bg-gray-50 border border-gray-200 font-semibold text-gray-600 w-16">기간</th>
                      {ANNUAL_KM.map((km) => (
                        <th key={km} className="p-1.5 bg-gray-50 border border-gray-200 font-semibold text-gray-600 text-center">
                          연 {km / 10000}만km
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CONTRACT_MONTHS.map((months) => (
                      <tr key={months}>
                        <td className="p-1.5 bg-gray-50 border border-gray-200 font-semibold text-gray-600 text-center">
                          {months}개월
                        </td>
                        {ANNUAL_KM.map((km) => {
                          const key = makePriceKey(months, km);
                          const cell = priceMatrix[key];
                          return (
                            <td key={km} className="border border-gray-200 p-1">
                              <input
                                type="number"
                                value={cell?.min || ''}
                                onChange={(e) => updateCell(key, 'min', e.target.value)}
                                placeholder="최소"
                                className="w-full py-1 px-1.5 border border-gray-200 rounded text-xs outline-none focus:border-accent mb-0.5"
                              />
                              <input
                                type="number"
                                value={cell?.max || ''}
                                onChange={(e) => updateCell(key, 'max', e.target.value)}
                                placeholder="최대"
                                className="w-full py-1 px-1.5 border border-gray-200 rounded text-xs outline-none focus:border-accent"
                              />
                              {cell?.min > 0 && (
                                <p className="text-[10px] text-accent text-center mt-0.5">{formatWon(cell.min)}~{formatWon(cell.max)}만</p>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-lg font-bold bg-accent text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
