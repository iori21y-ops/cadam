'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useHydrated } from '@/hooks/useHydrated';
import { useQuoteStore } from '@/store/quoteStore';
import { useLeaveIntent } from '@/hooks/useLeaveIntent';
import { StepLayout } from '@/components/steps/StepLayout';
import { Step2Car } from '@/components/steps/Step2Car';
import { Step3Period } from '@/components/steps/Step3Period';
import { Step4Mileage } from '@/components/steps/Step4Mileage';
import { Step5Payment } from '@/components/steps/Step5Payment';
import { Step6Contact } from '@/components/steps/Step6Contact';
import { loadProgress } from '@/lib/mission-progress';

const LeaveModal = dynamic(
  () => import('@/components/LeaveModal').then((m) => ({ default: m.LeaveModal })),
  { ssr: false }
);

function needsPaymentStep(): boolean {
  const progress = loadProgress();
  const summary = progress.finance.summary ?? '';
  return summary.includes('렌트') || summary.includes('리스');
}

/*
 * 외부 유입(directAccess) 시 스텝 매핑 문제 해결:
 *
 * 기존 컴포넌트들은 선택 완료 시 하드코딩된 스텝 번호로 이동함:
 *   Step2Car → setCurrentStep(3)
 *   Step3Period → setCurrentStep(2)
 *   Step4Mileage → setCurrentStep(3)
 *   Step5Payment → setCurrentStep(3)
 *
 * 외부 유입 플로우 (5 스텝):
 *   1:Car → 2:Period → 3:Mileage → 4:Payment → 5:Contact
 *
 * 해결: 각 컴포넌트가 setCurrentStep을 호출하면,
 * useEffect에서 감지하여 올바른 스텝으로 재매핑함.
 */

export default function QuotePage() {
  const hydrated = useHydrated();
  const currentStep = useQuoteStore((s) => s.currentStep);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);
  const carBrand = useQuoteStore((s) => s.carBrand);
  const carModel = useQuoteStore((s) => s.carModel);
  const prefillFromDiagnosis = useQuoteStore((s) => s.prefillFromDiagnosis);
  const resetAll = useQuoteStore((s) => s.resetAll);
  const [paymentNeeded, setPaymentNeeded] = useState(true);
  const [step2Complete, setStep2Complete] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [diagnosisPrefilled, setDiagnosisPrefilled] = useState(false);
  const [directAccess, setDirectAccess] = useState(false);

  // 어떤 스텝에서 자동 이동이 발생했는지 추적
  const expectedStepRef = useRef<number>(1);

  useEffect(() => {
    setPaymentNeeded(needsPaymentStep());
    const ok = prefillFromDiagnosis();
    setDiagnosisPrefilled(ok);
    if (!ok) {
      setDirectAccess(true);
      resetAll();
      setCurrentStep(1);
      setPaymentNeeded(true);
      expectedStepRef.current = 1;
    }
  }, [prefillFromDiagnosis, resetAll, setCurrentStep]);

  // 외부 유입 모드에서 하드코딩 스텝 이동을 가로채서 올바른 스텝으로 매핑
  useEffect(() => {
    if (!directAccess) return;
    
    const expected = expectedStepRef.current;
    
    // 컴포넌트가 하드코딩된 값으로 점프한 경우 → 올바른 다음 스텝으로 교정
    if (currentStep !== expected) {
      // 현재 어떤 스텝에 있었는지에 따라 다음 스텝 결정
      const nextStep = expected + 1;
      const totalSteps = paymentNeeded ? 5 : 4;
      
      if (nextStep <= totalSteps && currentStep !== nextStep) {
        expectedStepRef.current = nextStep;
        setCurrentStep(nextStep);
        return;
      }
    }
  }, [currentStep, directAccess, paymentNeeded, setCurrentStep]);

  // expectedStepRef를 현재 스텝에 동기화 (이전 버튼, 정상 이동 시)
  useEffect(() => {
    expectedStepRef.current = currentStep;
  }, [currentStep]);

  const steps = directAccess
    ? ['car', 'period', 'mileage', ...(paymentNeeded ? ['payment'] : []), 'contact']
    : ['period', ...(paymentNeeded ? ['payment'] : []), 'contact'];

  const totalSteps = steps.length;
  const currentStepName = steps[currentStep - 1] ?? 'contact';

  const handleLeaveIntent = useCallback(() => {
    setShowLeaveModal(true);
  }, []);

  useLeaveIntent(currentStep, handleLeaveIntent);

  // StepLayout의 "다음" 버튼은 contact 스텝에서는 숨김 (Step6Contact가 자체 제출)
  // payment 스텝에서는 완료 후 다음으로 이동
  const isContactStep = currentStepName === 'contact';
  const isPaymentStep = currentStepName === 'payment';
  const isNextDisabled = isPaymentStep ? !step2Complete : false;
  const onNext = isPaymentStep && step2Complete
    ? () => {
        const nextIdx = steps.indexOf('contact') + 1;
        expectedStepRef.current = nextIdx;
        setCurrentStep(nextIdx);
      }
    : undefined;

  if (!hydrated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-surface-secondary">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
        {directAccess && currentStep === 1 && (
          <div className="mx-5 mb-4 p-4 rounded-2xl bg-[#FFF8E1] border border-[#FFE082]">
            <p className="text-[13px] font-semibold text-[#F57F17] mb-1">🚗 무료 견적 비교</p>
            <p className="text-[11px] text-[#795548] leading-relaxed">
              차종과 조건을 선택하면 여러 렌트사의 견적을 비교하여 안내드려요
            </p>
          </div>
        )}

        {!directAccess && hasDiagnosisInfo && currentStep === 1 && (
          <div className="mx-5 mb-4 p-4 rounded-2xl bg-primary/5 border border-primary/15">
            <p className="text-[11px] font-semibold text-primary mb-2">AI 진단 결과 반영</p>
            <div className="flex items-center gap-2 flex-wrap">
              {carBrand && carModel && (
                <span className="text-xs font-bold text-text bg-white px-3 py-1.5 rounded-full border border-border-solid">
                  🚗 {carBrand} {carModel}
                </span>
              )}
              {financeSummary && (
                <span className="text-xs font-bold text-text bg-white px-3 py-1.5 rounded-full border border-border-solid">
                  🎯 {financeSummary}
                </span>
              )}
            </div>
            <p className="text-[10px] text-text-sub mt-2">아래에서 계약 조건을 선택하면 맞춤 견적을 받을 수 있어요</p>
          </div>
        )}

        {currentStepName === 'car' && <Step2Car />}
        {currentStepName === 'period' && <Step3Period />}
        {currentStepName === 'mileage' && <Step4Mileage />}
        {currentStepName === 'payment' && (
          <Step5Payment onCompleteChange={setStep2Complete} />
        )}
        {currentStepName === 'contact' && <Step6Contact />}
      </StepLayout>
      <LeaveModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        currentStep={currentStep}
      />
    </>
  );
}
