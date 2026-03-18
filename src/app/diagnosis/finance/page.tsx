'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QuizModule } from '@/components/diagnosis/QuizModule';
import { ParkAI } from '@/components/diagnosis/ParkAI';
import { FINANCE_BASIC, FINANCE_DETAIL } from '@/data/diagnosis-finance';
import { DEFAULT_PRODUCTS, PRODUCT_KEYS, PRODUCT_LABELS } from '@/data/diagnosis-products';
import { calculateFinanceScores } from '@/lib/flow-engine';
import type { DiagnosisAnswer, ProductKey } from '@/types/diagnosis';
import { Button } from '@/components/ui/Button';

const COLOR = '#007AFF';

function ScoreRing({ pct, color }: { pct: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#F5F5F7" strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="bold" fill={color}>
        {pct}%
      </text>
    </svg>
  );
}

function FinResult({ answers, mode, restart, toDetail, onHome }: {
  answers: Record<string, DiagnosisAnswer>;
  mode: 'basic' | 'detail';
  restart: () => void;
  toDetail: () => void;
  onHome: () => void;
}) {
  const router = useRouter();
  const { totals, maxPossible } = calculateFinanceScores(answers);
  const best = PRODUCT_KEYS.reduce((a, b) => totals[a] >= totals[b] ? a : b) as ProductKey;
  const product = DEFAULT_PRODUCTS[best];
  const answerCount = Object.keys(answers).length;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => alert('링크가 복사되었습니다.'));
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-text-sub mb-1">금융상품 진단 결과</p>
          <h1 className="text-2xl font-bold text-text tracking-tight mb-4">
            고객님께는<br />
            <span style={{ color: product.color }}>{product.name}</span>를 추천합니다
          </h1>
        </motion.div>

        {/* ParkAI */}
        <ParkAI ctx={`금융진단결과: ${product.name} 추천. 응답수: ${answerCount}개. 모드: ${mode}`} />

        {/* 추천 상품 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-surface shadow-sm mb-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{product.emoji}</span>
            <div>
              <p className="font-bold text-text text-base">{product.name}</p>
              <p className="text-xs text-text-sub">{product.tagline}</p>
            </div>
          </div>
          <p className="text-sm text-text-sub mb-4 leading-relaxed">{product.description}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-success mb-1.5">장점</p>
              {product.pros.map((p) => (
                <p key={p} className="text-xs text-text-sub mb-1">✓ {p}</p>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-danger mb-1.5">유의사항</p>
              {product.cons.map((c) => (
                <p key={c} className="text-xs text-text-sub mb-1">· {c}</p>
              ))}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-text-muted">이런 분께 최적: {product.bestFor}</p>
          </div>
        </motion.div>

        {/* ScoreRing 비교 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-5 rounded-2xl bg-surface shadow-sm mb-4"
        >
          <p className="text-sm font-bold text-text mb-4">4개 상품 적합도 비교</p>
          <div className="grid grid-cols-4 gap-2">
            {PRODUCT_KEYS.map((key) => {
              const p = DEFAULT_PRODUCTS[key];
              const pct = maxPossible > 0 ? Math.round((totals[key] / maxPossible) * 100) : 0;
              return (
                <div key={key} className="flex flex-col items-center gap-1">
                  <ScoreRing pct={pct} color={p.color} />
                  <p className="text-xs font-semibold text-text-sub">{p.name}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-3 mb-4"
        >
          <Button variant="primary" size="lg" fullWidth className="shadow-lg shadow-primary/20 font-bold" onClick={() => router.push('/quote')}>
            견적 받기 →
          </Button>
          <Button variant="surface" fullWidth onClick={handleShare}>
            결과 공유하기
          </Button>
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
  return (
    <QuizModule
      basicQs={FINANCE_BASIC}
      detailQs={FINANCE_DETAIL}
      color={COLOR}
      onHome={() => router.push('/diagnosis')}
      renderResult={(props) => <FinResult {...props} />}
    />
  );
}
