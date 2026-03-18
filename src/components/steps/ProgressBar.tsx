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
  // Quiz 스타일: Step 1은 answered=0, Step 6은 answered=(totalSteps-1)
  const totalQuestions = Math.max(1, totalSteps - 1);
  const answeredCount = currentStep <= 1 ? 0 : Math.min(totalQuestions, currentStep - 1);
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);
  return (
    <div className="w-full px-5 pt-4 pb-2 max-w-[500px] mx-auto">
      <div
        className="flex justify-between mb-2"
        style={{ fontSize: 12, color: '#AEAEB2' }}
      >
        <span>Q{answeredCount + 1}</span>
        <span>
          {answeredCount}/~{totalQuestions}
        </span>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: '#E5E5EA' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${progressPct}%`,
            background: '#007AFF',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}
