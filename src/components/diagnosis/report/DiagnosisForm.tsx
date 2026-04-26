'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import type { MileageGroup, TrimMsrpResult } from '@/lib/domain/depreciation-calculator';

export type BusinessType = 'personal' | 'individual_business' | 'corporation';

export interface DiagnosisFormData {
  brand: string;
  model: string;
  trimData: TrimMsrpResult;
  mileageGroup: MileageGroup;
  businessType: BusinessType;
}

interface Props {
  onSubmit: (data: DiagnosisFormData) => void;
  loading?: boolean;
}

const MILEAGE_OPTIONS: { value: MileageGroup; label: string; sub: string }[] = [
  { value: 'low',  label: '저주행',  sub: '0~3만km' },
  { value: 'mid',  label: '일반',    sub: '3~6만km' },
  { value: 'high', label: '고주행',  sub: '6~10만km' },
];

const BUSINESS_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: 'personal',           label: '개인' },
  { value: 'individual_business', label: '개인사업자' },
  { value: 'corporation',        label: '법인' },
];

export function DiagnosisForm({ onSubmit, loading = false }: Props) {
  const [brand, setBrand]           = useState('');
  const [model, setModel]           = useState('');
  const [trimKey, setTrimKey]       = useState('');   // "model_year|trim_name" composite key
  const [mileageGroup, setMileage]  = useState<MileageGroup>('mid');
  const [businessType, setBusiness] = useState<BusinessType>('personal');

  const [brands, setBrands]   = useState<string[]>([]);
  const [models, setModels]   = useState<string[]>([]);
  const [trims, setTrims]     = useState<TrimMsrpResult[]>([]);

  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingTrims,  setLoadingTrims]  = useState(false);
  const [apiError, setApiError]           = useState('');

  // 브랜드 목록 로드
  useEffect(() => {
    setLoadingBrands(true);
    fetch('/api/vehicle-msrp/brands')
      .then((r) => r.json())
      .then((d) => setBrands(d.brands ?? []))
      .catch(() => setApiError('브랜드 목록을 불러오지 못했습니다'))
      .finally(() => setLoadingBrands(false));
  }, []);

  // 모델 목록 로드
  useEffect(() => {
    if (!brand) { setModels([]); setModel(''); return; }
    setLoadingModels(true);
    setModel('');
    setTrims([]);
    setTrimKey('');
    fetch(`/api/vehicle-msrp/models?brand=${encodeURIComponent(brand)}`)
      .then((r) => r.json())
      .then((d) => setModels(d.models ?? []))
      .catch(() => setApiError('모델 목록을 불러오지 못했습니다'))
      .finally(() => setLoadingModels(false));
  }, [brand]);

  // 트림 목록 로드
  useEffect(() => {
    if (!brand || !model) { setTrims([]); setTrimKey(''); return; }
    setLoadingTrims(true);
    setTrimKey('');
    fetch(`/api/vehicle-msrp?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`)
      .then((r) => r.json())
      .then((d) => setTrims(d.trims ?? []))
      .catch(() => setApiError('트림 목록을 불러오지 못했습니다'))
      .finally(() => setLoadingTrims(false));
  }, [brand, model]);

  const selectedTrim = trims.find(
    (t) => `${t.model_year}|${t.trim_name}` === trimKey,
  ) ?? null;

  const canSubmit = !!(brand && model && selectedTrim && !loading);

  function handleSubmit() {
    if (!selectedTrim) return;
    onSubmit({ brand, model, trimData: selectedTrim, mileageGroup, businessType });
  }

  return (
    <div className="space-y-4">
      {apiError && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{apiError}</p>
      )}

      {/* 브랜드 */}
      <div>
        <label className="block text-[13px] font-semibold text-[#1C1C1E] mb-1.5">브랜드</label>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          disabled={loadingBrands}
          className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#1C1C1E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 disabled:opacity-50"
        >
          <option value="">{loadingBrands ? '불러오는 중…' : '브랜드 선택'}</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* 모델 */}
      <div>
        <label className="block text-[13px] font-semibold text-[#1C1C1E] mb-1.5">모델</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!brand || loadingModels}
          className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#1C1C1E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 disabled:opacity-50"
        >
          <option value="">{loadingModels ? '불러오는 중…' : '모델 선택'}</option>
          {models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* 트림 */}
      <div>
        <label className="block text-[13px] font-semibold text-[#1C1C1E] mb-1.5">
          연식 · 트림
          <span className="ml-1.5 text-[11px] font-normal text-[#8E8E93]">신차가 기준</span>
        </label>
        <select
          value={trimKey}
          onChange={(e) => setTrimKey(e.target.value)}
          disabled={!model || loadingTrims}
          className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#1C1C1E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 disabled:opacity-50"
        >
          <option value="">{loadingTrims ? '불러오는 중…' : '트림 선택'}</option>
          {trims.map((t) => (
            <option key={`${t.model_year}|${t.trim_name}`} value={`${t.model_year}|${t.trim_name}`}>
              {t.model_year}년식 · {t.trim_name} ({t.msrp_price.toLocaleString()}만원)
            </option>
          ))}
        </select>
      </div>

      {/* 주행거리 구간 */}
      <div>
        <label className="block text-[13px] font-semibold text-[#1C1C1E] mb-2">
          주행거리 구간
          <span className="ml-1.5 text-[11px] font-normal text-[#8E8E93]">현재 주행거리 기준</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {MILEAGE_OPTIONS.map((opt) => {
            const sel = mileageGroup === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMileage(opt.value)}
                className={[
                  'py-3 rounded-xl border-2 text-center transition-all',
                  sel
                    ? 'border-[#007AFF] bg-[#007AFF]/5'
                    : 'border-[#E5E7EB] bg-white hover:border-[#007AFF]/40',
                ].join(' ')}
              >
                <p className={`text-[13px] font-bold ${sel ? 'text-[#007AFF]' : 'text-[#1C1C1E]'}`}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">{opt.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 사업자 여부 */}
      <div>
        <label className="block text-[13px] font-semibold text-[#1C1C1E] mb-2">사업자 여부</label>
        <div className="flex gap-2">
          {BUSINESS_OPTIONS.map((opt) => {
            const sel = businessType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBusiness(opt.value)}
                className={[
                  'flex-1 py-2.5 rounded-xl border-2 text-[13px] font-semibold transition-all',
                  sel
                    ? 'border-[#007AFF] bg-[#007AFF] text-white'
                    : 'border-[#E5E7EB] bg-white text-[#1C1C1E] hover:border-[#007AFF]/40',
                ].join(' ')}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택 요약 */}
      {selectedTrim && (
        <div className="px-4 py-3 rounded-xl bg-[#F2F2F7]">
          <p className="text-[12px] text-[#8E8E93] mb-0.5">선택 차량</p>
          <p className="text-[14px] font-bold text-[#1C1C1E]">
            {brand} {model} · {selectedTrim.model_year}년식
          </p>
          <p className="text-[12px] text-[#6D6D72] mt-0.5">
            {selectedTrim.trim_name} ·{' '}
            <span className="font-semibold text-[#007AFF]">
              신차가 {selectedTrim.msrp_price.toLocaleString()}만원
            </span>
          </p>
        </div>
      )}

      <Button
        variant="primary"
        fullWidth
        size="lg"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="!bg-[#007AFF] !rounded-2xl !text-[15px] !font-bold disabled:!opacity-40"
      >
        {loading ? '계산 중…' : '진단 시작'}
      </Button>
    </div>
  );
}
