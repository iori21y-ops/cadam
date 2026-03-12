'use client';

import { useState, useCallback } from 'react';
import { useQuoteStore } from '@/store/quoteStore';
import type { AnnualKm } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';

interface MileageOption {
  value: AnnualKm;
  label: string;
  sub: string;
  isPopular?: boolean;
}

const OPTIONS: MileageOption[] = [
  { value: 10000, label: '연 1만 km', sub: '주말 위주' },
  { value: 20000, label: '연 2만 km', sub: '출퇴근 기본', isPopular: true },
  { value: 30000, label: '연 3만 km', sub: '업무 겸용' },
  { value: 40000, label: '연 4만 km+', sub: '장거리' },
];

const TRANSITION_DELAY_MS = 300;

export function Step4Mileage() {
  const [selectedValue, setSelectedValue] = useState<AnnualKm | null>(null);
  const setAnnualKm = useQuoteStore((s) => s.setAnnualKm);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);

  const handleSelect = useCallback(
    (value: AnnualKm) => {
      if (selectedValue !== null) return;
      const opt = OPTIONS.find((o) => o.value === value);
      setSelectedValue(value);
      setAnnualKm(value);
      gtag.stepComplete(4, opt?.label ?? String(value));
      setTimeout(() => {
        setCurrentStep(5);
      }, TRANSITION_DELAY_MS);
    },
    [selectedValue, setAnnualKm, setCurrentStep]
  );

  return (
    <>
      <div className="pt-7 px-5 pb-2 text-center">
        <h2 className="text-[22px] font-bold text-gray-900 leading-snug">
          연간 주행거리를 선택해 주세요
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          실제 주행거리를 초과하면 추가 요금이 발생할 수 있습니다
        </p>
      </div>
      <div className="flex flex-col gap-2.5 px-5 py-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            disabled={selectedValue !== null}
            className={`
              relative w-full p-4 pl-[18px] bg-white rounded-xl cursor-pointer text-left
              flex items-center gap-3 transition-all duration-150
              border-2
              ${
                selectedValue === opt.value
                  ? 'border-accent bg-[#EBF5FB]'
                  : 'border-gray-200 hover:border-accent hover:bg-[#EBF5FB]'
              }
              disabled:cursor-default
            `}
          >
            {opt.isPopular && (
              <span className="absolute -top-2 right-3 bg-warning text-white text-[11px] font-bold py-0.5 px-2 rounded-[10px]">
                인기
              </span>
            )}
            <span className="text-2xl shrink-0">🚗</span>
            <div className="min-w-0">
              <div
                className={`text-base font-semibold ${
                  selectedValue === opt.value ? 'text-accent' : 'text-gray-900'
                }`}
              >
                {opt.label}
              </div>
              <div className="text-[13px] text-gray-500 mt-0.5">{opt.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
