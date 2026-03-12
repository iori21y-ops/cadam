'use client';

import { ReactNode, useEffect, useMemo } from 'react';
import { ProgressBar } from './ProgressBar';
import { SelectionSummary } from './SelectionSummary';
import { useQuoteStore } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';

const STEP_NAMES: Record<number, string> = {
  1: '브랜치 선택',
  2: '차량/예산 선택',
  3: '렌트 기간',
  4: '월 주행거리',
  5: '결제 방식',
  6: '연락처 입력',
};

interface StepLayoutProps {
  children: ReactNode;
  currentStep: number;
  isNextDisabled?: boolean;
  onNext?: () => void;
}

export function StepLayout({
  children,
  currentStep,
  isNextDisabled = false,
  onNext,
}: StepLayoutProps) {
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);
  const stepName = useMemo(() => STEP_NAMES[currentStep] ?? `Step ${currentStep}`, [currentStep]);

  useEffect(() => {
    gtag.stepView(currentStep, stepName);
  }, [currentStep, stepName]);

  const handlePrev = () => {
    if (currentStep > 1) {
      gtag.stepBack(currentStep, currentStep - 1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (onNext) onNext();
    else if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const showPrev = currentStep > 1;
  const showNext = currentStep < 6;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      <ProgressBar currentStep={currentStep} />
      <div className="flex-1 overflow-y-auto pb-32">
        {children}
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 min-w-[360px] max-w-[1024px] mx-auto">
        <SelectionSummary currentStep={currentStep} />
        <div className="flex gap-3 p-5 pt-4">
        {showPrev && (
          <button
            type="button"
            onClick={handlePrev}
            className="flex-1 py-4 rounded-lg border-2 border-gray-200 font-semibold text-gray-700 hover:border-accent hover:text-accent transition-colors"
          >
            이전
          </button>
        )}
        {showNext && (
          <button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled}
            className={`flex-1 py-4 rounded-lg font-semibold transition-colors ${
              isNextDisabled
                ? 'bg-gray-300 text-gray-500 cursor-default'
                : 'bg-accent text-white hover:opacity-90'
            }`}
          >
            다음
          </button>
        )}
        </div>
      </div>
    </div>
  );
}
