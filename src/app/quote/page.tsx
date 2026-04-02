'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useHydrated } from '@/hooks/useHydrated';
import { useQuoteStore } from '@/store/quoteStore';
import { useLeaveIntent } from '@/hooks/useLeaveIntent';
import { StepLayout } from '@/components/steps/StepLayout';
import { Step2Budget } from '@/components/steps/Step2Budget';
import { Step3Period } from '@/components/steps/Step3Period';
import { Step4Mileage } from '@/components/steps/Step4Mileage';
import { Step5Payment } from '@/components/steps/Step5Payment';
import { Step6Contact } from '@/components/steps/Step6Contact';

const LeaveModal = dynamic(
  () => import('@/components/LeaveModal').then((m) => ({ default: m.LeaveModal })),
  { ssr: false }
);

// 새 플로우: 5단계
// Step 1: 월 예산 (Step2Budget)
// Step 2: 계약 기간 (Step3Period)
// Step 3: 주행거리 (Step4Mileage)
// Step 4: 결제 방식 (Step5Payment)
// Step 5: 연락처 (Step6Contact)

export default function QuotePage() {
  const hydrated = useHydrated();
  const currentStep = useQuoteStore((s) => s.currentStep);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);
  const [step4Complete, setStep4Complete] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const handleLeaveIntent = useCallback(() => {
    setShowLeaveModal(true);
  }, []);

  useLeaveIntent(currentStep, handleLeaveIntent);

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
        totalSteps={5}
        isNextDisabled={currentStep === 4 ? !step4Complete : false}
        onNext={
          currentStep === 4 && step4Complete
            ? () => setCurrentStep(5)
            : undefined
        }
      >
        {currentStep === 1 && <Step2Budget />}
        {currentStep === 2 && <Step3Period />}
        {currentStep === 3 && <Step4Mileage />}
        {currentStep === 4 && (
          <Step5Payment onCompleteChange={setStep4Complete} />
        )}
        {currentStep === 5 && <Step6Contact />}
      </StepLayout>
      <LeaveModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        currentStep={currentStep}
      />
    </>
  );
}
