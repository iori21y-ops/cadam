'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import type { MileageGroup, TrimMsrpResult } from '@/lib/domain/depreciation-calculator';

export type BusinessType = 'personal' | 'individual_business' | 'corporation';
export type AgeGroup     = '20대 이하' | '30대' | '40대' | '50대' | '60대' | '70대 이상';
export type SexType      = '남자' | '여자';

export interface DiagnosisFormData {
  brand: string;
  model: string;
  trimData: TrimMsrpResult;
  mileageGroup: MileageGroup;
  businessType: BusinessType;
  ageGroup: AgeGroup | null;
  sex: SexType | null;
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

const AGE_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: '20대 이하', label: '20대↓' },
  { value: '30대',      label: '30대'  },
  { value: '40대',      label: '40대'  },
  { value: '50대',      label: '50대'  },
  { value: '60대',      label: '60대'  },
  { value: '70대 이상', label: '70대↑' },
];

const SEX_OPTIONS: { value: SexType; label: string }[] = [
  { value: '남자', label: '남성' },
  { value: '여자', label: '여성' },
];

export function DiagnosisForm({ onSubmit, loading = false }: Props) {
  const [brand, setBrand]           = useState('');
  const [model, setModel]           = useState('');
  const [year, setYear]             = useState<number | ''>('');
  const [trimName, setTrimName]     = useState('');
  const [mileageGroup, setMileage]  = useState<MileageGroup>('mid');
  const [businessType, setBusiness] = useState<BusinessType>('personal');
  const [ageGroup, setAgeGroup]     = useState<AgeGroup | null>(null);
  const [sex, setSex]               = useState<SexType | null>(null);

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
    setYear('');
    setTrimName('');
    fetch(`/api/vehicle-msrp/models?brand=${encodeURIComponent(brand)}`)
      .then((r) => r.json())
      .then((d) => setModels(d.models ?? []))
      .catch(() => setApiError('모델 목록을 불러오지 못했습니다'))
      .finally(() => setLoadingModels(false));
  }, [brand]);

  // 트림 목록 로드
  useEffect(() => {
    if (!brand || !model) { setTrims([]); setYear(''); setTrimName(''); return; }
    setLoadingTrims(true);
    setYear('');
    setTrimName('');
    fetch(`/api/vehicle-msrp?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`)
      .then((r) => r.json())
      .then((d) => setTrims(d.trims ?? []))
      .catch(() => setApiError('트림 목록을 불러오지 못했습니다'))
      .finally(() => setLoadingTrims(false));
  }, [brand, model]);

  // 고유 연식 목록 (최신순)
  const years = [...new Set(trims.map((t) => t.model_year))].sort((a, b) => b - a);

  // 선택된 연식의 트림 목록
  const filteredTrims = year !== '' ? trims.filter((t) => t.model_year === year) : [];

  const selectedTrim = filteredTrims.find((t) => t.trim_name === trimName) ?? null;

  const canSubmit = !!(brand && model && selectedTrim && !loading);

  function handleYearChange(val: string) {
    setYear(val === '' ? '' : Number(val));
    setTrimName('');
  }

  function handleSubmit() {
    if (!selectedTrim) return;
    onSubmit({ brand, model, trimData: selectedTrim, mileageGroup, businessType, ageGroup, sex });
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

      {/* 연식 */}
      <div>
        <label className="block text-[13px] font-semibold text-[#1C1C1E] mb-1.5">연식</label>
        <select
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          disabled={!model || loadingTrims}
          className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#1C1C1E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 disabled:opacity-50"
        >
          <option value="">{loadingTrims ? '불러오는 중…' : '연식 선택'}</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}년식</option>
          ))}
        </select>
      </div>

      {/* 트림 */}
      <div>
        <label className="block text-[13px] font-semibold text-[#1C1C1E] mb-1.5">
          트림
          <span className="ml-1.5 text-[11px] font-normal text-[#8E8E93]">신차가 기준</span>
        </label>
        <select
          value={trimName}
          onChange={(e) => setTrimName(e.target.value)}
          disabled={!year || filteredTrims.length === 0}
          className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#1C1C1E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 disabled:opacity-50"
        >
          <option value="">{!year ? '연식을 먼저 선택하세요' : '트림 선택'}</option>
          {filteredTrims.map((t) => (
            <option key={t.trim_name} value={t.trim_name}>
              {t.trim_name} ({t.msrp_price.toLocaleString()}만원)
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

      {/* 연령대 — 보험료 맞춤 추정용 (선택) */}
      <div>
        <label className="block text-[13px] font-semibold text-[#1C1C1E] mb-1.5">
          운전자 연령대
          <span className="ml-1.5 text-[11px] font-normal text-[#8E8E93]">선택 시 맞춤 보험료 추정</span>
        </label>
        <div className="grid grid-cols-6 gap-1.5">
          {AGE_OPTIONS.map((opt) => {
            const sel = ageGroup === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAgeGroup(sel ? null : opt.value)}
                className={[
                  'py-2 rounded-xl border-2 text-[12px] font-semibold transition-all text-center',
                  sel
                    ? 'border-[#FF9500] bg-[#FF9500]/10 text-[#FF9500]'
                    : 'border-[#E5E7EB] bg-white text-[#6D6D72] hover:border-[#FF9500]/40',
                ].join(' ')}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 성별 — 연령대 선택 시만 표시 (20대는 성별 차이가 큼) */}
      {ageGroup !== null && (
        <div>
          <label className="block text-[13px] font-semibold text-[#1C1C1E] mb-2">
            성별
            <span className="ml-1.5 text-[11px] font-normal text-[#8E8E93]">선택</span>
          </label>
          <div className="flex gap-2">
            {SEX_OPTIONS.map((opt) => {
              const sel = sex === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSex(sel ? null : opt.value)}
                  className={[
                    'flex-1 py-2.5 rounded-xl border-2 text-[13px] font-semibold transition-all',
                    sel
                      ? 'border-[#FF9500] bg-[#FF9500]/10 text-[#FF9500]'
                      : 'border-[#E5E7EB] bg-white text-[#6D6D72] hover:border-[#FF9500]/40',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
