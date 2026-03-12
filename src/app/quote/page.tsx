'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useHydrated } from '@/hooks/useHydrated';
import { useQuoteStore } from '@/store/quoteStore';
import { useLeaveIntent } from '@/hooks/useLeaveIntent';
import { StepLayout } from '@/components/steps/StepLayout';
import { Step1Branch } from '@/components/steps/Step1Branch';
import { Step2Car } from '@/components/steps/Step2Car';
import { Step2Budget } from '@/components/steps/Step2Budget';
import { Step3Period } from '@/components/steps/Step3Period';
import { Step4Mileage } from '@/components/steps/Step4Mileage';
import { Step5Payment } from '@/components/steps/Step5Payment';
import { Step6Contact } from '@/components/steps/Step6Contact';

const LeaveModal = dynamic(
  () => import('@/components/LeaveModal').then((m) => ({ default: m.LeaveModal })),
  { ssr: false }
);

export default function QuotePage() {
  const hydrated = useHydrated();
  const currentStep = useQuoteStore((s) => s.currentStep);
  const selectionPath = useQuoteStore((s) => s.selectionPath);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);
  const [step5Complete, setStep5Complete] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const handleLeaveIntent = useCallback(() => {
    setShowLeaveModal(true);
  }, []);

  useLeaveIntent(currentStep, handleLeaveIntent);

  if (!hydrated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <StepLayout
        currentStep={currentStep}
        isNextDisabled={
          currentStep === 1 ? true : currentStep === 5 ? !step5Complete : false
        }
        onNext={
          currentStep === 5 && step5Complete
            ? () => setCurrentStep(6)
            : undefined
        }
      >
        {currentStep === 1 && <Step1Branch />}
        {currentStep === 2 && selectionPath === 'car' && <Step2Car />}
        {currentStep === 2 && selectionPath === 'budget' && <Step2Budget />}
        {currentStep === 2 && !selectionPath && <Step1Branch />}
        {currentStep === 3 && <Step3Period />}
        {currentStep === 4 && <Step4Mileage />}
        {currentStep === 5 && (
          <Step5Payment onCompleteChange={setStep5Complete} />
        )}
        {currentStep === 6 && <Step6Contact />}
      </StepLayout>
      <LeaveModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        currentStep={currentStep}
      />
    </>
  );
}
