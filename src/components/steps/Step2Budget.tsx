'use client';

import { useState, useCallback } from 'react';
import { useQuoteStore } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';
import { SelectCard } from '@/components/ui/SelectCard';

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
      gtag.stepComplete(1, opt?.label ?? String(value));
      setTimeout(() => {
        setCurrentStep(2);
      }, TRANSITION_DELAY_MS);
    },
    [selectedValue, setMonthlyBudget, setCurrentStep]
  );

  return (
    <>
      <div className="pt-7 px-5 pb-2 text-center">
        <h2 className="text-[22px] font-bold text-text leading-snug">
          월 예산은 어느 정도 생각하고 계세요?
        </h2>
      </div>
      <div className="flex flex-col gap-2.5 px-5 py-3">
        {OPTIONS.map((opt) => (
          <SelectCard
            key={opt.value}
            selected={selectedValue === opt.value}
            dimmed={selectedValue !== null && selectedValue !== opt.value}
            disabled={selectedValue !== null}
            onClick={() => handleSelect(opt.value)}
          >
            <span className="text-2xl shrink-0">💰</span>
            <div className="min-w-0 flex-1">
              <div className={`text-base font-semibold ${selectedValue === opt.value ? 'text-white' : 'text-text'}`}>
                {opt.label}
              </div>
            </div>
          </SelectCard>
        ))}
      </div>
    </>
  );
}
