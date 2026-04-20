'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, Sparkles } from 'lucide-react';
import { loadProgress, DEFAULT_PROGRESS } from '@/lib/mission-progress';
import type { MissionProgress } from '@/lib/mission-progress';

export function DiagnosisBanner() {
  const [progress, setProgress] = useState<MissionProgress>(DEFAULT_PROGRESS);

  useEffect(() => {
    setProgress(loadProgress());

    const handler = () => setProgress(loadProgress());
    window.addEventListener('mission-update', handler);
    return () => {
      window.removeEventListener('mission-update', handler);
    };
  }, []);

  const doneCount = [progress.vehicle.done, progress.finance.done].filter(Boolean).length;
  const allDone = doneCount === 2;
  const inProgress = doneCount > 0 && !allDone;

  let ctaText = '1분 무료 진단 \u2192';
  let ctaHref = '/diagnosis';
  if (allDone) {
    ctaText = '진단 결과 보기 \u2192';
    ctaHref = '/diagnosis/vehicle?restore=1';
  } else if (inProgress) {
    ctaText = '이어서 진단하기 \u2192';
  }

  return (
    <section className="bg-gray-50 py-16 px-5">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-primary font-bold text-2xl mb-8">
          나에게 맞는 차, AI가 찾아드립니다
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-primary font-bold text-sm">Step 1</p>
              <p className="text-text-sub text-xs">간단한 질문에 답하기 (1분)</p>
            </div>
          </div>

          <div className="hidden sm:block w-8 h-px bg-border" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-primary font-bold text-sm">Step 2</p>
              <p className="text-text-sub text-xs">맞춤 차량 + 견적 받기</p>
            </div>
          </div>
        </div>

        {inProgress && (
          <p className="text-text-sub text-sm mb-4">
            진행률 {doneCount}/2 완료
          </p>
        )}

        <Link
          href={ctaHref}
          className="inline-block cta-gold text-primary font-bold rounded-xl px-8 py-4 text-lg"
        >
          {ctaText}
        </Link>
      </div>
    </section>
  );
}
