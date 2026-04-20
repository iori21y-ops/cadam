'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VEHICLES } from '@/data/diagnosis-vehicles';
import { DEFAULT_PRODUCTS, PRODUCT_KEYS } from '@/data/diagnosis-products';
import { calcMonthly, RATES, RENT_INSURANCE_RATE } from '@/lib/calc-monthly';
import type { ProductKey } from '@/types/diagnosis';
import { Button } from '@/components/ui/Button';
import { SelectCard } from '@/components/ui/SelectCard';

const FEATURED = ['아반떼', '쏘나타', 'K5', '투싼', '스포티지', '팰리세이드', '카니발', '아이오닉5', 'EV6'];
const FEATURED_VEHICLES = VEHICLES.filter((v) => FEATURED.includes(v.name));

const resultBgByKey: Record<ProductKey, string> = {
  installment: 'bg-[rgba(0,122,255,0.08)]',
  lease: 'bg-[rgba(88,86,214,0.08)]',
  rent: 'bg-[rgba(52,199,89,0.08)]',
  cash: 'bg-[rgba(255,149,0,0.08)]',
};

const resultTextByKey: Record<ProductKey, string> = {
  installment: 'text-primary',
  lease: 'text-vehicle',
  rent: 'text-success',
  cash: 'text-warning',
};

export default function CalculatorPage() {
  const router = useRouter();
  const [selectedCar, setSelectedCar] = useState(FEATURED_VEHICLES[0]);
  const [months, setMonths] = useState(48);
  const [downPct, setDownPct] = useState(20);

  const results = {
    installment: calcMonthly(selectedCar.price, 'installment', months, downPct),
    lease: calcMonthly(selectedCar.price, 'lease', months, downPct),
    rent: calcMonthly(selectedCar.price, 'rent', months, downPct),
    cash: 0,
  };

  return (
    <div className="min-h-screen bg-white pb-16">
      <div className="px-5 pt-10 max-w-lg mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <p className="text-sm text-text-sub mb-1">월 비용 계산기</p>
          <h1 className="text-2xl font-bold text-text tracking-tight">🧮 월 납입금 계산</h1>
        </div>

        {/* 차종 선택 */}
        <div className="p-5 rounded-2xl bg-white border border-border-solid mb-4">
          <p className="text-sm font-bold text-text mb-3">차종 선택</p>
          <div className="grid grid-cols-3 gap-2">
            {FEATURED_VEHICLES.map((v) => {
              const isSel = selectedCar.name === v.name;
              return (
                <SelectCard
                  key={v.name}
                  compact
                  selected={isSel}
                  onClick={() => setSelectedCar(v)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xl shrink-0">{v.img}</span>
                    <span className={`text-[13px] font-semibold truncate ${isSel ? 'text-white' : 'text-text'}`}>{v.name}</span>
                  </div>
                </SelectCard>
              );
            })}
          </div>
        </div>

        {/* 슬라이더 */}
        <div className="p-5 rounded-2xl bg-white border border-border-solid mb-4">
          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <p className="text-sm font-bold text-text">계약 기간</p>
              <p className="text-sm font-bold text-primary">{months}개월</p>
            </div>
            <input
              type="range" min={24} max={72} step={12} value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>24개월</span><span>72개월</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-sm font-bold text-text">선수금 비율</p>
              <p className="text-sm font-bold text-primary">{downPct}%</p>
            </div>
            <input
              type="range" min={0} max={50} step={10} value={downPct}
              onChange={(e) => setDownPct(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>0%</span><span>50%</span>
            </div>
          </div>
        </div>

        {/* 결과 카드 */}
        <div className="p-5 rounded-2xl bg-white border border-border-solid mb-4">
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
                    <p className="text-[11px] text-text-muted">{key === 'installment' ? `이자 ${(RATES.installment * 100).toFixed(1)}%` : key === 'lease' ? `리스 ${(RATES.lease * 100).toFixed(1)}%` : key === 'rent' ? '보험·정비 포함' : '일시불'}</p>
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
          <p className="text-[10px] text-text-muted mt-3">* 할부 {(RATES.installment * 100).toFixed(1)}%, 리스 {(RATES.lease * 100).toFixed(1)}%, 렌트 {(RATES.rent * 100).toFixed(1)}%+관리비 {Math.round(RENT_INSURANCE_RATE * 100)}% 기준 / 실제 조건에 따라 다를 수 있습니다.</p>
        </div>

        {/* 상담 CTA */}
        <div className="p-5 rounded-2xl bg-accent/10 mb-4">
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
