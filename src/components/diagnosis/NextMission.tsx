'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadProgress } from '@/lib/mission-progress';
import { useQuoteStore } from '@/store/quoteStore';
import type { MissionProgress } from '@/lib/mission-progress';
import { RenderIcon, IconTrophy } from '@/components/icons/RentailorIcons';

interface NextMissionProps {
  current: 'vehicle' | 'finance';
}

const MISSION_INFO = {
  vehicle: {
    icon: 'IconCarSedan',
    title: '차종 진단',
    href: '/diagnosis/vehicle',
    desc: '라이프스타일에 맞는 차종을 추천받아 보세요',
  },
  finance: {
    icon: 'IconTarget',
    title: '장기렌트 절약 진단',
    href: '/diagnosis/finance',
    desc: '장기렌트 적합도를 분석해 절약 포인트를 알아보세요',
  },
} as const;

const MISSION_ORDER: ('vehicle' | 'finance')[] = ['vehicle', 'finance'];

export function NextMission({ current }: NextMissionProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<MissionProgress | null>(null);
  const prefillFromDiagnosis = useQuoteStore((s) => s.prefillFromDiagnosis);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(loadProgress()), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!progress) return null;

  const effectiveProgress = {
    ...progress,
    [current]: { ...progress[current], done: true },
  };

  const doneCount = [effectiveProgress.vehicle.done, effectiveProgress.finance.done].filter(Boolean).length;
  const allDone = doneCount === 2;
  const nextStep = MISSION_ORDER.find((key) => key !== current && !effectiveProgress[key].done);

  const handleQuoteNav = () => {
    prefillFromDiagnosis();
    router.push('/quote');
  };

  // 모든 미션 완료 → 맞춤 상담
  if (allDone) {
    return (
      <button
        onClick={handleQuoteNav}
        className="w-full rounded-2xl p-5 text-center transition-all hover:shadow-lg active:scale-[0.98]"
        style={{ background: '#0D1B2A', color: '#F5F0E8' }}
      >
        <span className="block mb-1 flex justify-center"><IconTrophy size={20} /></span>
        <p className="text-[15px] font-bold mb-1">2단계 진단 모두 완료!</p>
        <p className="text-xs mb-3" style={{ color: 'rgba(245,240,232,0.6)' }}>진단 결과를 바탕으로 맞춤 상담을 받아보세요</p>
        <span className="inline-block cta-gold text-primary font-bold rounded-xl px-4 py-2 text-sm">
          맞춤 상담 신청 →
        </span>
      </button>
    );
  }

  // 1개 완료, 1개 남음 → 다음 미션 + 바로 상담 신청 둘 다 표시
  if (nextStep) {
    const next = MISSION_INFO[nextStep];
    return (
      <div className="space-y-3">
        {/* 바로 상담 신청 CTA */}
        <button
          onClick={handleQuoteNav}
          className="w-full rounded-2xl p-4 text-center transition-all hover:shadow-lg active:scale-[0.98]"
          style={{ background: '#0D1B2A', color: '#F5F0E8' }}
        >
          <p className="text-[14px] font-bold mb-1">이 결과로 바로 상담 신청</p>
          <p className="text-[11px]" style={{ color: 'rgba(245,240,232,0.6)' }}>진단 결과가 자동으로 반영됩니다</p>
        </button>

        {/* 다음 미션 카드 */}
        <div className="rounded-2xl bg-surface shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-text-sub">미션 진행률</p>
            <div className="flex items-center gap-1.5">
              {MISSION_ORDER.map((key, i) => {
                const done = effectiveProgress[key].done;
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      done
                        ? 'bg-primary text-white'
                        : key === nextStep
                        ? 'bg-primary/10 text-primary border-2 border-primary'
                        : 'bg-surface-secondary text-text-muted'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    {i < 1 && (
                      <div className={`w-4 h-0.5 rounded-full ${done ? 'bg-primary' : 'bg-border-solid'}`} />
                    )}
                  </div>
                );
              })}
              <span className="text-[11px] text-text-muted ml-1">{doneCount}/2</span>
            </div>
          </div>

          <button
            onClick={() => router.push(next.href)}
            className="w-full px-5 py-4 flex items-center gap-3 border-t border-border transition-colors hover:bg-surface-secondary/50 active:bg-surface-secondary"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <RenderIcon name={next.icon} size={20} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] text-primary font-semibold mb-0.5">
                더 정확한 결과: {next.title}
              </p>
              <p className="text-[11px] text-text-sub">{next.desc}</p>
            </div>
            <span className="text-xs font-bold text-primary shrink-0">시작 →</span>
          </button>
        </div>
      </div>
    );
  }

  // 다음 미션이 없는 경우 (현재 것만 남은 경우)
  return (
    <div className="space-y-3">
      <button
        onClick={handleQuoteNav}
        className="w-full rounded-2xl p-4 text-center transition-all hover:shadow-lg active:scale-[0.98]"
        style={{ background: '#0D1B2A', color: '#F5F0E8' }}
      >
        <p className="text-[14px] font-bold mb-1">이 결과로 바로 상담 신청</p>
        <p className="text-[11px]" style={{ color: 'rgba(245,240,232,0.6)' }}>진단 결과가 자동으로 반영됩니다</p>
      </button>

      <div className="rounded-2xl bg-surface shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between">
          <p className="text-xs font-semibold text-text-sub">미션 진행률</p>
          <div className="flex items-center gap-1.5">
            {MISSION_ORDER.map((key, i) => {
              const done = progress[key].done;
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    done ? 'bg-primary text-white' : 'bg-surface-secondary text-text-muted'
                  }`}>
                    {done ? '✓' : i + 1}
                  </div>
                  {i < 1 && (
                    <div className={`w-4 h-0.5 rounded-full ${done ? 'bg-primary' : 'bg-border-solid'}`} />
                  )}
                </div>
              );
            })}
            <span className="text-[11px] text-text-muted ml-1">{doneCount}/2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
