'use client';

import { useState, useMemo } from 'react';
import { DEFAULT_PRODUCTS, PRODUCT_KEYS } from '@/data/diagnosis-products';
import type { ProductKey } from '@/types/diagnosis';

interface SimulationCalculatorProps {
  carPrice: number; // 만원 단위
  carName: string;
  recommendedProduct?: ProductKey;
}

const PERIODS = [24, 36, 48, 60] as const;
const MILEAGES = [10000, 15000, 20000, 30000] as const;
const MILEAGE_LABELS: Record<number, string> = {
  10000: '1만km',
  15000: '1.5만km',
  20000: '2만km',
  30000: '3만km',
};
const DOWN_RATES = [0, 10, 20, 30] as const;

// 간이 월 납입금 계산 (실제 금융사 조건에 따라 달라짐, 참고용)
function calcMonthly(
  carPrice: number,
  product: ProductKey,
  period: number,
  downRate: number,
  mileage: number
): number {
  const principal = carPrice * (1 - downRate / 100);

  switch (product) {
    case 'installment': {
      // 할부: 원리금균등 (연 5.5% 기준)
      const rate = 0.055 / 12;
      if (rate === 0) return Math.round(principal / period);
      const payment = principal * (rate * Math.pow(1 + rate, period)) / (Math.pow(1 + rate, period) - 1);
      return Math.round(payment);
    }
    case 'lease': {
      // 리스: 잔존가치 30% 기반 (연 4.5% 기준)
      const residual = carPrice * 0.3;
      const leaseBase = principal - residual;
      const rate = 0.045 / 12;
      const payment = leaseBase * (rate * Math.pow(1 + rate, period)) / (Math.pow(1 + rate, period) - 1) + residual * rate;
      return Math.round(payment);
    }
    case 'rent': {
      // 렌트: 보험·정비 포함 (기본 리스 + 20% 추가)
      const residual = carPrice * 0.25;
      const rentBase = principal - residual;
      const rate = 0.05 / 12;
      const base = rentBase * (rate * Math.pow(1 + rate, period)) / (Math.pow(1 + rate, period) - 1) + residual * rate;
      // 주행거리 초과비용 리스크 반영
      const mileageFactor = mileage > 20000 ? 1.05 : 1.0;
      return Math.round(base * 1.2 * mileageFactor);
    }
    case 'cash':
      return 0;
  }
}

export function SimulationCalculator({ carPrice, carName, recommendedProduct }: SimulationCalculatorProps) {
  const [period, setPeriod] = useState<number>(48);
  const [mileage, setMileage] = useState<number>(15000);
  const [downRate, setDownRate] = useState<number>(10);

  const results = useMemo(() => {
    return PRODUCT_KEYS.map((key) => ({
      key,
      monthly: calcMonthly(carPrice, key, period, downRate, mileage),
      downPayment: Math.round(carPrice * downRate / 100),
      totalCost: key === 'cash'
        ? carPrice
        : calcMonthly(carPrice, key, period, downRate, mileage) * period + Math.round(carPrice * downRate / 100),
    }));
  }, [carPrice, period, mileage, downRate]);

  return (
    <div className="p-5 rounded-2xl bg-surface shadow-sm">
      <p className="text-sm font-bold text-text mb-1">월 납입금 시뮬레이션</p>
      <p className="text-xs text-text-muted mb-4">{carName} · {carPrice.toLocaleString()}만원 기준</p>

      {/* 계약기간 */}
      <div className="mb-4">
        <label className="block text-[11px] font-semibold text-text-sub mb-2">계약기간</label>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-secondary text-text-sub hover:bg-surface-secondary/80'
              }`}
            >
              {p}개월
            </button>
          ))}
        </div>
      </div>

      {/* 연 주행거리 */}
      <div className="mb-4">
        <label className="block text-[11px] font-semibold text-text-sub mb-2">연 주행거리</label>
        <div className="flex gap-2">
          {MILEAGES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMileage(m)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                mileage === m
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-secondary text-text-sub hover:bg-surface-secondary/80'
              }`}
            >
              {MILEAGE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* 선수금 비율 */}
      <div className="mb-5">
        <label className="block text-[11px] font-semibold text-text-sub mb-2">
          선수금 {downRate}% ({Math.round(carPrice * downRate / 100).toLocaleString()}만원)
        </label>
        <div className="flex gap-2">
          {DOWN_RATES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDownRate(d)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                downRate === d
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-secondary text-text-sub hover:bg-surface-secondary/80'
              }`}
            >
              {d}%
            </button>
          ))}
        </div>
      </div>

      {/* 결과 비교 테이블 */}
      <div className="bg-surface-secondary rounded-xl p-3">
        <div className="grid grid-cols-4 gap-2 mb-2">
          {results.map(({ key, monthly }) => {
            const product = DEFAULT_PRODUCTS[key];
            const isRecommended = key === recommendedProduct;
            return (
              <div
                key={key}
                className={`text-center py-3 rounded-xl relative ${
                  isRecommended ? 'ring-2 ring-primary bg-white' : 'bg-white'
                }`}
              >
                {isRecommended && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-white whitespace-nowrap">
                    추천
                  </span>
                )}
                <span className="text-base">{product.emoji}</span>
                <p className="text-[10px] text-text-muted mt-1">{product.name}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: product.color }}>
                  {key === 'cash' ? '일시불' : `${monthly.toLocaleString()}만`}
                </p>
              </div>
            );
          })}
        </div>

        {/* 총 비용 비교 */}
        <div className="border-t border-border pt-2">
          <p className="text-[10px] text-text-muted mb-1">총 예상 비용 (선수금 포함)</p>
          <div className="grid grid-cols-4 gap-2">
            {results.map(({ key, totalCost }) => {
              const product = DEFAULT_PRODUCTS[key];
              return (
                <div key={key} className="text-center">
                  <p className="text-[11px] font-semibold" style={{ color: product.color }}>
                    {totalCost.toLocaleString()}만
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-text-muted mt-3 leading-relaxed">
        * 참고용 예상 금액입니다. 실제 금액은 신용등급, 금융사, 프로모션에 따라 달라집니다.
        정확한 견적은 전문 상담사에게 문의해주세요.
      </p>
    </div>
  );
}
