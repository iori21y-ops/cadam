'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadProgress } from '@/lib/mission-progress';
import type { MissionProgress } from '@/lib/mission-progress';

interface NextMissionProps {
  current: 'vehicle' | 'finance';
}

const MISSION_INFO = {
  vehicle: {
    emoji: '🚗',
    title: '차종 진단',
    href: '/diagnosis/vehicle',
    desc: '라이프스타일에 맞는 차종을 추천받아 보세요',
  },
  finance: {
    emoji: '🎯',
    title: '이용방법 진단',
    href: '/diagnosis/finance',
    desc: '할부·리스·렌트 중 최적의 이용방법을 찾아보세요',
  },
} as const;

const MISSION_ORDER: ('vehicle' | 'finance')[] = ['vehicle', 'finance'];

export function NextMission({ current }: NextMissionProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<MissionProgress | null>(null);

  useEffect(() => {
    // 약간의 딜레이로 saveMissionStep 이후 최신 상태 읽기
    const timer = setTimeout(() => setProgress(loadProgress()), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!progress) return null;

  // 현재 진단은 방금 완료했으므로 done으로 간주
  const effectiveProgress = {
    ...progress,
    [current]: { ...progress[current], done: true },
  };

  const doneCount = [effectiveProgress.vehicle.done, effectiveProgress.finance.done].filter(Boolean).length;
  const allDone = doneCount === 2;

  // 다음 미완료 미션 찾기 (현재 스텝 제외)
  const nextStep = MISSION_ORDER.find((key) => key !== current && !effectiveProgress[key].done);

  // 모든 미션 완료 → 맞춤 상담으로
  if (allDone) {
    return (
      <button
        onClick={() => router.push('/quote')}
        className="w-full rounded-2xl p-5 text-center text-white transition-all hover:shadow-lg active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #F59E0B, #FBBF24)' }}
      >
        <span className="text-xl block mb-1">🏆</span>
        <p className="text-[15px] font-bold mb-1">2단계 진단 모두 완료!</p>
        <p className="text-xs text-white/80 mb-3">진단 결과를 바탕으로 맞춤 상담을 받아보세요</p>
        <span className="inline-block px-4 py-2 rounded-xl bg-white text-amber-600 font-bold text-sm">
          맞춤 상담 신청 →
        </span>
      </button>
    );
  }

  // 다음 미션이 없으면 (현재 것만 남은 경우) → 상담 유도
  if (!nextStep) {
    return (
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
        <button
          onClick={() => router.push('/quote')}
          className="w-full px-5 py-4 flex items-center gap-3 border-t border-border transition-colors hover:bg-surface-secondary/50"
        >
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
            <span className="text-lg">📋</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[13px] text-success font-semibold mb-0.5">바로 견적 받기</p>
            <p className="text-[11px] text-text-sub">진단 없이도 견적을 받을 수 있어요</p>
          </div>
          <span className="text-xs font-bold text-success shrink-0">시작 →</span>
        </button>
      </div>
    );
  }

  const next = MISSION_INFO[nextStep];

  return (
    <div className="rounded-2xl bg-surface shadow-sm overflow-hidden">
      {/* 진행률 */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-text-sub">미션 진행률</p>
        <div className="flex items-center gap-1.5">
          {MISSION_ORDER.map((key, i) => {
            const done = progress[key].done;
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

      {/* 다음 미션 CTA */}
      <button
        onClick={() => router.push(next.href)}
        className="w-full px-5 py-4 flex items-center gap-3 border-t border-border transition-colors hover:bg-surface-secondary/50 active:bg-surface-secondary"
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-lg">{next.emoji}</span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] text-primary font-semibold mb-0.5">
            다음 단계: {next.title}
          </p>
          <p className="text-[11px] text-text-sub">{next.desc}</p>
        </div>
        <span className="text-xs font-bold text-primary shrink-0">시작 →</span>
      </button>
    </div>
  );
}
