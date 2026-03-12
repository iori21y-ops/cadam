'use client';

import { useState, useEffect } from 'react';
import { useQuoteStore } from '@/store/quoteStore';
import type { Deposit, PrepaymentPct } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';

interface Step5PaymentProps {
  onCompleteChange?: (isComplete: boolean) => void;
}

type PaymentType = 'deposit' | 'prepayment';

const RATIO_OPTIONS: { value: PrepaymentPct; label: string }[] = [
  { value: 0, label: '0%' },
  { value: 10, label: '10%' },
  { value: 20, label: '20%' },
  { value: 30, label: '30%' },
];

// 보증금 비율 → 원화 매핑 (백엔드 호환)
const RATIO_TO_DEPOSIT: Record<PrepaymentPct, Deposit> = {
  0: 0,
  10: 1000000,
  20: 2000000,
  30: 3000000,
};

export function Step5Payment({ onCompleteChange }: Step5PaymentProps) {
  const [selectedType, setSelectedType] = useState<PaymentType | null>(null);
  const deposit = useQuoteStore((s) => s.deposit);
  const prepaymentPct = useQuoteStore((s) => s.prepaymentPct);
  const setDeposit = useQuoteStore((s) => s.setDeposit);
  const setPrepaymentPct = useQuoteStore((s) => s.setPrepaymentPct);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);

  const isComplete = deposit !== null || prepaymentPct !== null;

  useEffect(() => {
    onCompleteChange?.(isComplete);
  }, [isComplete, onCompleteChange]);

  const handleTypeSelect = (type: PaymentType) => {
    setSelectedType(type);
    setDeposit(null);
    setPrepaymentPct(null);
  };

  const handleRatioSelect = (value: PrepaymentPct) => {
    const opt = RATIO_OPTIONS.find((o) => o.value === value);
    if (selectedType === 'deposit') {
      setDeposit(RATIO_TO_DEPOSIT[value]);
      setPrepaymentPct(null);
      gtag.stepComplete(5, `보증금 ${opt?.label ?? value}%`);
    } else {
      setPrepaymentPct(value);
      setDeposit(null);
      gtag.stepComplete(5, `선납금 ${opt?.label ?? value}%`);
    }
    setTimeout(() => setCurrentStep(6), 0);
  };

  return (
    <div className="overflow-y-auto">
      {/* 1단계: 보증금 vs 선납금 선택 */}
      <div className="px-5">
        <h3 className="text-sm font-bold text-gray-700 mt-3 mb-2">
          보증금과 선납금 중 하나를 선택해 주세요
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          비율에 따라 월 납부금이 달라집니다
        </p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => handleTypeSelect('deposit')}
            className={`
              flex-1 py-4 px-4 border-2 rounded-xl bg-white cursor-pointer
              text-center text-sm font-semibold transition-all duration-150
              ${
                selectedType === 'deposit'
                  ? 'border-accent bg-[#EBF5FB] text-accent'
                  : 'border-gray-200 text-gray-700 hover:border-accent hover:bg-[#EBF5FB]'
              }
            `}
          >
            보증금
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelect('prepayment')}
            className={`
              flex-1 py-4 px-4 border-2 rounded-xl bg-white cursor-pointer
              text-center text-sm font-semibold transition-all duration-150
              ${
                selectedType === 'prepayment'
                  ? 'border-accent bg-[#EBF5FB] text-accent'
                  : 'border-gray-200 text-gray-700 hover:border-accent hover:bg-[#EBF5FB]'
              }
            `}
          >
            선납금
          </button>
        </div>
      </div>

      {/* 2단계: 비율 선택 */}
      {selectedType && (
        <div className="px-5 mt-6">
          <h3 className="text-sm font-bold text-gray-700 mb-2">
            {selectedType === 'deposit' ? '보증금' : '선납금'} 비율을 선택해 주세요
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {selectedType === 'deposit'
              ? '보증금 비율이 높을수록 월 납부금이 낮아집니다'
              : '차량가의 일부를 선납하면 월 납부금이 낮아집니다'}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {RATIO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleRatioSelect(opt.value)}
                className={`
                  py-3 px-4 border-2 rounded-xl bg-white cursor-pointer
                  text-center text-sm font-semibold transition-all duration-150
                  ${
                    (selectedType === 'deposit' && deposit === RATIO_TO_DEPOSIT[opt.value]) ||
                    (selectedType === 'prepayment' && prepaymentPct === opt.value)
                      ? 'border-accent bg-[#EBF5FB] text-accent'
                      : 'border-gray-200 text-gray-700 hover:border-accent hover:bg-[#EBF5FB]'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
