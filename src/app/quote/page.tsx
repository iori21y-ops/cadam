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
import { IconCarSedan, IconTarget } from '@/components/icons/RentailorIcons';

const LeaveModal = dynamic(
  () => import('@/components/LeaveModal').then((m) => ({ default: m.LeaveModal })),
  { ssr: false }
);

function needsPaymentStep(): boolean {
  const progress = loadProgress();
  const summary = progress.finance.summary ?? '';
  return summary.includes('렌트') || summary.includes('리스');
}

export default function QuotePage() {
  const hydrated = useHydrated();
  const currentStep = useQuoteStore((s) => s.currentStep);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);
  const carBrand = useQuoteStore((s) => s.carBrand);
  const carModel = useQuoteStore((s) => s.carModel);
  const prefillFromDiagnosis = useQuoteStore((s) => s.prefillFromDiagnosis);
  const [paymentNeeded, setPaymentNeeded] = useState(true);
  const [step2Complete, setStep2Complete] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [diagnosisPrefilled, setDiagnosisPrefilled] = useState(false);

  useEffect(() => {
    setPaymentNeeded(needsPaymentStep());
    // 진단 결과 자동 세팅
    const ok = prefillFromDiagnosis();
    setDiagnosisPrefilled(ok);
  }, [prefillFromDiagnosis]);

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

  // 진단 결과 요약 배너
  const progress = loadProgress();
  const financeSummary = progress.finance.summary;
  const hasDiagnosisInfo = diagnosisPrefilled || (carBrand && carModel);

  return (
    <>
      <StepLayout
        currentStep={currentStep}
        totalSteps={totalSteps}
        isNextDisabled={isNextDisabled}
        onNext={onNext}
      >
        {/* 진단 결과 요약 배너 */}
        {hasDiagnosisInfo && currentStep === 1 && (
          <div className="mx-5 mb-4 p-4 rounded-2xl bg-primary/5 border border-primary/15">
            <p className="text-[11px] font-semibold text-primary mb-2">AI 진단 결과 반영</p>
            <div className="flex items-center gap-2 flex-wrap">
              {carBrand && carModel && (
                <span className="text-xs font-bold text-text bg-white px-3 py-1.5 rounded-full border border-border-solid flex items-center gap-1">
                  <IconCarSedan size={13} className="text-primary" /> {carBrand} {carModel}
                </span>
              )}
              {financeSummary && (
                <span className="text-xs font-bold text-text bg-white px-3 py-1.5 rounded-full border border-border-solid flex items-center gap-1">
                  <IconTarget size={13} className="text-primary" /> {financeSummary}
                </span>
              )}
            </div>
            <p className="text-[10px] text-text-sub mt-2">아래에서 계약 조건을 선택하면 맞춤 견적을 받을 수 있어요</p>
          </div>
        )}

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
