'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuoteStore } from '@/store/quoteStore';
import type { SelectionPath } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';
import { motion } from 'framer-motion';
import { SelectCard } from '@/components/ui/SelectCard';

interface StepOption {
  path: SelectionPath;
  emoji: string;
  label: string;
  sub: string;
}

const STEP_OPTIONS: StepOption[] = [
  {
    path: 'car',
    emoji: '🚗',
    label: '차종 먼저 선택할게요',
    sub: '원하는 차량을 직접 고르기',
  },
  {
    path: 'budget',
    emoji: '💰',
    label: '월 예산 먼저 정할게요',
    sub: '예산에 맞는 차량 추천받기',
  },
];

const TRANSITION_DELAY_MS = 300;
const COLOR = '#007AFF';

export function Step1Branch() {
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState<SelectionPath | null>(null);
  const [popularClicked, setPopularClicked] = useState(false);
  const setSelectionPath = useQuoteStore((s) => s.setSelectionPath);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);

  const handleSelect = useCallback(
    (path: SelectionPath) => {
      if (selectedPath || popularClicked) return;
      setSelectedPath(path);
      setSelectionPath(path);
      gtag.stepComplete(1, path ?? '');
      setTimeout(() => {
        setCurrentStep(2);
      }, TRANSITION_DELAY_MS);
    },
    [selectedPath, popularClicked, setSelectionPath, setCurrentStep]
  );

  const handlePopular = useCallback(() => {
    if (selectedPath || popularClicked) return;
    setPopularClicked(true);
    setTimeout(() => {
      router.push('/popular-estimates');
    }, TRANSITION_DELAY_MS);
  }, [selectedPath, popularClicked, router]);

  const isDisabled = selectedPath !== null || popularClicked;

  return (
    <>
      <div className="pt-7 px-5 pb-2 text-center">
        <h2 className="text-[22px] font-bold text-[#1D1D1F] leading-snug">
          당신에게 더 중요한 선택은
          <br />
          무엇인가요?
        </h2>
      </div>
      <div className="flex flex-col gap-2.5 px-5 py-3">
        {STEP_OPTIONS.map((opt, idx) => (
          <motion.div
            key={opt.path}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
          >
            <SelectCard
              selected={selectedPath === opt.path}
              dimmed={isDisabled && selectedPath !== opt.path}
              color={COLOR}
              disabled={isDisabled}
              onClick={() => handleSelect(opt.path)}
            >
              <span className="text-2xl shrink-0">{opt.emoji}</span>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-[16px] font-medium leading-tight ${
                    selectedPath === opt.path ? 'text-white' : 'text-[#1D1D1F]'
                  }`}
                >
                  {opt.label}
                </div>
                <div
                  className={`text-[15px] mt-0.5 ${
                    selectedPath === opt.path ? 'text-white/70' : 'text-[#86868B]'
                  }`}
                >
                  {opt.sub}
                </div>
              </div>
            </SelectCard>
          </motion.div>
        ))}

        {/* 인기차종 견적 미리보기 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: STEP_OPTIONS.length * 0.08,
            duration: 0.3,
          }}
        >
          <SelectCard
            selected={popularClicked}
            dimmed={isDisabled && !popularClicked}
            color={COLOR}
            disabled={isDisabled}
            onClick={handlePopular}
          >
            <span className="text-2xl shrink-0">📊</span>
            <div className="min-w-0 flex-1">
              <div className={`text-[16px] font-medium ${popularClicked ? 'text-white' : 'text-[#1D1D1F]'}`}>
                인기차종 견적 미리 볼께요
              </div>
              <div className={`text-[15px] mt-0.5 ${popularClicked ? 'text-white/70' : 'text-[#86868B]'}`}>
                인기 차종 월 납부금 한눈에 비교
              </div>
            </div>
          </SelectCard>
        </motion.div>
      </div>
    </>
  );
}
