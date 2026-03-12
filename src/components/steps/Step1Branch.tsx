'use client';

import { useState, useCallback } from 'react';
import { useQuoteStore } from '@/store/quoteStore';
import type { SelectionPath } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';

interface Option {
  path: SelectionPath;
  emoji: string;
  label: string;
  sub: string;
}

const OPTIONS: Option[] = [
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

export function Step1Branch() {
  const [selectedPath, setSelectedPath] = useState<SelectionPath | null>(null);
  const setSelectionPath = useQuoteStore((s) => s.setSelectionPath);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);

  const handleSelect = useCallback(
    (path: SelectionPath) => {
      if (selectedPath) return;
      setSelectedPath(path);
      setSelectionPath(path);
      gtag.stepComplete(1, path ?? '');
      setTimeout(() => {
        setCurrentStep(2);
      }, TRANSITION_DELAY_MS);
    },
    [selectedPath, setSelectionPath, setCurrentStep]
  );

  return (
    <>
      <div className="pt-7 px-5 pb-2 text-center">
        <h2 className="text-[22px] font-bold text-gray-900 leading-snug">
          당신에게 더 중요한 선택은
          <br />
          무엇인가요?
        </h2>
      </div>
      <div className="flex flex-col gap-2.5 px-5 py-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.path}
            type="button"
            onClick={() => handleSelect(opt.path)}
            disabled={selectedPath !== null}
            className={`
              w-full p-4 pl-[18px] bg-white rounded-xl cursor-pointer text-left
              flex items-center gap-3 transition-all duration-150
              border-2
              ${
                selectedPath === opt.path
                  ? 'border-accent bg-[#EBF5FB]'
                  : 'border-gray-200 hover:border-accent hover:bg-[#EBF5FB]'
              }
              disabled:cursor-default
            `}
          >
            <span className="text-2xl shrink-0">{opt.emoji}</span>
            <div className="min-w-0">
              <div
                className={`text-base font-semibold ${
                  selectedPath === opt.path ? 'text-accent' : 'text-gray-900'
                }`}
              >
                {opt.label}
              </div>
              <div className="text-[13px] text-gray-500 mt-0.5">{opt.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
