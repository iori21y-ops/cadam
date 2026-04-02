'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useHydrated } from '@/hooks/useHydrated';
import { useQuoteStore } from '@/store/quoteStore';
import { useLeaveIntent } from '@/hooks/useLeaveIntent';
import { StepLayout } from '@/components/steps/StepLayout';
import { Step3Period } from '@/components/steps/Step3Period';
import { Step4Mileage } from '@/components/steps/Step4Mileage';
import { Step5Payment } from '@/components/steps/Step5Payment';
import { Step6Contact } from '@/components/steps/Step6Contact';
import { loadProgress } from '@/lib/mission-progress';

const LeaveModal = dynamic(
  () => import('@/components/LeaveModal').then((m) => ({ default: m.LeaveModal })),
  { ssr: false }
);

// 금융 진단 결과에서 렌트/리스인지 확인
function needsPaymentStep(): boolean {
  const progress = loadProgress();
  const summary = progress.finance.summary ?? '';
  // summary 형식: "장기렌트 87%" 또는 "리스 72%"
  return summary.includes('렌트') || summary.includes('리스');
}

// 플로우:
// 렌트/리스: Step1 계약기간 → Step2 주행거리 → Step3 결제방식 → Step4 연락처
// 할부/현금: Step1 계약기간 → Step2 주행거리 → Step3 연락처

export default function QuotePage() {
  const hydrated = useHydrated();
  const currentStep = useQuoteStore((s) => s.currentStep);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);
  const [paymentNeeded, setPaymentNeeded] = useState(true);
  const [step3Complete, setStep3Complete] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    setPaymentNeeded(needsPaymentStep());
  }, []);

  const totalSteps = paymentNeeded ? 4 : 3;

  const handleLeaveIntent = useCallback(() => {
    setShowLeaveModal(true);
  }, []);

  useLeaveIntent(currentStep, handleLeaveIntent);

  // 결제 방식 스텝의 실제 위치
  const paymentStepNum = 3; // 렌트/리스일 때만 존재
  const contactStepNum = paymentNeeded ? 4 : 3;

  const isNextDisabled = paymentNeeded && currentStep === paymentStepNum ? !step3Complete : false;
  const onNext = paymentNeeded && currentStep === paymentStepNum && step3Complete
    ? () => setCurrentStep(contactStepNum)
    : undefined;

  if (!hydrated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-surface-secondary">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <StepLayout
        currentStep={currentStep}
        totalSteps={totalSteps}
        isNextDisabled={isNextDisabled}
        onNext={onNext}
      >
        {currentStep === 1 && <Step3Period />}
        {currentStep === 2 && <Step4Mileage />}
        {paymentNeeded && currentStep === 3 && (
          <Step5Payment onCompleteChange={setStep3Complete} />
        )}
        {currentStep === contactStepNum && <Step6Contact />}
      </StepLayout>
      <LeaveModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        currentStep={currentStep}
      />
    </>
  );
}
