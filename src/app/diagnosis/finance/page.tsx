'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QuizModule } from '@/components/diagnosis/QuizModule';
import { ParkAI } from '@/components/diagnosis/ParkAI';
import { FINANCE_BASIC, FINANCE_DETAIL } from '@/data/diagnosis-finance';
import { DEFAULT_PRODUCTS, PRODUCT_KEYS } from '@/data/diagnosis-products';
import { rankFinanceProducts, getKeyFactors } from '@/lib/flow-engine';
import type { DiagnosisAnswer, FinanceQuestion, ProductKey } from '@/types/diagnosis';
import { SimulationCalculator } from '@/components/diagnosis/SimulationCalculator';
import { BRAND } from '@/constants/brand';
import { FeedbackWidget } from '@/components/diagnosis/FeedbackWidget';
import { NextMission } from '@/components/diagnosis/NextMission';
import { buildShareUrl, copyShareUrl, shareToKakao, nativeShare } from '@/lib/diagnosis-share';
import { Button } from '@/components/ui/Button';
import { saveMissionStep, loadProgress } from '@/lib/mission-progress';

const COLOR = '#2563EB';

// 가격대 답변 → 대표 차량가격(만원)
const PRICE_MAP: Record<string, number> = {
  low: 2500,
  mid: 4500,
  high: 7500,
  premium: 12000,
};

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

