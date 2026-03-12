'use client';

import { useQuoteStore } from '@/store/quoteStore';

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

export function ProgressBar({
  currentStep,
  totalSteps = 6,
}: ProgressBarProps) {
  const resetAll = useQuoteStore((s) => s.resetAll);
  // 첫 화면(Step 1) 0%, Step 6에서 100%
  const pct =
    currentStep <= 1
      ? 0
      : Math.min(100, ((currentStep - 1) / (totalSteps - 1)) * 100);
  const pctDisplay = Math.round(pct);
  return (
    <div className="px-5 pt-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-500">
          Step {currentStep} / {totalSteps}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetAll}
            className="text-xs text-gray-400 hover:text-accent transition-colors"
          >
            처음부터
          </button>
          <span className="text-xs font-semibold text-accent">{pctDisplay}%</span>
        </div>
      </div>
      <div className="h-1 bg-gray-200 rounded">
        <div
          className="h-full bg-accent rounded transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
