'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VEHICLES } from '@/data/diagnosis-vehicles';
import { DEFAULT_PRODUCTS, PRODUCT_KEYS } from '@/data/diagnosis-products';
import type { ProductKey } from '@/types/diagnosis';
import { Button } from '@/components/ui/Button';

const FEATURED = ['아반떼', '쏘나타', 'K5', '투싼', '스포티지', '팰리세이드', '카니발', '아이오닉5', 'EV6'];
const FEATURED_VEHICLES = VEHICLES.filter((v) => FEATURED.includes(v.name));

const ACCENT = '#0A84FF';

const resultBgByKey: Record<ProductKey, string> = {
  installment: 'bg-[rgba(0,122,255,0.08)]',
  lease: 'bg-[rgba(88,86,214,0.08)]',
  rent: 'bg-[rgba(52,199,89,0.08)]',
  cash: 'bg-[rgba(255,149,0,0.08)]',
};

const resultTextByKey: Record<ProductKey, string> = {
  installment: 'text-[#007AFF]',
  lease: 'text-[#5856D6]',
  rent: 'text-[#34C759]',
  cash: 'text-[#FF9500]',
};

function calcMonthly(price: number, rate: number, months: number, downPct: number) {
  const down = price * 10000 * (downPct / 100);
  const principal = price * 10000 - down;
  const monthlyRate = rate / 12 / 100;
  if (monthlyRate === 0) return Math.round(principal / months / 10000);
  return Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1) / 10000);
}

export default function CalculatorPage() {
  const router = useRouter();
  const [selectedCar, setSelectedCar] = useState(FEATURED_VEHICLES[0]);
  const [months, setMonths] = useState(48);
  const [downPct, setDownPct] = useState(20);

  const results = {
    installment: calcMonthly(selectedCar.price, 4.5, months, downPct),
    lease: calcMonthly(selectedCar.price, 3.5, months, downPct),
    rent: calcMonthly(selectedCar.price, 6.0, months, downPct) + 8,
    cash: 0,
  };

  return (
    <div className="min-h-screen bg-surface-secondary pb-16">
      <div className="px-5 pt-10 max-w-lg mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <p className="text-sm text-text-sub mb-1">월 비용 계산기</p>
          <h1 className="text-2xl font-bold text-text tracking-tight">🧮 월 납입금 계산</h1>
        </div>

        {/* 차종 선택 */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5EA] mb-4">
          <p className="text-sm font-bold text-text mb-3">차종 선택</p>
          <div className="grid grid-cols-3 gap-2">
            {FEATURED_VEHICLES.map((v) => (
              <button
                key={v.name}
                onClick={() => setSelectedCar(v)}
                className={`p-3 rounded-[16px] border-2 transition-all duration-300 flex items-center justify-between gap-2 ${
                  selectedCar.name === v.name
                    ? `bg-[#0A84FF] border-[#0A84FF] text-white shadow-[0_4px_24px_rgba(10,132,255,0.25)]`
                    : 'bg-white border-transparent text-[#1D1D1F] shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:border-[#0A84FF] hover:bg-[#0A84FF0D] hover:shadow-[0_4px_24px_rgba(10,132,255,0.14)]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">{v.img}</span>
                  <span className="text-[13px] font-semibold truncate">{v.name}</span>
                </div>
                <div
                  className={`w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 ${
                    selectedCar.name === v.name ? 'bg-white' : 'border-2 border-[#D1D1D6]'
                  }`}
                >
                  {selectedCar.name === v.name && (
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                      <path
                        d="M2 6l3 3 5-5"
                        stroke={ACCENT}
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 슬라이더 */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5EA] mb-4">
          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <p className="text-sm font-bold text-text">계약 기간</p>
              <p className="text-sm font-bold text-[#0A84FF]">{months}개월</p>
            </div>
            <input
              type="range" min={24} max={72} step={12} value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full accent-[#0A84FF]"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>24개월</span><span>72개월</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-sm font-bold text-text">선수금 비율</p>
              <p className="text-sm font-bold text-[#0A84FF]">{downPct}%</p>
            </div>
            <input
              type="range" min={0} max={50} step={10} value={downPct}
              onChange={(e) => setDownPct(Number(e.target.value))}
              className="w-full accent-[#0A84FF]"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>0%</span><span>50%</span>
            </div>
          </div>
        </div>

        {/* 결과 카드 */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5EA] mb-4">
          <p className="text-base font-bold text-text mb-1">{selectedCar.brand} {selectedCar.name}</p>
          <p className="text-[13px] text-text-sub mb-5">{(selectedCar.price / 100).toFixed(1)}천만 · {months}개월 · 선수금 {downPct}%</p>
          <div className="flex flex-col gap-2.5">
            {PRODUCT_KEYS.map((key) => {
              const monthly = results[key];
              return (
                <div key={key} className={`flex items-center gap-3.5 rounded-2xl px-[18px] py-4 ${resultBgByKey[key]}`}>
                  <span className="text-[22px] shrink-0">{DEFAULT_PRODUCTS[key].emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text">{DEFAULT_PRODUCTS[key].name}</p>
                    <p className="text-[11px] text-text-muted">{key === 'installment' ? '이자 4.5%' : key === 'lease' ? '리스 3.5%' : key === 'rent' ? '보험·정비 포함' : '일시불'}</p>
                  </div>
                  <div className="text-right">
                    {key === 'cash' ? (
                      <p className={`text-lg font-bold ${resultTextByKey[key]}`}>
                        {selectedCar.price.toLocaleString()}만
                      </p>
                    ) : (
                      <>
                        <p className={`text-xl font-bold ${resultTextByKey[key]}`}>
                          {monthly.toLocaleString()}<span className="text-[13px]">만/월</span>
                        </p>
                        <p className="text-[11px] text-text-muted">
                          총 {(monthly * months).toLocaleString()}만
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-text-muted mt-3">* 할부 4.5%, 리스 3.5%, 렌트 6%+보험비 8만원 기준 / 실제 조건에 따라 다를 수 있습니다.</p>
        </div>

        {/* 상담 CTA */}
        <div className="p-5 rounded-2xl bg-[#0A84FF1A] mb-4">
          <p className="text-sm font-bold text-text mb-1">더 정확한 견적이 필요하신가요?</p>
          <p className="text-xs text-text-sub mb-3">전문 상담사가 실제 조건으로 최저가를 찾아드립니다.</p>
          <Button variant="primary" fullWidth className="shadow-lg shadow-primary/20 font-bold" onClick={() => router.push('/quote')}>
            무료 견적 받기 →
          </Button>
        </div>

        <Button variant="secondary" fullWidth onClick={() => router.push('/diagnosis')}>
          진단 홈으로
        </Button>
      </div>
    </div>
  );
}
