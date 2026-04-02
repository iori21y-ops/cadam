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
import { BRAND } from '@/constants/brand';
import { FeedbackWidget } from '@/components/diagnosis/FeedbackWidget';
import { NextMission } from '@/components/diagnosis/NextMission';
import { buildShareUrl, copyShareUrl, shareToKakao, nativeShare } from '@/lib/diagnosis-share';
import { Button } from '@/components/ui/Button';
import { saveMissionStep, loadProgress } from '@/lib/mission-progress';

const COLOR = '#2563EB';


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
  const [expanded, setExpanded] = useState(false);
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

        {/* ━━━ 추천 순위 (1순위 상세 + 접기/펼치기) ━━━ */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
          className="rounded-2xl bg-surface shadow-sm mb-4 overflow-hidden"
        >
          {ranking.map((item, i) => {
            const product = DEFAULT_PRODUCTS[item.key];
            const isBest = i === 0;
            // 1순위는 항상 표시, 나머지는 expanded일 때만
            if (!isBest && !expanded) return null;

            return (
              <div
                key={item.key}
                className={`px-5 py-5 ${isBest ? '' : 'border-t border-border'}`}
              >
                {/* 헤더: 순위 + 링 + 이름 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex flex-col items-center gap-1">
                    <RankBadge rank={i} />
                    <ScoreRing pct={item.pct} color={product.color} size={56} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xl">{product.emoji}</span>
                      <p className="font-bold text-text text-[17px]">{product.name}</p>
                    </div>
                    <p className="text-xs text-text-sub">{product.tagline}</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: product.color }}>
                    {item.pct}%
                  </span>
                </div>

                {/* 설명 */}
                <p className="text-[13px] text-text-sub leading-relaxed mb-3">{product.description}</p>

                {/* 추천 이유 */}
                {item.reasons.length > 0 && (
                  <div className="flex flex-col gap-1 mb-3">
                    {item.reasons.map((reason, ri) => (
                      <p key={ri} className="text-xs text-text-sub">
                        <span className="text-success mr-1">✓</span>{reason}
                      </p>
                    ))}
                  </div>
                )}

                {/* 장점 / 유의사항 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-[11px] font-semibold text-success mb-1">장점</p>
                    {product.pros.map((p) => (
                      <p key={p} className="text-[11px] text-text-sub mb-0.5">✓ {p}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-danger mb-1">유의사항</p>
                    {product.cons.map((c) => (
                      <p key={c} className="text-[11px] text-text-sub mb-0.5">· {c}</p>
                    ))}
                  </div>
                </div>

                {/* 핵심 근거 (1순위만) */}
                {isBest && keyFactors.length > 0 && (
                  <div className="pt-3 border-t border-border">
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

                <div className="pt-2">
                  <p className="text-[11px] text-text-muted">이런 분께 최적: {product.bestFor}</p>
                </div>
              </div>
            );
          })}

          {/* 접기/펼치기 버튼 */}
          {ranking.length > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-3 border-t border-border text-xs font-semibold text-primary hover:bg-primary/[0.03] transition-colors"
            >
              {expanded ? `접기 ▲` : `2·3순위 보기 ▼`}
            </button>
          )}
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
