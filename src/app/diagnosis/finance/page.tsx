'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QuizModule } from '@/components/diagnosis/QuizModule';
import { ParkAI } from '@/components/diagnosis/ParkAI';
import { FINANCE_BASIC, FINANCE_DETAIL } from '@/data/diagnosis-finance';
import { RENT_FIT_TIERS } from '@/data/diagnosis-products';
import { calculateRentFit, getRentKeyFactors } from '@/lib/flow-engine';
import type { DiagnosisAnswer, FinanceQuestion } from '@/types/diagnosis';
import { BRAND } from '@/constants/brand';
import { FeedbackWidget } from '@/components/diagnosis/FeedbackWidget';
import { NextMission } from '@/components/diagnosis/NextMission';
import { buildShareUrl, copyShareUrl, shareToKakao, nativeShare } from '@/lib/diagnosis-share';
import { Button } from '@/components/ui/Button';
import { saveMissionStep, loadProgress } from '@/lib/mission-progress';
import { useQuoteStore } from '@/store/quoteStore';

const COLOR = '#10B981';


function ScoreRing({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
  const r = size * 0.39;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const fontSize = size * 0.18;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F5F5F7" strokeWidth={size * 0.083} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={size * 0.083}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + fontSize * 0.35} textAnchor="middle" fontSize={fontSize} fontWeight="bold" fill={color}>
        {pct}%
      </text>
    </svg>
  );
}

