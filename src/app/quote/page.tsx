'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useHydrated } from '@/hooks/useHydrated';
import { useQuoteStore } from '@/store/quoteStore';
import { useLeaveIntent } from '@/hooks/useLeaveIntent';
import { StepLayout } from '@/components/steps/StepLayout';
import { Step3Period } from '@/components/steps/Step3Period';
import { Step5Payment } from '@/components/steps/Step5Payment';
import { Step6Contact } from '@/components/steps/Step6Contact';
import { loadProgress } from '@/lib/mission-progress';

const LeaveModal = dynamic(
  () => import('@/components/LeaveModal').then((m) => ({ default: m.LeaveModal })),
  { ssr: false }
);

// 이용방법 진단에서 주행거리 자동 매핑
const MILEAGE_MAP: Record<string, 10000 | 20000 | 30000 | 40000> = {
  '10000': 10000,
  '20000': 20000,
  '30000': 30000,
  '40000': 40000,
};

function needsPaymentStep(): boolean {
  const progress = loadProgress();
  const summary = progress.finance.summary ?? '';
  return summary.includes('렌트') || summary.includes('리스');
}

function getAutoMileage(): 10000 | 20000 | 30000 | 40000 | null {
  const progress = loadProgress();
  const mileageAnswer = progress.finance.answers?.mileage;
  if (mileageAnswer) {
    return MILEAGE_MAP[mileageAnswer.value] ?? null;
  }
  return null;
}

// 플로우:
// 렌트/리스: Step1 계약기간 → Step2 결제방식 → Step3 연락처
// 할부/현금: Step1 계약기간 → Step2 연락처
// 주행거리는 이용방법 진단에서 자동 매핑

export default function QuotePage() {
  const hydrated = useHydrated();
  const currentStep = useQuoteStore((s) => s.currentStep);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);
  const setAnnualKm = useQuoteStore((s) => s.setAnnualKm);
  const [paymentNeeded, setPaymentNeeded] = useState(true);
  const [step2Complete, setStep2Complete] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    setPaymentNeeded(needsPaymentStep());
    // 주행거리 자동 매핑
    const autoKm = getAutoMileage();
    if (autoKm) setAnnualKm(autoKm);
  }, [setAnnualKm]);

  const totalSteps = paymentNeeded ? 3 : 2;

  const handleLeaveIntent = useCallback(() => {
    setShowLeaveModal(true);
  }, []);

  useLeaveIntent(currentStep, handleLeaveIntent);

  const paymentStepNum = 2;
  const contactStepNum = paymentNeeded ? 3 : 2;

  const isNextDisabled = paymentNeeded && currentStep === paymentStepNum ? !step2Complete : false;
  const onNext = paymentNeeded && currentStep === paymentStepNum && step2Complete
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
        {paymentNeeded && currentStep === 2 && (
          <Step5Payment onCompleteChange={setStep2Complete} />
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
