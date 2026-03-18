'use client';

import { useState, useCallback } from 'react';
import { useQuoteStore } from '@/store/quoteStore';
import type { ContractMonths } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';
import { SelectCard } from '@/components/ui/SelectCard';

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
        <h2 className="text-[22px] font-bold text-[#1D1D1F] leading-snug">
          계약 기간을 선택해 주세요
        </h2>
        <p className="text-sm text-[#86868B] mt-2">
          기간이 길수록 월 납부금이 낮아집니다
        </p>
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
            {opt.isPopular && (
              <span className="absolute -top-2 right-3 bg-warning text-white text-[11px] font-bold py-0.5 px-2 rounded-[10px]">
                인기
              </span>
            )}
            <span className="text-2xl shrink-0">📅</span>
            <div className="min-w-0 flex-1">
              <div className={`text-base font-semibold ${selectedValue === opt.value ? 'text-white' : 'text-[#1D1D1F]'}`}>
                {opt.label}
              </div>
              <div className={`text-[13px] mt-0.5 ${selectedValue === opt.value ? 'text-white/70' : 'text-[#86868B]'}`}>
                {opt.sub}
              </div>
            </div>
          </SelectCard>
        ))}
      </div>
    </>
  );
}
