'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Footer } from '@/components/Footer';
import { usePageTransitionStore } from '@/store/pageTransitionStore';
import { BRAND } from '@/constants/brand';
import { loadProgress, restoreFromServer, DEFAULT_PROGRESS } from '@/lib/mission-progress';
import type { MissionProgress } from '@/lib/mission-progress';
import { useQuoteStore } from '@/store/quoteStore';

const STEPS = [
  {
    key: 'vehicle' as const,
    num: 1,
    href: '/diagnosis/vehicle',
    emoji: '🚗',
    title: '차종 진단',
    subtitle: '나에게 맞는 차종 찾기',
    desc: '라이프스타일, 예산, 주행 환경 등을 분석해서 45종 차량 중 가장 적합한 차종을 AI가 추천합니다.',
    features: ['용도·예산·인원 기반 분석', 'TOP 4 차종 추천 + 비교', '트림·옵션까지 맞춤 제안'],
    time: '약 1분',
    activeGradient: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
  },
  {
    key: 'finance' as const,
    num: 2,
    href: '/diagnosis/finance',
    emoji: '🎯',
    title: '장기렌트 적합도 진단',
    subtitle: '나의 장기렌트 적합도 %',
    desc: '소유 성향, 주행 패턴, 자금 계획 등을 분석해서 장기렌트가 나에게 얼마나 적합한지 점수로 알려드립니다.',
    features: ['적합도 0~100% 산출', '구간별 맞춤 메시지', '절약 포인트 분석'],
    time: '약 1분',
    activeGradient: 'linear-gradient(135deg, #2563EB, #60A5FA)',
  },
];

