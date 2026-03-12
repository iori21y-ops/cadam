'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import {
  type Brand,
  VEHICLE_LIST,
  getVehiclesByBrand,
} from '@/constants/vehicles';

export interface PriceRangeData {
  id: string;
  car_brand: string;
  car_model: string;
  contract_months: number;
  annual_km: number;
  min_monthly: number;
  max_monthly: number;
  conditions: unknown;
}

const BRANDS: Brand[] = ['현대', '기아', '제네시스'];
const CONTRACT_MONTHS = [36, 48, 60] as const;
const ANNUAL_KM = [10000, 20000, 30000, 40000] as const;

interface PriceEditorProps {
  priceRange: PriceRangeData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CsvRow {
  brand: string;
  model: string;
  months: number;
  km: number;
  min: number;
  max: number;
}

function parseConditionsJson(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}

export function PriceEditor({
  priceRange,
  isOpen,
  onClose,
  onSuccess,
}: PriceEditorProps) {
  const isEdit = priceRange !== null;
  const [brand, setBrand] = useState<Brand>('현대');
  const [carModel, setCarModel] = useState('');
  const [contractMonths, setContractMonths] = useState<number>(36);
  const [annualKm, setAnnualKm] = useState<number>(10000);
  const [minMonthly, setMinMonthly] = useState(0);
  const [maxMonthly, setMaxMonthly] = useState(0);
  const [conditionsJson, setConditionsJson] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [csvMode, setCsvMode] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<CsvRow[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);

  const vehicles = getVehiclesByBrand(brand);
  const vehicleOptions = vehicles.map((v) => ({ value: v.model, label: v.model, slug: v.slug }));

  useEffect(() => {
    if (priceRange) {
      setBrand(priceRange.car_brand as Brand);
      setCarModel(priceRange.car_model);
      setContractMonths(priceRange.contract_months);
      setAnnualKm(priceRange.annual_km);
      setMinMonthly(priceRange.min_monthly);
      setMaxMonthly(priceRange.max_monthly);
      setConditionsJson(
        priceRange.conditions != null
          ? JSON.stringify(priceRange.conditions, null, 2)
          : ''
      );
    } else {
      setBrand('현대');
      setCarModel('');
      setContractMonths(36);
      setAnnualKm(10000);
      setMinMonthly(0);
      setMaxMonthly(0);
      setConditionsJson('');
    }
    setError(null);
    setCsvMode(false);
    setCsvText('');
    setCsvPreview([]);
    setCsvError(null);
  }, [priceRange, isOpen]);

  useEffect(() => {
    if (brand && !vehicleOptions.some((o) => o.value === carModel)) {
      setCarModel('');
    }
  }, [brand, carModel, vehicleOptions]);

  const supabase = createBrowserSupabaseClient();

  const getSlugForModel = (b: Brand, m: string): string | null => {
    const v = VEHICLE_LIST.find((x) => x.brand === b && x.model === m);
    return v?.slug ?? null;
  };

  const callRevalidate = async (slug: string): Promise<void> => {
    try {
      await fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
    } catch {
      // ignore revalidate errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedModel = carModel.trim();
    if (!trimmedModel) {
      setError('차종을 선택해 주세요');
      return;
    }
    if (minMonthly < 0 || maxMonthly < 0) {
      setError('월 납부금은 0 이상이어야 합니다');
      return;
    }
    if (minMonthly > maxMonthly) {
      setError('최소 금액은 최대 금액 이하여야 합니다');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const conditions = parseConditionsJson(conditionsJson);

      if (isEdit && priceRange) {
        const { error: err } = await supabase
          .from('price_ranges')
          .update({
            car_brand: brand,
            car_model: trimmedModel,
            contract_months: contractMonths,
            annual_km: annualKm,
            min_monthly: minMonthly,
            max_monthly: maxMonthly,
            conditions,
          })
          .eq('id', priceRange.id);

        if (err) throw err;

        const slug = getSlugForModel(brand, trimmedModel);
        if (slug) await callRevalidate(slug);
      } else {
        const { error: err } = await supabase.from('price_ranges').insert({
          car_brand: brand,
          car_model: trimmedModel,
          contract_months: contractMonths,
          annual_km: annualKm,
          min_monthly: minMonthly,
          max_monthly: maxMonthly,
          conditions,
        });
        if (err) throw err;

        const slug = getSlugForModel(brand, trimmedModel);
        if (slug) await callRevalidate(slug);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const parseCsv = (text: string): CsvRow[] => {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
    const rows: CsvRow[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 6) continue;
      const [b, m, monthsStr, kmStr, minStr, maxStr] = parts;
      const months = parseInt(monthsStr ?? '0', 10);
      const km = parseInt(kmStr ?? '0', 10);
      const min = parseInt(minStr ?? '0', 10);
      const max = parseInt(maxStr ?? '0', 10);
      if (
        !b ||
        !m ||
        !(CONTRACT_MONTHS as readonly number[]).includes(months) ||
        !(ANNUAL_KM as readonly number[]).includes(km)
      )
        continue;
      rows.push({ brand: b, model: m, months, km, min, max });
    }
    return rows;
  };

  const handleCsvParse = () => {
    setCsvError(null);
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      setCsvError('유효한 행이 없습니다. 형식: brand,model,months,km,min,max');
      setCsvPreview([]);
    } else {
      setCsvPreview(rows);
    }
  };

  const handleCsvUpload = async () => {
    if (csvPreview.length === 0) return;
    setSaving(true);
    setCsvError(null);
    try {
      const slugsToRevalidate = new Set<string>();
      for (const row of csvPreview) {
        const vehicle = VEHICLE_LIST.find(
          (v) => v.brand === row.brand && v.model === row.model
        );
        if (vehicle) slugsToRevalidate.add(vehicle.slug);

        const { data: existingRow } = await supabase
          .from('price_ranges')
          .select('id')
          .eq('car_brand', row.brand)
          .eq('car_model', row.model)
          .eq('contract_months', row.months)
          .eq('annual_km', row.km)
          .maybeSingle();

        if (existingRow) {
          await supabase
            .from('price_ranges')
            .update({
              min_monthly: row.min,
              max_monthly: row.max,
            })
            .eq('id', existingRow.id);
        } else {
          await supabase.from('price_ranges').insert({
            car_brand: row.brand,
            car_model: row.model,
            contract_months: row.months,
            annual_km: row.km,
            min_monthly: row.min,
            max_monthly: row.max,
          });
        }
      }
      for (const slug of slugsToRevalidate) {
        await callRevalidate(slug);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : '업로드 실패');
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
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'tween', duration: 0.25 }}
        className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? '가격 수정' : '새 가격 추가'}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCsvMode(!csvMode)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              {csvMode ? '폼 모드' : 'CSV 업로드'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              닫기
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {csvMode ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                형식: brand,model,months,km,min,max (한 줄에 하나)
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  CSV 파일 선택
                </label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setCsvText(String(reader.result ?? ''));
                        setCsvPreview([]);
                        setCsvError(null);
                      };
                      reader.readAsText(file, 'UTF-8');
                    }
                    e.target.value = '';
                  }}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="현대,캐스퍼,36,10000,250000,350000"
                rows={8}
                className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent font-mono text-sm resize-none"
              />
              <button
                type="button"
                onClick={handleCsvParse}
                className="px-4 py-2 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                미리보기
              </button>
              {csvError && <p className="text-sm text-danger">{csvError}</p>}
              {csvPreview.length > 0 && (
                <>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-2 py-1.5 text-left">브랜드</th>
                          <th className="px-2 py-1.5 text-left">차종</th>
                          <th className="px-2 py-1.5 text-left">개월</th>
                          <th className="px-2 py-1.5 text-left">km</th>
                          <th className="px-2 py-1.5 text-left">최소</th>
                          <th className="px-2 py-1.5 text-left">최대</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((r, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-2 py-1.5">{r.brand}</td>
                            <td className="px-2 py-1.5">{r.model}</td>
                            <td className="px-2 py-1.5">{r.months}</td>
                            <td className="px-2 py-1.5">{r.km}</td>
                            <td className="px-2 py-1.5">{r.min.toLocaleString()}</td>
                            <td className="px-2 py-1.5">{r.max.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={handleCsvUpload}
                    disabled={saving}
                    className="w-full py-2.5 rounded-lg font-bold bg-accent text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {saving ? '업로드 중...' : '업로드'}
                  </button>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  브랜드 <span className="text-danger">*</span>
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value as Brand)}
                  className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent"
                >
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  차종 <span className="text-danger">*</span>
                </label>
                <select
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent"
                >
                  <option value="">선택</option>
                  {vehicleOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  계약기간 <span className="text-danger">*</span>
                </label>
                <select
                  value={contractMonths}
                  onChange={(e) => setContractMonths(Number(e.target.value))}
                  className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent"
                >
                  {CONTRACT_MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}개월
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  주행거리 <span className="text-danger">*</span>
                </label>
                <select
                  value={annualKm}
                  onChange={(e) => setAnnualKm(Number(e.target.value))}
                  className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent"
                >
                  {ANNUAL_KM.map((k) => (
                    <option key={k} value={k}>
                      {(k / 10000).toFixed(0)}만km
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  최소 월 납부금 (원) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  value={minMonthly || ''}
                  onChange={(e) => setMinMonthly(Number(e.target.value) || 0)}
                  min={0}
                  className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  최대 월 납부금 (원) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  value={maxMonthly || ''}
                  onChange={(e) => setMaxMonthly(Number(e.target.value) || 0)}
                  min={0}
                  className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  조건별 상세 (JSON)
                </label>
                <textarea
                  value={conditionsJson}
                  onChange={(e) => setConditionsJson(e.target.value)}
                  placeholder='{"deposit_0": 250000, "deposit_100": 200000}'
                  rows={4}
                  className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent font-mono text-sm resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  JSON 파싱만 허용. 수학적 계산은 서버에서 처리됩니다.
                </p>
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-lg font-bold bg-accent text-white hover:opacity-90 disabled:opacity-60"
              >
                {saving ? '저장 중...' : isEdit ? '수정' : '등록'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
