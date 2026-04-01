'use client';

import { useLayoutEffect, useRef, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { DiagnosisQuestion, DiagnosisAnswer } from '@/types/diagnosis';
import { shouldSkip, findNextIndex } from '@/lib/flow-engine';
import { SelectCard } from '@/components/ui/SelectCard';

interface QuizModuleProps {
  basicQs: DiagnosisQuestion[];
  detailQs: DiagnosisQuestion[];
  color: string;
  onHome: () => void;
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

export function QuizModule({ basicQs, detailQs, color, onHome, renderResult }: QuizModuleProps) {
  const [screen, setScreen] = useState<Screen>('mode');
  const [mode, setMode] = useState<'basic' | 'detail'>('basic');
  const [questions, setQuestions] = useState<DiagnosisQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, DiagnosisAnswer>>({});
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

        <div className="text-center mt-8">
          <button onClick={onHome} className="text-[15px] bg-transparent border-none cursor-pointer"
            style={{ color, fontFamily: 'inherit' }}>
            ← 홈으로
          </button>
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
    <div className="min-h-screen bg-surface-secondary">
      {/* 프로그레스 바 */}
      <div className="px-5 pt-4 pb-2 max-w-[500px] mx-auto">
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

      {/* 뒤로 가기 */}
      <div className="text-center mt-8 pb-8">
        <button onClick={handleBack} className="bg-transparent border-none text-[15px] cursor-pointer"
          style={{ color, fontFamily: 'inherit' }}>
          {history.length === 0 ? '← 테스트 선택' : '이전으로'}
        </button>
      </div>
    </div>
  );
}
