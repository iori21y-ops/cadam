'use client';

import { useRef, useLayoutEffect, useState } from 'react';
import { useQuoteStore, type Deposit } from '@/store/quoteStore';

const BUDGET_LABELS: Record<number, string> = {
  300000: '30만원 이하',
  500000: '30~50만원',
  700000: '50~70만원',
  1000000: '70~100만원',
  1500000: '100만원 이상',
};

const PERIOD_LABELS: Record<number, string> = {
  36: '36개월',
  48: '48개월',
  60: '60개월',
};

const MILEAGE_LABELS: Record<number, string> = {
  10000: '연 1만 km',
  20000: '연 2만 km',
  30000: '연 3만 km',
  40000: '연 4만 km+',
};

const DEPOSIT_RATIO_LABELS: Record<Deposit, string> = {
  0: '0%',
  1000000: '10%',
  2000000: '20%',
  3000000: '30%',
};

const PREPAYMENT_LABELS: Record<number, string> = {
  0: '0%',
  10: '10%',
  20: '20%',
  30: '30%',
};

interface SummaryItem {
  step: number;
  label: string;
  value: string;
}

export function SelectionSummary({ currentStep }: { currentStep: number }) {
  const isExpanded = currentStep === 6;
  const selectionPath = useQuoteStore((s) => s.selectionPath);
  const carBrand = useQuoteStore((s) => s.carBrand);
  const carModel = useQuoteStore((s) => s.carModel);
  const trim = useQuoteStore((s) => s.trim);
  const monthlyBudget = useQuoteStore((s) => s.monthlyBudget);
  const contractMonths = useQuoteStore((s) => s.contractMonths);
  const annualKm = useQuoteStore((s) => s.annualKm);
  const deposit = useQuoteStore((s) => s.deposit);
  const prepaymentPct = useQuoteStore((s) => s.prepaymentPct);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);

  const items: SummaryItem[] = [];

  // Step 1: 선택 경로
  if (selectionPath && currentStep >= 2) {
    items.push({
      step: 1,
      label: selectionPath === 'car' ? '선택 경로' : '선택 경로',
      value: selectionPath === 'car' ? '차종 먼저 선택' : '월 예산 먼저 선택',
    });
  }

  // Step 2: 차종 또는 예산
  if (currentStep >= 3) {
    if (selectionPath === 'car' && carBrand && carModel && trim) {
      items.push({
        step: 2,
        label: '차종',
        value: `${carBrand} ${carModel} ${trim}`,
      });
    } else if (selectionPath === 'budget' && monthlyBudget !== null) {
      items.push({
        step: 2,
        label: '월 예산',
        value: BUDGET_LABELS[monthlyBudget] ?? `${(monthlyBudget / 10000).toFixed(0)}만원`,
      });
    }
  }

  // Step 3: 계약 기간
  if (contractMonths !== null && currentStep >= 4) {
    items.push({
      step: 3,
      label: '계약 기간',
      value: PERIOD_LABELS[contractMonths],
    });
  }

  // Step 4: 주행거리
  if (annualKm !== null && currentStep >= 5) {
    items.push({
      step: 4,
      label: '주행거리',
      value: MILEAGE_LABELS[annualKm],
    });
  }

  // Step 5: 보증금·선납금 (하나라도 선택 시 표시)
  if ((deposit !== null || prepaymentPct !== null) && currentStep >= 6) {
    const parts: string[] = [];
    if (deposit !== null) parts.push(`보증금 ${DEPOSIT_RATIO_LABELS[deposit]}`);
    if (prepaymentPct !== null) parts.push(`선납 ${PREPAYMENT_LABELS[prepaymentPct]}`);
    items.push({
      step: 5,
      label: '보증금·선납',
      value: parts.join(', '),
    });
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [needsSliding, setNeedsSliding] = useState(false);

  useLayoutEffect(() => {
    if (isExpanded || items.length === 0) return;
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;
    setNeedsSliding(measure.scrollWidth > container.clientWidth);
  }, [items, isExpanded]);

  if (items.length === 0) return null;

  return (
    <div className="px-5 pt-2">
      <div className="rounded-2xl bg-white border border-[#E5E5EA] overflow-hidden">
        {!isExpanded ? (
          <div
            ref={containerRef}
            className="relative px-3 py-2 min-h-[30px] overflow-hidden"
          >
            <div
              ref={measureRef}
              className="inline-flex gap-2 absolute opacity-0 pointer-events-none invisible"
              aria-hidden
            >
              {items.map((item) => (
                <span
                  key={item.step}
                  className="shrink-0 px-2 py-1 rounded-[10px] bg-[#F5F5F7] text-[11px] text-[#1D1D1F]"
                >
                  {item.value}
                </span>
              ))}
            </div>
            <div
              className={`inline-flex gap-2 ${needsSliding ? 'animate-slide' : ''}`}
              style={
                needsSliding
                  ? { animationDuration: `${Math.max(12, items.length * 3)}s` }
                  : undefined
              }
            >
              {(needsSliding ? [...items, ...items] : items).map((item, idx) => (
                <span
                  key={`${item.step}-${idx}`}
                  className="shrink-0 px-2 py-1 rounded-[10px] bg-[#F5F5F7] text-[11px] text-[#1D1D1F]"
                >
                  {item.value}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 px-4 pb-4 pt-3">
            {items.map((item) => (
              <li key={item.step} className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setCurrentStep(item.step)}
                  className="flex items-center gap-2 min-w-0 group text-left hover:text-[#007AFF] transition-colors"
                >
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#007AFF1A] text-[#007AFF] text-[11px] font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  <span className="text-[#86868B] shrink-0">{item.label}</span>
                  <span className="text-[#1D1D1F] font-medium truncate group-hover:text-[#007AFF]">
                    {item.value}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
