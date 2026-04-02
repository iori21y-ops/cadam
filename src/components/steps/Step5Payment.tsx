'use client';

import { useState, useEffect } from 'react';
import { useQuoteStore } from '@/store/quoteStore';
import type { Deposit, PrepaymentPct } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';
import { SelectCard } from '@/components/ui/SelectCard';

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
      gtag.stepComplete(4, `보증금 ${opt?.label ?? value}%`);
    } else {
      setPrepaymentPct(value);
      setDeposit(null);
      gtag.stepComplete(4, `선납금 ${opt?.label ?? value}%`);
    }
    setTimeout(() => setCurrentStep(5), 0);
  };

  return (
    <div className="overflow-y-auto scrollbar-hide">
      {/* 1단계: 보증금 vs 선납금 선택 */}
      <div className="px-5">
        <h3 className="text-sm font-bold text-text mt-3 mb-2">
          보증금과 선납금 중 하나를 선택해 주세요
        </h3>
        <p className="text-sm text-text-sub mb-3">
          비율에 따라 월 납부금이 달라집니다
        </p>
        <div className="flex gap-2.5">
          <SelectCard
            className="flex-1"
            selected={selectedType === 'deposit'}
            onClick={() => handleTypeSelect('deposit')}
          >
            <span className={`text-sm font-semibold flex-1 ${selectedType === 'deposit' ? 'text-white' : 'text-text'}`}>
              보증금
            </span>
          </SelectCard>
          <SelectCard
            className="flex-1"
            selected={selectedType === 'prepayment'}
            onClick={() => handleTypeSelect('prepayment')}
          >
            <span className={`text-sm font-semibold flex-1 ${selectedType === 'prepayment' ? 'text-white' : 'text-text'}`}>
              선납금
            </span>
          </SelectCard>
        </div>
      </div>

      {/* 2단계: 비율 선택 */}
      {selectedType && (
        <div className="px-5 mt-6">
          <h3 className="text-sm font-bold text-text mb-2">
            {selectedType === 'deposit' ? '보증금' : '선납금'} 비율을 선택해 주세요
          </h3>
          <p className="text-sm text-text-sub mb-3">
            {selectedType === 'deposit'
              ? '보증금 비율이 높을수록 월 납부금이 낮아집니다'
              : '차량가의 일부를 선납하면 월 납부금이 낮아집니다'}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {RATIO_OPTIONS.map((opt) => {
              const isSel =
                (selectedType === 'deposit' && deposit === RATIO_TO_DEPOSIT[opt.value]) ||
                (selectedType === 'prepayment' && prepaymentPct === opt.value);
              return (
                <SelectCard
                  key={opt.value}
                  selected={isSel}
                  onClick={() => handleRatioSelect(opt.value)}
                >
                  <span className={`text-sm font-semibold flex-1 ${isSel ? 'text-white' : 'text-text'}`}>
                    {opt.label}
                  </span>
                </SelectCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
