'use client';

import { useState, useCallback } from 'react';
import { useQuoteStore } from '@/store/quoteStore';
import type { ContractMonths } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';

interface PeriodOption {
  value: ContractMonths;
  label: string;
  sub: string;
  isPopular?: boolean;
}

const OPTIONS: PeriodOption[] = [
  { value: 36, label: '36개월', sub: '3년' },
  { value: 48, label: '48개월', sub: '4년', isPopular: true },
  { value: 60, label: '60개월', sub: '5년' },
];

const TRANSITION_DELAY_MS = 300;

export function Step3Period() {
  const [selectedValue, setSelectedValue] = useState<ContractMonths | null>(null);
  const setContractMonths = useQuoteStore((s) => s.setContractMonths);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);

  const handleSelect = useCallback(
    (value: ContractMonths) => {
      if (selectedValue !== null) return;
      const opt = OPTIONS.find((o) => o.value === value);
      setSelectedValue(value);
      setContractMonths(value);
      gtag.stepComplete(3, opt?.label ?? String(value));
      setTimeout(() => {
        setCurrentStep(4);
      }, TRANSITION_DELAY_MS);
    },
    [selectedValue, setContractMonths, setCurrentStep]
  );

  return (
    <>
      <div className="pt-7 px-5 pb-2 text-center">
        <h2 className="text-[22px] font-bold text-gray-900 leading-snug">
          계약 기간을 선택해 주세요
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          기간이 길수록 월 납부금이 낮아집니다
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
            <span className="text-2xl shrink-0">📅</span>
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