function FinResult({ answers, questions, mode, restart, toDetail, onHome }: {
  answers: Record<string, DiagnosisAnswer>;
  questions: FinanceQuestion[];
  mode: 'basic' | 'detail';
  restart: () => void;
  toDetail: () => void;
  onHome: () => void;
}) {
  const router = useRouter();
  const allQs = mode === 'detail' ? [...FINANCE_BASIC, ...FINANCE_DETAIL] : FINANCE_BASIC;
  const result = calculateRentFit(answers, allQs);
  const { score, tier, reasons, savingPoints } = result;
  const tierData = RENT_FIT_TIERS[tier];
  const keyFactors = getRentKeyFactors(answers, allQs);
  const answerCount = Object.keys(answers).length;

  // 미션 완료 저장
  useEffect(() => {
    const serialized: Record<string, { value: string; label: string }> = {};
    for (const [k, v] of Object.entries(answers)) {
      serialized[k] = { value: v.value, label: v.label };
    }
    saveMissionStep('finance', `장기렌트 ${score}%`, serialized, mode);
  }, [answers, score, mode]);

  // AI에 보낼 상세 컨텍스트
  const aiContext = [
    `장기렌트 적합도: ${score}% (${tier}).`,
    ` 응답수: ${answerCount}개. 모드: ${mode}.`,
    savingPoints.length > 0 ? ` 절약포인트: ${savingPoints.slice(0, 2).join(', ')}.` : '',
    reasons.length > 0 ? ` 불리한점: ${reasons.slice(0, 2).join(', ')}.` : '',
    answers['business'] ? ` 사업자: ${answers['business'].label}.` : '',
    answers['budget'] ? ` 초기자금: ${answers['budget'].label}.` : '',
    answers['ownership'] ? ` 소유의향: ${answers['ownership'].label}.` : '',
  ].join('');

  const [copied, setCopied] = useState(false);
  const shareUrl = buildShareUrl('/diagnosis/finance', mode, answers);
  const prefillFromDiagnosis = useQuoteStore((s) => s.prefillFromDiagnosis);

  const vehicleProgress = loadProgress().vehicle;
  const vehicleSummary = vehicleProgress.done ? vehicleProgress.summary : null;

  const handleQuoteNav = () => {
    prefillFromDiagnosis();
    router.push('/quote');
  };

  const handleCopy = async () => {
    const ok = await copyShareUrl(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shared = await nativeShare({
      title: `${BRAND.sharePrefix} 장기렌트 적합도: ${score}%`,
      text: `나의 장기렌트 적합도는 ${score}%! 당신도 진단해보세요.`,
      url: shareUrl,
    });
    if (!shared) handleCopy();
  };

  const handleKakaoShare = () => {
    shareToKakao({
      title: `${BRAND.sharePrefix} 장기렌트 적합도: ${score}%`,
      description: `나의 장기렌트 적합도는 ${score}%! ${tierData.title}`,
      url: shareUrl,
    });
  };

  const tierColor = tier === 'high' ? '#10B981' : tier === 'mid' ? '#F59E0B' : '#8E8E93';

  return (
    <div className="min-h-screen bg-surface-secondary pb-16">
      <div className="px-5 pt-10 max-w-lg mx-auto">
        {/* 모드 배지 + 공유 */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs px-3 py-1 rounded-full bg-[rgba(16,185,129,0.08)] text-[#10B981] font-semibold">
            {mode === 'basic' ? '간편 진단' : '상세 진단'} · {answerCount}개 응답
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={handleKakaoShare}
              className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-sm border border-border-solid hover:border-primary transition-colors"
              title="카카오톡 공유"
            >
              💬
            </button>
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-sm border border-border-solid hover:border-primary transition-colors"
              title="링크 복사"
            >
              {copied ? '✓' : '🔗'}
            </button>
          </div>
        </div>

        {/* 헤드라인 */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <p className="text-sm text-text-sub mb-1">장기렌트 적합도 진단 결과</p>
          <h1 className="text-2xl font-bold text-text tracking-tight mb-4">
            {tierData.emoji} {tierData.title}
          </h1>
        </motion.div>

        {/* ParkAI */}
        <ParkAI ctx={aiContext} mode="report" />

        {/* ━━━ 적합도 스코어 카드 ━━━ */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
          className="rounded-2xl bg-surface shadow-sm mb-4 overflow-hidden"
        >
          <div className="px-5 py-6">
            {/* 스코어 링 (크게) */}
            <div className="flex flex-col items-center mb-5">
              <ScoreRing pct={score} color={tierColor} size={120} />
              <p className="text-sm font-semibold mt-3" style={{ color: tierColor }}>
                장기렌트 적합도
              </p>
            </div>

            {/* tier 메시지 */}
            <p className="text-[13px] text-text-sub leading-relaxed text-center mb-5">
              {tierData.message}
            </p>

            {/* 절약 포인트 */}
            {savingPoints.length > 0 && (
              <div className="mb-4">
                <p className="text-[12px] font-semibold text-success mb-2">✨ 절약 포인트</p>
                <div className="flex flex-col gap-1.5">
                  {savingPoints.map((point, i) => (
                    <p key={i} className="text-[12px] text-text-sub pl-1">
                      <span className="text-success mr-1.5">✓</span>{point}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* 불리한 점 */}
            {reasons.length > 0 && (
              <div className="mb-4">
                <p className="text-[12px] font-semibold text-danger mb-2">⚠️ 참고사항</p>
                <div className="flex flex-col gap-1.5">
                  {reasons.map((reason, i) => (
                    <p key={i} className="text-[12px] text-text-sub pl-1">
                      <span className="text-danger mr-1.5">·</span>{reason}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* 핵심 판단 근거 */}
            {keyFactors.length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-[11px] font-semibold text-text-sub mb-2">핵심 판단 근거</p>
                <div className="flex flex-wrap gap-1.5">
                  {keyFactors.map((f, fi) => (
                    <span key={fi} className="text-[11px] font-semibold px-2 py-1 rounded-lg text-white"
                      style={{ backgroundColor: f.impact === '매우 유리' ? '#10B981' : '#2563EB' }}>
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* tier 설명 */}
            <div className="pt-3">
              <p className="text-[11px] text-text-muted">{tierData.description}</p>
            </div>
          </div>
        </motion.div>

        {/* 다음 미션 유도 */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.35, ease: 'easeOut' }}
          className="mb-4"
        >
          <NextMission current="finance" />
        </motion.div>

        {/* 피드백 */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.55, duration: 0.35, ease: 'easeOut' }}
          className="mb-4"
        >
          <FeedbackWidget
            type="finance"
            mode={mode}
            result={{ best: 'rent', pct: score, ranking: [{ key: 'rent' as const, pct: score }] }}
            answers={answers as Record<string, { value: string; label: string }>}
          />
        </motion.div>

        {/* 하단 버튼 */}
        <div className="flex gap-2">
          <Button variant="surface" className="flex-1" onClick={restart}>다시 진단</Button>
          {mode === 'basic' && (
            <Button variant="surface" className="flex-1 text-primary font-semibold" onClick={toDetail}>상세 테스트 →</Button>
          )}
          <Button variant="surface" className="flex-1" onClick={onHome}>홈으로</Button>
        </div>
      </div>

      {/* 하단 고정 CTA 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-border-solid shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-text">{tierData.emoji} 장기렌트 {score}%</span>
              {vehicleSummary && <span className="text-xs text-text-sub">· 🚗 {vehicleSummary}</span>}
            </div>
            <p className="text-[10px] text-text-muted mt-0.5">진단 결과가 자동 반영됩니다</p>
          </div>
          <button
            onClick={handleQuoteNav}
            className="shrink-0 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 active:scale-[0.97] transition-all"
            style={{ backgroundColor: tierColor }}
          >
            {tierData.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const router = useRouter();
  const [saved, setSaved] = useState<{ answers: Record<string, { value: string; label: string }>; mode: 'basic' | 'detail' } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('restore') === '1') {
      const progress = loadProgress();
      if (progress.finance.done && progress.finance.answers) {
        setSaved({ answers: progress.finance.answers, mode: progress.finance.mode ?? 'basic' });
      }
    }
    setChecked(true);
  }, []);

  if (!checked) return null;

  return (
    <QuizModule
      basicQs={FINANCE_BASIC}
      detailQs={FINANCE_DETAIL}
      color={COLOR}
      onHome={() => router.push('/')}
      savedResult={saved}
      renderResult={(props) => (
        <FinResult
          {...props}
          questions={props.mode === 'detail' ? [...FINANCE_BASIC, ...FINANCE_DETAIL] : FINANCE_BASIC}
        />
      )}
    />
  );
}
