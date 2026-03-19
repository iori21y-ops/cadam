'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { OPTION_QUESTIONS } from '@/data/diagnosis-option';
import { TRIMS, VEHICLES } from '@/data/diagnosis-vehicles';
import { DEFAULT_PRODUCTS, PRODUCT_KEYS } from '@/data/diagnosis-products';
import { scoreByTags } from '@/lib/flow-engine';
import type { OptionOption } from '@/types/diagnosis';
import { Button } from '@/components/ui/Button';
import { SelectCard } from '@/components/ui/SelectCard';

const COLOR = '#E04DBF';

function OptionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const carName = searchParams.get('car') ?? '';

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionOption>>({});
  const [selected, setSelected] = useState<OptionOption | null>(null);
  const [screen, setScreen] = useState<'quiz' | 'result'>('quiz');
  const [direction, setDirection] = useState(1);

  const handleSelect = (option: OptionOption) => {
    if (selected) return;
    setSelected(option);
    setTimeout(() => {
      const newAnswers = { ...answers, [OPTION_QUESTIONS[currentIdx].id]: option };
      setAnswers(newAnswers);
      if (currentIdx + 1 >= OPTION_QUESTIONS.length) {
        setScreen('result');
      } else {
        setDirection(1);
        setCurrentIdx((i) => i + 1);
        setSelected(null);
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentIdx === 0) { router.push('/diagnosis/vehicle'); return; }
    const prevId = OPTION_QUESTIONS[currentIdx - 1].id;
    const newAnswers = { ...answers };
    delete newAnswers[prevId];
    setDirection(-1);
    setCurrentIdx((i) => i - 1);
    setAnswers(newAnswers);
    setSelected(null);
  };

  if (screen === 'result') {
    const answerTags = Object.values(answers).flatMap((a) => a.tags);
    const trims = TRIMS[carName] ?? [];
    const scored = scoreByTags(trims, answerTags, 3);
    const best = scored[0];
    const vehicle = VEHICLES.find((v) => v.name === carName);

    const handleShare = () => {
      navigator.clipboard.writeText(window.location.href).then(() => alert('링크가 복사되었습니다.'));
    };

    return (
      <div className="min-h-screen bg-surface-secondary pb-16">
        <div className="px-5 pt-10 max-w-lg mx-auto">
          <div className="mb-5">
            <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: `${COLOR}18`, color: COLOR }}>
              옵션 추천 결과
            </span>
          </div>

          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
            <h1 className="text-2xl font-bold text-text tracking-tight mb-6">
              {carName}은<br />
              <span style={{ color: COLOR }}>{best?.name ?? '기본'} 트림</span>을 추천합니다
            </h1>
          </motion.div>

          {/* 추천 트림 카드 */}
          {best && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
              className="p-5 rounded-2xl bg-surface shadow-sm mb-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-text">{best.name}</p>
                <p className="text-sm font-bold text-text">{best.price.toLocaleString()}만원</p>
              </div>
              {best.add > 0 && (
                <p className="text-xs text-text-muted mb-3">기본 대비 +{best.add.toLocaleString()}만원</p>
              )}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {best.feats.map((f) => (
                  <span key={f} className="text-xs px-2 py-1 rounded-full bg-surface-secondary text-text-sub">{f}</span>
                ))}
              </div>
              {/* 상품별 월 비용 */}
              {vehicle && (
                <div className="grid grid-cols-4 gap-1.5">
                  {PRODUCT_KEYS.map((key) => (
                    <div key={key} className="text-center py-2 rounded-xl" style={{ backgroundColor: DEFAULT_PRODUCTS[key].lightBg }}>
                      <p className="text-[10px] text-text-muted">{DEFAULT_PRODUCTS[key].name}</p>
                      <p className="text-xs font-bold" style={{ color: DEFAULT_PRODUCTS[key].color }}>
                        {key === 'cash' ? '일시불' : `${vehicle.monthly[key]}만`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* 전체 트림 비교 */}
          {trims.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.35, ease: 'easeOut' }}
              className="p-5 rounded-2xl bg-surface shadow-sm mb-4"
            >
              <p className="text-sm font-bold text-text mb-3">전체 트림 비교</p>
              <div className="flex flex-col gap-2">
                {trims.map((t) => (
                  <div key={t.name} className={`flex items-center justify-between p-3 rounded-xl ${t.name === best?.name ? 'border-2' : 'bg-surface-secondary'}`}
                    style={t.name === best?.name ? { borderColor: COLOR } : {}}>
                    <div>
                      <p className="text-sm font-semibold text-text">{t.name}</p>
                      <p className="text-xs text-text-muted">{t.feats.slice(0, 2).join(', ')}</p>
                    </div>
                    <p className="text-sm font-bold text-text">{t.price.toLocaleString()}만원</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 공유 + 버튼 */}
          <div className="flex flex-col gap-3">
            <Button variant="surface" fullWidth onClick={handleShare}>결과 공유하기</Button>
            <Button variant="surface" fullWidth onClick={() => router.push('/diagnosis')}>진단 홈으로</Button>
          </div>
        </div>
      </div>
    );
  }

  const q = OPTION_QUESTIONS[currentIdx];
  const progressPct = Math.round((currentIdx / OPTION_QUESTIONS.length) * 100);

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-2 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-2">
          <button onClick={handleBack} className="text-sm text-text-sub hover:text-text transition-colors">← 이전</button>
          <span className="text-xs text-text-muted">Q{currentIdx + 1} / {OPTION_QUESTIONS.length}</span>
        </div>
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ backgroundColor: COLOR }}
            animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3 }} />
        </div>
        {carName && <p className="text-xs text-text-muted mt-2">{carName} 옵션 진단</p>}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.25 }}
          className="px-5 pt-8 pb-6 max-w-lg mx-auto"
        >
          <h2 className="font-bold text-text text-center leading-tight mb-2 whitespace-pre-line"
            style={{ fontSize: 'clamp(26px, 5vw, 34px)' }}>
            {q.question}
          </h2>
          {q.subtitle && <p className="text-[15px] text-text-sub text-center mb-9">{q.subtitle}</p>}
          <div className="flex flex-col gap-2.5">
            {q.options.map((option, i) => {
              const isSelected = selected?.value === option.value;
              return (
                <SelectCard
                  key={option.value}
                  selected={isSelected}
                  dimmed={!!selected && !isSelected}
                  color={COLOR}
                  disabled={!!selected}
                  onClick={() => handleSelect(option)}
                  style={{ transition: `all 0.25s ease ${i * 0.04}s` }}
                >
                  <span className="flex-1 text-[16px] font-medium" style={{ color: isSelected ? '#FFF' : '#1D1D1F' }}>
                    {option.label}
                  </span>
                </SelectCard>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function OptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OptionPageInner />
    </Suspense>
  );
}
