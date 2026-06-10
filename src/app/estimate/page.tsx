'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useHydrated } from '@/hooks/useHydrated';
import { useQuoteStore } from '@/store/quoteStore';
import { ProgressBar } from '@/components/steps/ProgressBar';
import { Step2Car } from '@/components/steps/Step2Car';
import { Step3Period } from '@/components/steps/Step3Period';
import { Step4Mileage } from '@/components/steps/Step4Mileage';
import { EstimateDeposit } from '@/components/estimate/EstimateDeposit';
import { EstimateResult } from '@/components/estimate/EstimateResult';
import { EstimateContact } from '@/components/estimate/EstimateContact';
import { Button } from '@/components/ui/Button';
import { IconCheck } from '@/components/icons/RentailorIcons';

const TOTAL_STEPS = 6;

/**
 * /estimate — 토스 스타일 단계형 견적 마법사 (독립 플로우).
 *
 * 한 화면 한 질문: 차종 → 기간 → 주행거리 → 보증금 → 결과(월 예상 납입금) → 상담 신청.
 * 기존 /quote(진단 퍼널 연동)와 분리된 라우트이며, 단계 전환은 store.currentStep이 아니라
 * 이 페이지의 로컬 step 상태로 제어한다(재사용 컴포넌트엔 onAdvance 콜백 주입).
 * 선택값(차종·기간·주행·보증금)은 quoteStore에 저장되어 결과 조회·상담 저장에 그대로 쓰인다.
 */
export default function EstimatePage() {
  const hydrated = useHydrated();
  const resetAll = useQuoteStore((s) => s.resetAll);
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  // 마법사 진입 시 이전(또는 /quote에서 넘어온) persist 값이 섞이지 않도록 초기화
  useEffect(() => {
    resetAll();
  }, [resetAll]);

  const goNext = useCallback(() => setStep((s) => Math.min(TOTAL_STEPS, s + 1)), []);
  const goBack = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);

  if (!hydrated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 신청 완료 화면
  if (done) {
    return (
      <div className="min-h-[100dvh] bg-surface-secondary flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <IconCheck size={32} className="text-primary" />
        </div>
        <h1 className="text-[22px] font-bold text-text mb-2">상담 신청이 완료됐어요</h1>
        <p className="text-sm text-text-sub leading-relaxed mb-8">
          전문 상담사가 정확한 견적과 함께
          <br />
          빠르게 연락드리겠습니다.
        </p>
        <Link href="/" className="w-full max-w-xs">
          <Button type="button" variant="primary" size="lg" fullWidth>
            홈으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface-secondary flex flex-col">
      {/* 상단: 뒤로가기 + 진행바 */}
      <div className="shrink-0">
        <div className="h-12 flex items-center px-3 max-w-lg mx-auto w-full">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 text-sm font-semibold text-text-sub px-2 py-1 hover:text-primary transition-colors"
              aria-label="이전 단계"
            >
              ← 이전
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-1 text-sm font-semibold text-text-sub px-2 py-1 hover:text-primary transition-colors"
            >
              ← 나가기
            </Link>
          )}
        </div>
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />
      </div>

      {/* 단계 본문 */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div className="w-full max-w-lg mx-auto">
          {step === 1 && <Step2Car onAdvance={goNext} />}
          {step === 2 && <Step3Period onAdvance={goNext} />}
          {step === 3 && <Step4Mileage onAdvance={goNext} simple />}
          {step === 4 && <EstimateDeposit onAdvance={goNext} />}
          {step === 5 && <EstimateResult onAdvance={goNext} />}
          {step === 6 && <EstimateContact onSubmitted={() => setDone(true)} />}
        </div>
      </div>
    </div>
  );
}
