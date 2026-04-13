'use client';

import { useEffect, useLayoutEffect, useRef, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { DiagnosisQuestion, DiagnosisAnswer } from '@/types/diagnosis';
import { shouldSkip, findNextIndex } from '@/lib/flow-engine';
import { SelectCard } from '@/components/ui/SelectCard';
import { Button } from '@/components/ui/Button';

interface SavedResult {
  answers: Record<string, { value: string; label: string }>;
  mode: 'basic' | 'detail';
}

interface QuizModuleProps {
  basicQs: DiagnosisQuestion[];
  detailQs: DiagnosisQuestion[];
  color: string;
  onHome: () => void;
  /** 저장된 결과가 있으면 바로 result 화면으로 시작 */
  savedResult?: SavedResult | null;
  renderResult: (props: {
    answers: Record<string, DiagnosisAnswer>;
    questions: DiagnosisQuestion[];
    mode: 'basic' | 'detail';
    restart: () => void;
    toDetail: () => void;
    onHome: () => void;
  }) => ReactNode;
}

type Screen = 'mode' | 'quiz' | 'result';

/**
 * 저장된 {value, label} 답변을 원래 DiagnosisAnswer로 복원
 */
function restoreAnswers(
  saved: Record<string, { value: string; label: string }>,
  questions: DiagnosisQuestion[]
): Record<string, DiagnosisAnswer> {
  const restored: Record<string, DiagnosisAnswer> = {};
  for (const [qId, { value }] of Object.entries(saved)) {
    const q = questions.find((qq) => qq.id === qId);
    if (q) {
      const opt = q.options.find((o) => o.value === value);
      if (opt) restored[qId] = opt;
    }
  }
  return restored;
}

export function QuizModule({ basicQs, detailQs, color, onHome, savedResult, renderResult }: QuizModuleProps) {
  const hasRestoredRef = useRef(false);
  const initialScreen: Screen = savedResult ? 'result' : 'mode';
  const initialMode: 'basic' | 'detail' = savedResult?.mode ?? 'basic';

  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [mode, setMode] = useState<'basic' | 'detail'>(initialMode);
  // savedResult가 있으면 questions/answers 초기화
  const initialQs = savedResult
    ? (savedResult.mode === 'detail' ? [...basicQs, ...detailQs] : basicQs)
    : [];
  const initialAnswers = savedResult
    ? restoreAnswers(savedResult.answers, savedResult.mode === 'detail' ? [...basicQs, ...detailQs] : basicQs)
    : {};

  const [questions, setQuestions] = useState<DiagnosisQuestion[]>(initialQs);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, DiagnosisAnswer>>(initialAnswers);
  const [history, setHistory] = useState<number[]>([]);
  const [selected, setSelected] = useState<DiagnosisAnswer | null>(null);
  const [selectedMode, setSelectedMode] = useState<'basic' | 'detail' | null>(null);
  const [anim, setAnim] = useState(false);

  const prevIdxRef = useRef(currentIdx);
  const [quizDir, setQuizDir] = useState<1 | -1>(1);

  useLayoutEffect(() => {
    if (screen !== 'quiz') {
      prevIdxRef.current = currentIdx;
      return;
    }

    if (prevIdxRef.current === currentIdx) return;
    setQuizDir(currentIdx > prevIdxRef.current ? 1 : -1);
    prevIdxRef.current = currentIdx;
  }, [currentIdx, screen]);

  const startQuiz = (m: 'basic' | 'detail', existingAnswers?: Record<string, DiagnosisAnswer>, startIdx?: number) => {
    const qs = m === 'detail' ? [...basicQs, ...detailQs] : basicQs;
    let si = startIdx ?? 0;
    // skip questions that should be skipped given existing answers
    while (si < qs.length && shouldSkip(qs[si], existingAnswers ?? {})) si++;
    setMode(m);
    setQuestions(qs);
    setCurrentIdx(si);
    setAnswers(existingAnswers ?? {});
    setHistory(startIdx !== undefined ? Array.from({ length: si }, (_, i) => i).filter(i => (existingAnswers ?? {})[qs[i]?.id] !== undefined) : []);
    setSelected(null);
    setScreen('quiz');
  };

  const pickMode = (m: 'basic' | 'detail') => {
    setSelectedMode(m);
    setTimeout(() => {
      setAnim(true);
      setTimeout(() => {
        startQuiz(m);
        setAnim(false);
        setSelectedMode(null);
      }, 350);
    }, 300);
  };

  const handleSelect = (option: DiagnosisAnswer) => {
    if (selected) return;
    setSelected(option);

    setTimeout(() => {
      const newAnswers = { ...answers, [questions[currentIdx].id]: option };
      setAnswers(newAnswers);

      const nextIdx = findNextIndex(questions, currentIdx, option as { nextQ?: string }, newAnswers);
      if (nextIdx === -1) {
        setScreen('result');
      } else {
        setHistory((h) => [...h, currentIdx]);
        setCurrentIdx(nextIdx);
        setSelected(null);
      }
    }, 300);
  };

  const handleNext = () => {
    // 건너뛰기: 선택 없이 다음 질문으로 이동
    const nextIdx = findNextIndex(questions, currentIdx, {}, answers);
    if (nextIdx === -1) {
      setScreen('result');
    } else {
      setHistory((h) => [...h, currentIdx]);
      setCurrentIdx(nextIdx);
      setSelected(null);
    }
  };

  const handleBack = () => {
    if (history.length === 0) {
      setScreen('mode');
      return;
    }
    const prev = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    const prevId = questions[prev].id;
    const newAnswers = { ...answers };
    delete newAnswers[prevId];
    setHistory(newHistory);
    setCurrentIdx(prev);
    setAnswers(newAnswers);
    setSelected(null);
  };

  const restart = () => {
    setScreen('mode');
    setAnswers({});
    setHistory([]);
    setSelected(null);
    setSelectedMode(null);
  };

  // ─── 브라우저 뒤로가기 방지: quiz 화면에서 popstate → handleBack ───
  const handleBackRef = useRef(handleBack);
  handleBackRef.current = handleBack;
  const screenRef = useRef(screen);
  screenRef.current = screen;

  useEffect(() => {
    if (screen !== 'quiz') return;

    // 히스토리 항목 추가 (트랩)
    window.history.pushState({ rentailorQuiz: true }, '', window.location.pathname + window.location.search);

    const onPopState = (e: PopStateEvent) => {
      if (screenRef.current !== 'quiz') return;
      // 뒤로가기 취소 → 다시 pushState로 현재 유지
      window.history.pushState({ rentailorQuiz: true }, '', window.location.pathname + window.location.search);
      handleBackRef.current();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [screen]);

  // Continue detail test from where basic left off
  const toDetail = () => {
    const allQ = [...basicQs, ...detailQs];
    let startIdx = basicQs.length;
    while (startIdx < allQ.length && shouldSkip(allQ[startIdx], answers)) startIdx++;
    setMode('detail');
    setQuestions(allQ);
    setHistory((h) => [...h, currentIdx]);
    setCurrentIdx(startIdx);
    setScreen('quiz');
  };

  if (screen === 'mode') {
    const items = [
      { m: 'basic' as const, title: '간편 테스트', desc: '핵심 질문만으로 빠르게', time: '약 1분', count: basicQs.length },
      { m: 'detail' as const, title: '상세 테스트', desc: '정밀 분석으로 확실하게', time: '약 3분', count: basicQs.length + detailQs.length },
    ];
    return (
      <div
        className="px-5 max-w-[460px] mx-auto"
        style={{
          paddingTop: 'clamp(40px, 8vh, 80px)',
          opacity: anim ? 0 : 1,
          transform: anim ? 'translateX(-40px)' : 'translateX(0)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
        }}
      >
        <h2 className="text-center font-bold text-text leading-tight mb-2"
          style={{ fontSize: 'clamp(26px, 5vw, 34px)' }}>
          진단 방식을<br />선택해주세요.
        </h2>
        <p className="text-[15px] text-text-sub text-center mb-10">목적에 맞는 진단을 선택하세요</p>

        <div className="flex flex-col gap-3.5">
          {items.map(({ m, title, desc, time, count }) => {
            const isSel = selectedMode === m;
            const isDimmed = selectedMode !== null && !isSel;
            return (
              <SelectCard
                key={m}
                selected={isSel}
                dimmed={isDimmed}
                disabled={!!selectedMode}
                color={color}
                onClick={() => !selectedMode && pickMode(m)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-3.5">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-lg ${
                      isSel ? 'bg-white/20 text-white/80' : 'bg-surface-secondary text-text-sub'
                    }`}>
                      {time}
                    </span>
                    <span className={`text-[13px] ${isSel ? 'text-white/60' : 'text-text-muted'}`}>
                      {count}개
                    </span>
                  </div>
                  <p className={`text-[22px] font-bold mb-1.5 ${isSel ? 'text-white' : 'text-text'}`}>
                    {title}
                  </p>
                  <p className={`text-sm ${isSel ? 'text-white/70' : 'text-text-sub'}`}>
                    {desc}
                  </p>
                </div>
              </SelectCard>
            );
          })}
        </div>

      </div>
    );
  }

  if (screen === 'result') {
    return (
      <div>
        {renderResult({ answers, questions, mode, restart, toDetail, onHome })}
      </div>
    );
  }

  const q = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="flex flex-col h-[calc(100dvh-49px)] overflow-hidden bg-surface-secondary">
      {/* 프로그레스 바 */}
      <div className="px-5 pt-4 pb-2 max-w-[500px] mx-auto w-full">
        <div className="flex justify-between mb-2" style={{ fontFamily: 'inherit', fontSize: 12, color: '#AEAEB2' }}>
          <span>Q{answeredCount + 1}</span>
          <span>{answeredCount}/~{questions.length}</span>
        </div>
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: '#E5E5EA' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${progressPct}%`, background: color, transition: 'width 0.5s ease' }}
          />
        </div>
      </div>

      {/* 질문 (nextIdx 변경 시 슬라이드) */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIdx}
            className="px-5 pt-8 pb-6 max-w-[500px] mx-auto"
            initial={{ opacity: 0, x: quizDir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -quizDir * 40 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <h2
              className="font-bold text-text text-center leading-tight mb-2 whitespace-pre-line"
              style={{ fontSize: 'clamp(26px, 5vw, 34px)' }}
            >
              {q.question}
            </h2>
            {q.subtitle && <p className="text-[15px] text-text-sub text-center mb-9">{q.subtitle}</p>}

            <div className="flex flex-col gap-2.5">
              {q.options.map((option) => {
                const isSel = selected?.value === option.value;
                return (
                  <SelectCard
                    key={option.value}
                    selected={isSel}
                    dimmed={!!selected && !isSel}
                    color={color}
                    disabled={!!selected}
                    onClick={() => handleSelect(option)}
                  >
                    <span className={`flex-1 text-[16px] font-medium ${isSel ? 'text-white' : 'text-text'}`}>
                      {option.label}
                    </span>
                  </SelectCard>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 하단 고정 — 이전 / 다음 */}
      <div className="shrink-0 bg-surface-secondary">
        <div className="px-5 pb-5 pt-3">
          <div className="bg-white rounded-2xl p-4 shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
            <div className="flex gap-3">
              <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={handleBack}>
                이전
              </Button>
              <Button type="button" variant="primary" size="lg" className="flex-1" onClick={handleNext}>
                다음
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