export default function HomePage() {
  const router = useRouter();
  const triggerPageTransition = usePageTransitionStore((s) => s.trigger);

  const [progress, setProgress] = useState<MissionProgress>(DEFAULT_PROGRESS);

  useEffect(() => {
    // 서버에서 복원 시도 후 로컬과 병합
    restoreFromServer().then((p) => setProgress(p));

    const handler = () => setProgress(loadProgress());
    window.addEventListener('mission-update', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('mission-update', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const doneCount = [progress.vehicle.done, progress.finance.done].filter(Boolean).length;
  const allDone = doneCount === 2;

  const prefillFromDiagnosis = useQuoteStore((s) => s.prefillFromDiagnosis);

  const handleNav = (href: string) => {
    triggerPageTransition();
    router.push(href);
  };

  const handleQuoteNav = () => {
    prefillFromDiagnosis();
    triggerPageTransition();
    router.push('/quote');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
      {/* ━━━ 히어로 ━━━ */}
      <section className="px-5 pt-12 pb-4 max-w-lg mx-auto w-full">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center font-bold text-text leading-tight mb-2 whitespace-pre-line"
          style={{ fontSize: 'clamp(28px, 6vw, 36px)' }}
        >
          {BRAND.mainHeading}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-center text-sm text-text-sub mb-8"
        >
          2단계 진단을 완료하면 최적의 맞춤 상담을 받을 수 있어요
        </motion.p>

        {/* 프로그레스 인디케이터 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          {[0, 1].map((i) => {
            const done = [progress.vehicle.done, progress.finance.done][i];
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                  done
                    ? 'bg-primary text-white'
                    : 'bg-surface-secondary border-2 border-border-solid text-text-muted'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                {i < 1 && (
                  <div className={`w-8 h-0.5 rounded-full transition-all duration-500 ${
                    done ? 'bg-primary' : 'bg-border-solid'
                  }`} />
                )}
              </div>
            );
          })}
          <span className="text-xs text-text-muted ml-2">{doneCount}/2</span>
        </motion.div>
      </section>

      {/* ━━━ 미션 스텝 카드 (대형) ━━━ */}
      <section className="px-5 pb-6 max-w-lg mx-auto w-full flex-1">
        <div className="flex flex-col gap-4">
          {STEPS.map((step, i) => {
            const stepProgress = progress[step.key];
            const isDone = stepProgress.done;
            const summary = 'summary' in stepProgress ? stepProgress.summary : undefined;

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.1, duration: 0.4, ease: 'easeOut' }}
              >
                <button
                  onClick={() => handleNav(isDone ? `${step.href}?restore=1` : step.href)}
                  className="w-full text-left rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
                  style={{
                    background: isDone ? step.activeGradient : '#FFFFFF',
                    boxShadow: isDone ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* 헤더 */}
                  <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                      isDone ? 'bg-white/20' : 'bg-surface-secondary'
                    }`}>
                      {isDone ? (
                        <span className="text-white font-bold text-sm">✓</span>
                      ) : (
                        <span className="text-text-muted font-bold text-sm">{step.num}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{step.emoji}</span>
                        <p className={`text-[17px] font-bold ${isDone ? 'text-white' : 'text-text'}`}>
                          {step.title}
                        </p>
                      </div>
                      <p className={`text-[13px] mt-0.5 ${isDone ? 'text-white/70' : 'text-text-sub'}`}>
                        {step.subtitle}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {isDone ? (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/20 text-white">
                          완료
                        </span>
                      ) : (
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                          i === 0 ? 'bg-violet-500/10 text-violet-600' : 'bg-primary/10 text-primary'
                        }`}>
                          {step.time}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 상세 설명 */}
                  {isDone && summary ? (
                    <div className="px-5 pb-5">
                      <div className="bg-white/10 rounded-xl px-4 py-3">
                        <p className="text-sm text-white/90 font-medium">결과: {summary}</p>
                        <p className="text-xs text-white/60 mt-1">다시 진단하려면 탭하세요</p>
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 pb-5">
                      <p className={`text-[13px] leading-relaxed mb-3 ${isDone ? 'text-white/70' : 'text-text-sub'}`}>
                        {step.desc}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {step.features.map((feat) => (
                          <div key={feat} className="flex items-center gap-2">
                            <span className={`text-[11px] ${isDone ? 'text-white/50' : 'text-primary'}`}>✓</span>
                            <span className={`text-[12px] ${isDone ? 'text-white/70' : 'text-text-sub'}`}>{feat}</span>
                          </div>
                        ))}
                      </div>
                      <div className={`mt-4 text-center py-2.5 rounded-xl font-semibold text-sm ${
                        isDone
                          ? 'bg-white/20 text-white'
                          : i === 0
                          ? 'bg-violet-500/10 text-violet-600'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {isDone ? '다시 진단하기' : '무료 진단 시작 →'}
                      </div>
                    </div>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* ━━━ 맞춤 상담 카드 ━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: 'easeOut' }}
          className="mt-4"
        >
          {allDone ? (
            <button
              onClick={handleQuoteNav}
              className="w-full rounded-2xl p-6 text-center text-white transition-all hover:shadow-lg active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #FBBF24)' }}
            >
              <span className="text-2xl block mb-2">🏆</span>
              <p className="text-lg font-bold mb-1">진단 완료! 맞춤 상담 준비됐어요</p>
              <p className="text-sm text-white/80 mb-3">
                진단 결과를 바탕으로 최적의 견적과 상담을 받으실 수 있습니다
              </p>
              <span className="inline-block px-5 py-2.5 rounded-xl bg-white text-amber-600 font-bold text-sm shadow-sm">
                맞춤 상담 신청 →
              </span>
            </button>
          ) : doneCount >= 1 ? (
            <div className="rounded-2xl overflow-hidden border border-border-solid">
              <button
                onClick={handleQuoteNav}
                className="w-full p-5 text-center text-white transition-all hover:shadow-lg active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #2563EB, #60A5FA)' }}
              >
                <p className="text-[15px] font-bold mb-1">지금 바로 상담 신청도 가능해요</p>
                <p className="text-xs text-white/80 mb-3">진단 결과가 자동으로 반영됩니다</p>
                <span className="inline-block px-4 py-2 rounded-xl bg-white text-primary font-bold text-sm">
                  상담 신청 →
                </span>
              </button>
              <div className="px-5 py-3 bg-surface text-center">
                <p className="text-[11px] text-text-sub">
                  💡 나머지 1단계를 완료하면 더 정확한 맞춤 상담이 가능해요
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-5 text-center bg-surface border border-border-solid">
              <span className="text-xl block mb-1.5">🔒</span>
              <p className="text-sm font-bold text-text-muted mb-1">맞춤 상담</p>
              <p className="text-xs text-text-muted">
                진단을 완료하면 최적의 맞춤 상담을 받을 수 있어요
              </p>
            </div>
          )}
        </motion.div>
      </section>

      {/* DEV: 임시 초기화 버튼 — 나중에 제거 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-5 pb-4 max-w-lg mx-auto w-full">
          <button
            onClick={() => {
              localStorage.removeItem('cadam-mission-progress');
              localStorage.removeItem('cadam-quote-store');
              setProgress(DEFAULT_PROGRESS);
            }}
            className="w-full py-2 text-xs text-text-muted border border-dashed border-border-solid rounded-xl hover:text-danger hover:border-danger transition-colors"
          >
            [DEV] 미션 진행률 초기화
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}
