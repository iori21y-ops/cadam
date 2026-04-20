'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuoteStore } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';
import type { Vehicle } from '@/constants/vehicles';
import type { PriceRangeRow } from './PriceCompareTable';

interface EstimateConfiguratorProps {
  vehicle: Vehicle;
  priceRanges: PriceRangeRow[];
  minCarPrice: number | null;
  maxCarPrice: number | null;
}

const CONTRACT_OPTIONS = [
  { label: '3년', value: 36 },
  { label: '4년', value: 48 },
  { label: '5년', value: 60 },
];

const KM_OPTIONS = [
  { label: '1만', value: 10000 },
  { label: '2만', value: 20000 },
  { label: '3만', value: 30000 },
];

const PRODUCT_OPTIONS = [
  { label: '장기렌트', sub: '보험·세금 포함 · 하허호', value: 'rent' },
  { label: '리스', sub: '보험 미포함 · 일반 번호판', value: 'lease' },
];

function formatPrice(value: number): string {
  return Math.round(value).toLocaleString();
}

export function EstimateConfigurator({
  vehicle,
  priceRanges,
  minCarPrice,
  maxCarPrice,
}: EstimateConfiguratorProps) {
  const router = useRouter();
  const setSelectionPath = useQuoteStore((s) => s.setSelectionPath);
  const setCarBrand = useQuoteStore((s) => s.setCarBrand);
  const setCarModel = useQuoteStore((s) => s.setCarModel);
  const setTrim = useQuoteStore((s) => s.setTrim);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);

  const [contractMonths, setContractMonths] = useState(48);
  const [annualKm, setAnnualKm] = useState(20000);
  const [product, setProduct] = useState('rent');

  // 선택한 조건에 맞는 가격 찾기
  const matchedPrice = useMemo(() => {
    return priceRanges.find(
      (r) => r.contract_months === contractMonths && r.annual_km === annualKm
    );
  }, [priceRanges, contractMonths, annualKm]);

  const hasPrice = matchedPrice != null;

  const handleQuoteClick = () => {
    gtag.seoCtaClick(vehicle.slug, 'quote');
    setSelectionPath('car');
    setCarBrand(vehicle.brand);
    setCarModel(vehicle.model);
    setTrim(vehicle.trims[0] ?? null);
    setCurrentStep(3);
    router.push('/quote');
  };

  return (
    <section className="mx-5 mt-6 rounded-2xl bg-white border border-accent shadow-sm overflow-hidden">
      {/* 가격 표시 */}
      <div className="px-5 pt-5 pb-4 border-b border-border-solid">
        {hasPrice ? (
          <>
            <p className="text-xs text-text-sub mb-1">예상 월 납입금</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[32px] font-extrabold text-primary tracking-tight">
                {formatPrice(matchedPrice.min_monthly)}
              </span>
              <span className="text-base font-bold text-primary">원/월</span>
            </div>
            {matchedPrice.max_monthly > matchedPrice.min_monthly && (
              <p className="text-xs text-text-sub mt-0.5">
                ~ {formatPrice(matchedPrice.max_monthly)}원
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-text-sub mb-1">예상 월 납입금</p>
            <p className="text-lg font-bold text-text">맞춤 견적으로 확인하세요</p>
          </>
        )}
        {minCarPrice != null && (
          <p className="text-[11px] text-text-sub mt-2">
            차량가 {Math.round(minCarPrice / 10000).toLocaleString()}만
            {maxCarPrice != null && maxCarPrice !== minCarPrice
              ? ` ~ ${Math.round(maxCarPrice / 10000).toLocaleString()}만원`
              : '원'}
          </p>
        )}
      </div>

      {/* 조건 선택 */}
      <div className="px-5 py-4 space-y-5">
        {/* 계약기간 */}
        <div>
          <p className="text-sm font-semibold text-text mb-2.5">계약기간</p>
          <div className="grid grid-cols-3 gap-2">
            {CONTRACT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setContractMonths(opt.value)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  contractMonths === opt.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border-solid bg-white text-text hover:border-text-sub'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 연 주행거리 */}
        <div>
          <p className="text-sm font-semibold text-text mb-2.5">연 주행거리</p>
          <div className="grid grid-cols-3 gap-2">
            {KM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAnnualKm(opt.value)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  annualKm === opt.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border-solid bg-white text-text hover:border-text-sub'
                }`}
              >
                {opt.label}km
              </button>
            ))}
          </div>
        </div>

        {/* 이용 상품 */}
        <div>
          <p className="text-sm font-semibold text-text mb-2.5">이용 상품</p>
          <div className="grid grid-cols-2 gap-2">
            {PRODUCT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setProduct(opt.value)}
                className={`py-3 px-3 rounded-xl border text-center transition-all ${
                  product === opt.value
                    ? 'border-accent bg-accent/10'
                    : 'border-border-solid bg-white hover:border-text-sub'
                }`}
              >
                <span
                  className={`block text-sm font-semibold ${
                    product === opt.value ? 'text-accent' : 'text-text'
                  }`}
                >
                  {opt.label}
                </span>
                <span className="block text-[10px] text-text-sub mt-0.5 leading-tight">
                  {opt.sub}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 pt-1">
        <button
          type="button"
          onClick={handleQuoteClick}
          className="w-full py-4 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-colors active:scale-[0.98]"
        >
          무료 견적 받기
        </button>
      </div>
    </section>
  );
}
