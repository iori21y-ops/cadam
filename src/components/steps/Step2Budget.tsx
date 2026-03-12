'use client';

import { useState, useCallback } from 'react';
import { useQuoteStore } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';

interface BudgetOption {
  label: string;
  value: number;
}

const OPTIONS: BudgetOption[] = [
  { label: '30만원 이하', value: 300000 },
  { label: '30~50만원', value: 500000 },
  { label: '50~70만원', value: 700000 },
  { label: '70~100만원', value: 1000000 },
  { label: '100만원 이상', value: 1500000 },
];

const TRANSITION_DELAY_MS = 300;

export function Step2Budget() {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const setMonthlyBudget = useQuoteStore((s) => s.setMonthlyBudget);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);

  const handleSelect = useCallback(
    (value: number) => {
      if (selectedValue !== null) return;
      const opt = OPTIONS.find((o) => o.value === value);
      setSelectedValue(value);
      setMonthlyBudget(value);
      gtag.stepComplete(2, opt?.label ?? String(value));
      setTimeout(() => {
        setCurrentStep(3);
      }, TRANSITION_DELAY_MS);
    },
    [selectedValue, setMonthlyBudget, setCurrentStep]
  );

  return (
    <>
      <div className="pt-7 px-5 pb-2 text-center">
        <h2 className="text-[22px] font-bold text-gray-900 leading-snug">
          월 예산은 어느 정도 생각하고 계세요?
        </h2>
      </div>
      <div className="flex flex-col gap-2.5 px-5 py-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            disabled={selectedValue !== null}
            className={`
              w-full p-4 pl-[18px] bg-white rounded-xl cursor-pointer text-left
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
            <span className="text-2xl shrink-0">💰</span>
            <div className="min-w-0">
              <div
                className={`text-base font-semibold ${
                  selectedValue === opt.value ? 'text-accent' : 'text-gray-900'
                }`}
              >
                {opt.label}
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
