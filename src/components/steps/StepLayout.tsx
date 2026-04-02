'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProgressBar } from './ProgressBar';
import { SelectionSummary } from './SelectionSummary';
import { useQuoteStore } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';
import { Button } from '@/components/ui/Button';

const STEP_NAMES: Record<number, string> = {
  1: '월 예산',
  2: '계약 기간',
  3: '주행거리',
  4: '결제 방식',
  5: '연락처 입력',
};

interface StepLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps?: number;
  isNextDisabled?: boolean;
  onNext?: () => void;
}

export function StepLayout({
  children,
  currentStep,
  totalSteps = 5,
  isNextDisabled = false,
  onNext,
}: StepLayoutProps) {
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);
  const stepName = useMemo(() => STEP_NAMES[currentStep] ?? `Step ${currentStep}`, [currentStep]);
  const prevStepRef = useRef(currentStep);
  const [dir, setDir] = useState<1 | -1>(1);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    isFirstMountRef.current = false;
  }, []);

  useEffect(() => {
    gtag.stepView(currentStep, stepName);
  }, [currentStep, stepName]);

  useEffect(() => {
    const prev = prevStepRef.current;
    if (prev !== currentStep) {
      setDir(currentStep > prev ? 1 : -1);
      prevStepRef.current = currentStep;
    }
  }, [currentStep]);

  const handlePrev = () => {
    if (currentStep > 1) {
      gtag.stepBack(currentStep, currentStep - 1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (onNext) onNext();
    else if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const showPrev = currentStep > 1;
  const showNext = currentStep < totalSteps;

  return (
    <div className="flex flex-col h-[calc(100dvh-49px)] overflow-hidden bg-surface-secondary">
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait" initial={true}>
          <motion.div
            key={currentStep}
            initial={isFirstMountRef.current ? { opacity: 1, x: 0 } : { opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -dir * 40 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full max-w-lg mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="shrink-0 bg-surface-secondary">
        {currentStep === totalSteps && <SelectionSummary currentStep={currentStep} />}
        <div className="px-5 pb-5 pt-3">
          <div className="bg-white rounded-2xl p-4 shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
            <div className="flex gap-3">
        {showPrev && (
          <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={handlePrev}>
            이전
          </Button>
        )}
        {showNext && (
          <Button type="button" variant="primary" size="lg" disabled={isNextDisabled} className="flex-1" onClick={handleNext}>
            다음
          </Button>
        )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