function RankBadge({ rank }: { rank: number }) {
  const badges = ['1st', '2nd', '3rd'];
  const colors = ['#EF4444', '#F59E0B', '#8E8E93'];
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
      style={{ backgroundColor: colors[rank] ?? '#8E8E93' }}
    >
      {badges[rank] ?? ''}
    </span>
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
  const ranking = rankFinanceProducts(answers, allQs);
  const best = ranking[0];
  const bestProduct = DEFAULT_PRODUCTS[best.key];
  const keyFactors = getKeyFactors(answers, allQs, best.key);
  const answerCount = Object.keys(answers).length;

  // 미션 완료 저장 (답변 포함 — 결과 복원용)
  useEffect(() => {
    const serialized: Record<string, { value: string; label: string }> = {};
    for (const [k, v] of Object.entries(answers)) {
      serialized[k] = { value: v.value, label: v.label };
    }
    saveMissionStep('finance', `${bestProduct.name} ${best.pct}%`, serialized, mode);
  }, [answers, bestProduct.name, best.pct, mode]);

  // AI에 보낼 상세 컨텍스트
  const aiContext = [
    `금융진단결과: 1순위 ${DEFAULT_PRODUCTS[best.key].name}(${best.pct}%)`,
    ranking[1] ? `, 2순위 ${DEFAULT_PRODUCTS[ranking[1].key].name}(${ranking[1].pct}%)` : '',
    ranking[2] ? `, 3순위 ${DEFAULT_PRODUCTS[ranking[2].key].name}(${ranking[2].pct}%)` : '',
    `. 응답수: ${answerCount}개. 모드: ${mode}.`,
    ` 핵심근거: ${best.reasons.slice(0, 2).join(', ')}.`,
    answers['business'] ? ` 사업자: ${answers['business'].label}.` : '',
    answers['budget'] ? ` 초기자금: ${answers['budget'].label}.` : '',
    answers['ownership'] ? ` 소유의향: ${answers['ownership'].label}.` : '',
  ].join('');

  const [copied, setCopied] = useState(false);
  const shareUrl = buildShareUrl('/diagnosis/finance', mode, answers);

  const handleCopy = async () => {
    const ok = await copyShareUrl(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shared = await nativeShare({
      title: `${BRAND.sharePrefix} 금융진단 결과: ${bestProduct.name} 추천`,
      text: `나에게 맞는 금융상품은 ${bestProduct.name}! (적합도 ${best.pct}%) 당신도 진단해보세요.`,
      url: shareUrl,
    });
    if (!shared) handleCopy();
  };

  const handleKakaoShare = () => {
    shareToKakao({
      title: `${BRAND.sharePrefix} 금융진단 결과: ${bestProduct.name} 추천`,
      description: `나에게 맞는 금융상품은 ${bestProduct.name}! (적합도 ${best.pct}%)`,
      url: shareUrl,
    });
  };

  return (
    <div className="min-h-screen bg-surface-secondary pb-16">
      <div className="px-5 pt-10 max-w-lg mx-auto">
        {/* 모드 배지 */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs px-3 py-1 rounded-full bg-finance/8 text-finance font-semibold">
            {mode === 'basic' ? '간편 진단' : '상세 진단'} · {answerCount}개 응답
          </span>
        </div>

        {/* 헤드라인 */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <p className="text-sm text-text-sub mb-1">금융상품 진단 결과</p>
          <h1 className="text-2xl font-bold text-text tracking-tight mb-4">
            고객님께는<br />
            <span style={{ color: bestProduct.color }}>{bestProduct.name}</span>을(를) 추천합니다
          </h1>
        </motion.div>

        {/* ParkAI */}
        <ParkAI ctx={aiContext} mode="report" />

        {/* ━━━ TOP 3 추천 상품 카드 ━━━ */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
          className="rounded-2xl bg-surface shadow-sm mb-4 overflow-hidden"
        >
          <div className="p-5 pb-3">
            <p className="text-sm font-bold text-text mb-4">추천 순위</p>
          </div>

          {ranking.map((item, i) => {
            const product = DEFAULT_PRODUCTS[item.key];
            const isBest = i === 0;
            return (
              <div
                key={item.key}
                className={`px-5 py-4 ${isBest ? 'bg-primary/[0.04]' : ''} ${i < ranking.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {/* 순위 + 링 */}
                  <div className="flex flex-col items-center gap-1">
                    <RankBadge rank={i} />
                    <ScoreRing pct={item.pct} color={product.color} size={56} />
                  </div>

                  {/* 상품 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{product.emoji}</span>
                      <p className="font-bold text-text text-[15px]">{product.name}</p>
                      <span className="text-xs text-text-muted">적합도 {item.pct}%</span>
                    </div>
                    <p className="text-xs text-text-sub mb-1.5">{product.tagline}</p>

                    {/* 추천 이유 */}
                    {item.reasons.length > 0 && (
                      <div className="flex flex-col gap-0.5">
                        {item.reasons.slice(0, 2).map((reason, ri) => (
                          <p key={ri} className="text-[11px] text-text-muted leading-tight">
                            <span className="text-success mr-1">✓</span>{reason}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* ━━━ 1순위 상세 카드 ━━━ */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: 'easeOut' }}
          className="p-5 rounded-2xl bg-surface shadow-sm mb-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{bestProduct.emoji}</span>
            <div>
              <p className="font-bold text-text text-base">{bestProduct.name}</p>
              <p className="text-xs text-text-sub">{bestProduct.tagline}</p>
            </div>
          </div>
          <p className="text-sm text-text-sub mb-4 leading-relaxed">{bestProduct.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-success mb-1.5">장점</p>
              {bestProduct.pros.map((p) => (
                <p key={p} className="text-xs text-text-sub mb-1">✓ {p}</p>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-danger mb-1.5">유의사항</p>
              {bestProduct.cons.map((c) => (
                <p key={c} className="text-xs text-text-sub mb-1">· {c}</p>
              ))}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-text-muted">이런 분께 최적: {bestProduct.bestFor}</p>
          </div>
        </motion.div>

        {/* ━━━ 핵심 판단 근거 ━━━ */}
        {keyFactors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.35, ease: 'easeOut' }}
            className="p-5 rounded-2xl bg-surface shadow-sm mb-4"
          >
            <p className="text-sm font-bold text-text mb-3">
              {bestProduct.name}을(를) 추천한 핵심 근거
            </p>
            <div className="flex flex-col gap-2">
              {keyFactors.map((f, i) => (
                <div key={i} className="flex items-center gap-2 py-2 px-3 rounded-xl bg-surface-secondary">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md text-white"
                    style={{ backgroundColor: f.impact === '매우 유리' ? '#10B981' : '#2563EB' }}>
                    {f.impact}
                  </span>
                  <span className="text-sm text-text">{f.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ━━━ 1순위 vs 2순위 비교 ━━━ */}
        {ranking.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.35, ease: 'easeOut' }}
            className="p-5 rounded-2xl bg-surface shadow-sm mb-4"
          >
            <p className="text-sm font-bold text-text mb-3">
              {DEFAULT_PRODUCTS[ranking[0].key].name} vs {DEFAULT_PRODUCTS[ranking[1].key].name}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ranking.slice(0, 2).map((item, i) => {
                const product = DEFAULT_PRODUCTS[item.key];
                return (
                  <div key={item.key} className="p-3 rounded-xl" style={{ backgroundColor: product.lightBg }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-base">{product.emoji}</span>
                      <p className="text-xs font-bold" style={{ color: product.color }}>{product.name}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {product.pros.slice(0, 3).map((p) => (
                        <p key={p} className="text-[11px] text-text-sub">✓ {p}</p>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-black/5">
                      <p className="text-[11px] text-text-muted">{product.bestFor}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ━━━ 월 납입금 시뮬레이션 ━━━ */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.35, ease: 'easeOut' }}
          className="mb-4"
        >
          <SimulationCalculator
            carPrice={PRICE_MAP[answers['price_range']?.value ?? ''] ?? 3500}
            carName={answers['price_range'] ? `${answers['price_range'].label} 차량` : '3,500만원 차량'}
            recommendedProduct={best.key}
          />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col gap-3 mb-4"
        >
          <Button variant="primary" size="lg" fullWidth className="shadow-lg shadow-primary/20 font-bold" onClick={() => router.push('/quote')}>
            견적 받기 →
          </Button>
          <div className="flex gap-2">
            <Button variant="surface" className="flex-1" onClick={handleKakaoShare}>
              카카오톡 공유
            </Button>
            <Button variant="surface" className="flex-1" onClick={handleShare}>
              {copied ? '복사됨!' : '링크 공유'}
            </Button>
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
            result={{ best: best.key, pct: best.pct, ranking: ranking.map((r) => ({ key: r.key, pct: r.pct })) }}
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
