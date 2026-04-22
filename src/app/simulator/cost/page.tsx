'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  calcCost,
  type CarAge,
  type CarPrice,
  type MonthlyKm,
  type LoanPayment,
  type AnnualInsurance,
  type CostInputs,
  type CostResult,
} from '@/lib/domain/cost-calculator';

// ── 상수 ──────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;
type NumericPhase = 1 | 2 | 3 | 4 | 5;
type Phase = NumericPhase | 'result';

const STEP_META: Record<NumericPhase, { title: string; sub: string }> = {
  1: { title: '차량 연식이 어느 정도인가요?',    sub: '연식에 따라 연비·정비비가 달라집니다' },
  2: { title: '차량 구매 가격대는요?',            sub: '자동차세·감가상각 계산에 사용됩니다' },
  3: { title: '월 평균 주행거리는요?',            sub: '유류비와 정비비 계산에 반영됩니다' },
  4: { title: '현재 할부 상환액은요?',            sub: '완납이면 "완납"을 선택하세요' },
  5: { title: '연간 자동차 보험료는요?',          sub: '월 보험료 환산에 사용됩니다' },
};

const AGE_OPTIONS: { value: CarAge; label: string; sub: string }[] = [
  { value: '1-3',  label: '1~3년 (신차급)',    sub: '정비비 최소, 감가상각 최대' },
  { value: '4-6',  label: '4~6년',             sub: '균형 잡힌 구간' },
  { value: '7-10', label: '7~10년',            sub: '정비비 증가 시작' },
  { value: '10+',  label: '10년 이상',          sub: '연비·정비비 부담 구간' },
];

const PRICE_OPTIONS: { value: CarPrice; label: string }[] = [
  { value: 'under2k', label: '2,000만원 미만' },
  { value: '2k-3k',   label: '2,000 ~ 3,000만원' },
  { value: '3k-5k',   label: '3,000 ~ 5,000만원' },
  { value: '5k+',     label: '5,000만원 이상' },
];

const KM_OPTIONS: { value: MonthlyKm; label: string; sub: string }[] = [
  { value: 'under1k', label: '1,000km 이하',   sub: '연 12,000km 이하' },
  { value: '1k-2k',   label: '1,000 ~ 2,000km', sub: '연 12,000 ~ 24,000km' },
  { value: '2k-3k',   label: '2,000 ~ 3,000km', sub: '연 24,000 ~ 36,000km' },
  { value: '3k+',     label: '3,000km 이상',    sub: '연 36,000km 이상' },
];

const LOAN_OPTIONS: { value: LoanPayment; label: string }[] = [
  { value: 'paid',     label: '완납 (할부 없음)' },
  { value: '200-400k', label: '월 20 ~ 40만원' },
  { value: '400-600k', label: '월 40 ~ 60만원' },
  { value: '600k+',    label: '월 60만원 이상' },
];

const INSURANCE_OPTIONS: { value: AnnualInsurance; label: string }[] = [
  { value: 'under500k',   label: '50만원 미만' },
  { value: '500k-800k',   label: '50 ~ 80만원' },
  { value: '800k-1200k',  label: '80 ~ 120만원' },
  { value: '1200k+',      label: '120만원 이상' },
];

const BAR_ITEMS: { key: keyof CostResult['breakdown']; label: string; color: string }[] = [
  { key: 'loan',         label: '할부금',    color: '#ef4444' },
  { key: 'insurance',    label: '보험료',    color: '#f97316' },
  { key: 'carTax',       label: '자동차세',  color: '#eab308' },
  { key: 'fuel',         label: '유류비',    color: '#f87171' },
  { key: 'maintenance',  label: '정비비',    color: '#fb923c' },
  { key: 'depreciation', label: '감가상각',  color: '#dc2626' },
  { key: 'misc',         label: '기타',      color: '#6b7280' },
];

// ── 유틸 ──────────────────────────────────────────────────────────────

function w(n: number): string {
  const man = Math.round(n / 10_000);
  return `${man.toLocaleString()}만원`;
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left px-4 py-4 rounded-xl border transition-all duration-150',
        selected
          ? 'border-red-500 bg-red-500/10 ring-1 ring-red-500/40'
          : 'border-[#2a2a3e] bg-[#12122a] hover:border-[#3a3a5e]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function AnimatedBar({
  value,
  maxValue,
  color,
  label,
  animate,
}: {
  value: number;
  maxValue: number;
  color: string;
  label: string;
  animate: boolean;
}) {
  const pct = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs w-16 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-5 bg-[#1a1a2e] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: animate ? `${pct}%` : 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      <span className="text-white text-xs font-medium w-16 shrink-0">{w(value)}</span>
    </div>
  );
}

// ── 결과 화면 ─────────────────────────────────────────────────────────

function ResultScreen({ result }: { result: CostResult }) {
  const [barVisible, setBarVisible] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadData, setLeadData] = useState({ name: '', phone: '' });
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setBarVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const { breakdown, totalCost, perceivedCost, hiddenCost, rentLow, rentHigh, rentTotal, diff, verdict } = result;
  const maxBar = Math.max(...Object.values(breakdown));

  const verdictConfig = {
    'strong-rent':   { text: '장기렌트 전환이 확실히 유리합니다', color: '#22c55e', border: '#16a34a' },
    'consider-rent': { text: '한번 검토해볼 만합니다',            color: '#eab308', border: '#ca8a04' },
    'similar':       { text: '비슷하지만 편의성에서 렌트가 유리',  color: '#3b82f6', border: '#2563eb' },
    'keep-car':      { text: '현재 유지가 더 경제적',             color: '#9ca3af', border: '#6b7280' },
  }[verdict];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log('[cost-simulator lead]', leadData);
    setLeadSubmitted(true);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 헤더 */}
      <div>
        <p className="text-red-400 text-sm font-medium mb-1">유지비 진단 완료</p>
        <h2 className="text-white text-2xl font-bold">실제 차량 유지비</h2>
      </div>

      {/* 충격 포인트 — 인식 vs 실제 */}
      <div className="bg-gradient-to-br from-red-950/60 to-[#1a0a0a] border border-red-900/40 rounded-2xl p-5">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-slate-400 text-xs mb-1">내가 생각한 월 비용</p>
            <p className="text-slate-300 text-2xl font-bold">{w(perceivedCost)}</p>
          </div>
          <div className="text-slate-600 text-2xl font-light">→</div>
          <div className="text-right">
            <p className="text-red-400 text-xs mb-1">실제 월 유지비</p>
            <p className="text-red-400 text-3xl font-bold">{w(totalCost)}</p>
          </div>
        </div>
        <div className="border-t border-red-900/40 pt-3 text-center">
          <p className="text-slate-400 text-sm">숨어있는 비용</p>
          <p className="text-red-300 text-2xl font-bold mt-0.5">
            월 {w(hiddenCost)} <span className="text-base font-normal text-red-400/80">더 나가고 있습니다</span>
          </p>
        </div>
      </div>

      {/* 항목별 바 차트 */}
      <div ref={barRef} className="bg-[#12122a] border border-[#2a2a3e] rounded-2xl p-5">
        <p className="text-slate-300 text-sm font-semibold mb-4">항목별 월 비용</p>
        <div className="flex flex-col gap-3">
          {BAR_ITEMS.map(({ key, label, color }) => (
            breakdown[key] > 0 ? (
              <AnimatedBar
                key={key}
                value={breakdown[key]}
                maxValue={maxBar}
                color={color}
                label={label}
                animate={barVisible}
              />
            ) : null
          ))}
        </div>
        <div className="border-t border-[#2a2a3e] mt-4 pt-3 flex justify-between">
          <span className="text-slate-400 text-sm">합계</span>
          <span className="text-red-400 font-bold">{w(totalCost)}/월</span>
        </div>
      </div>

      {/* VS 비교 */}
      <div className="bg-[#12122a] border border-[#2a2a3e] rounded-2xl p-5">
        <p className="text-slate-300 text-sm font-semibold mb-4">내 차 vs 동급 장기렌트</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-950/40 border border-red-900/40 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-xs mb-1">내 차 유지비</p>
            <p className="text-red-400 text-xl font-bold">{w(totalCost)}</p>
            <p className="text-slate-500 text-xs mt-1">/월</p>
          </div>
          <div className="bg-[#0c1a0c] border border-[#1a3a1a] rounded-xl p-4 text-center">
            <p className="text-slate-400 text-xs mb-1">장기렌트 예상</p>
            <p className="text-green-400 text-xl font-bold">{w(rentTotal)}</p>
            <p className="text-slate-500 text-xs mt-1">렌트 {w(rentLow)}~{w(rentHigh)} + 유류비</p>
          </div>
        </div>
        <div className="mt-3 text-center">
          <p className="text-slate-400 text-xs">
            차이:{' '}
            <span className={diff > 0 ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
              {diff > 0 ? `내 차가 월 ${w(diff)} 더 비쌉니다` : `내 차가 월 ${w(Math.abs(diff))} 더 저렴합니다`}
            </span>
          </p>
        </div>
      </div>

      {/* 판정 메시지 */}
      <div
        className="rounded-2xl p-4 text-center border"
        style={{ backgroundColor: `${verdictConfig.color}15`, borderColor: `${verdictConfig.border}60` }}
      >
        <p className="font-semibold" style={{ color: verdictConfig.color }}>
          {verdictConfig.text}
        </p>
      </div>

      {/* 잠금 영역 */}
      <div className="relative rounded-2xl overflow-hidden border border-[#2a2a3e]">
        <div className="select-none pointer-events-none blur-sm p-5 bg-[#12122a] flex flex-col gap-3">
          <p className="text-slate-300 font-semibold text-sm">🔍 정밀 분석</p>
          {[
            ['내 차 시세 기반 정확한 감가상각', '실제 중고차 시세 반영'],
            ['신용등급별 실제 렌트료 3사 비교', '현대캐피탈 · KB · 롯데'],
            ['보험료 절감 시뮬레이션',           '운전자 조건 최적화'],
          ].map(([l, r]) => (
            <div key={l} className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">{l}</span>
              <span className="text-slate-300 text-sm">{r}</span>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0c0c1d]/70 backdrop-blur-[2px]">
          <span className="text-2xl">🔒</span>
          <p className="text-white font-semibold text-sm text-center px-4">
            무료 맞춤 견적 비교 후<br />상세 분석을 확인하세요
          </p>
          {!showLeadForm && !leadSubmitted && (
            <button
              onClick={() => setShowLeadForm(true)}
              className="mt-1 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              무료 맞춤 견적 비교 받기 →
            </button>
          )}
        </div>
      </div>

      {/* 리드 폼 */}
      {(showLeadForm || leadSubmitted) && (
        <div className="bg-[#12122a] border border-red-900/40 rounded-2xl p-5">
          {leadSubmitted ? (
            <div className="text-center py-4">
              <p className="text-red-400 text-2xl mb-2">✓</p>
              <p className="text-white font-semibold">신청 완료!</p>
              <p className="text-slate-400 text-sm mt-1">곧 연락드리겠습니다.</p>
            </div>
          ) : (
            <>
              <p className="text-white font-semibold mb-1">무료 맞춤 견적 비교</p>
              <p className="text-slate-400 text-xs mb-4">
                전문 상담사가 1영업일 내 연락드립니다
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="이름"
                  required
                  value={leadData.name}
                  onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0c0c1d] border border-[#2a2a3e] rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
                <input
                  type="tel"
                  placeholder="연락처 (010-0000-0000)"
                  required
                  value={leadData.phone}
                  onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0c0c1d] border border-[#2a2a3e] rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  신청하기
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <p className="text-slate-600 text-xs leading-relaxed text-center px-2">
        ※ 본 진단 결과는 참고용입니다. 실제 유지비는 차종·운전 습관·지역에 따라 다를 수 있습니다.
      </p>
    </div>
  );
}

// ── 단계별 콘텐츠 ─────────────────────────────────────────────────────

function StepContent({
  phase,
  answers,
  onSelect,
}: {
  phase: NumericPhase;
  answers: Partial<CostInputs>;
  onSelect: <K extends keyof CostInputs>(k: K, v: CostInputs[K]) => void;
}) {
  const meta = STEP_META[phase];
  return (
    <div>
      <p className="text-slate-400 text-sm mb-1">{meta.sub}</p>
      <h2 className="text-white text-xl font-semibold mb-6 leading-snug">{meta.title}</h2>
      <div className="flex flex-col gap-3">
        {phase === 1 && AGE_OPTIONS.map((o) => (
          <OptionCard key={o.value} selected={answers.carAge === o.value} onClick={() => onSelect('carAge', o.value)}>
            <span className="block text-white font-medium">{o.label}</span>
            <span className="block text-slate-400 text-sm mt-0.5">{o.sub}</span>
          </OptionCard>
        ))}
        {phase === 2 && PRICE_OPTIONS.map((o) => (
          <OptionCard key={o.value} selected={answers.carPrice === o.value} onClick={() => onSelect('carPrice', o.value)}>
            <span className="text-white font-medium">{o.label}</span>
          </OptionCard>
        ))}
        {phase === 3 && KM_OPTIONS.map((o) => (
          <OptionCard key={o.value} selected={answers.monthlyKm === o.value} onClick={() => onSelect('monthlyKm', o.value)}>
            <span className="block text-white font-medium">{o.label}</span>
            <span className="block text-slate-400 text-sm mt-0.5">{o.sub}</span>
          </OptionCard>
        ))}
        {phase === 4 && LOAN_OPTIONS.map((o) => (
          <OptionCard key={o.value} selected={answers.loanPayment === o.value} onClick={() => onSelect('loanPayment', o.value)}>
            <span className="text-white font-medium">{o.label}</span>
          </OptionCard>
        ))}
        {phase === 5 && INSURANCE_OPTIONS.map((o) => (
          <OptionCard key={o.value} selected={answers.annualInsurance === o.value} onClick={() => onSelect('annualInsurance', o.value)}>
            <span className="text-white font-medium">{o.label}</span>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────────────

export default function CostSimulatorPage() {
  const [phase, setPhase]   = useState<Phase>(1);
  const [dir, setDir]       = useState(1);
  const [answers, setAnswers] = useState<Partial<CostInputs>>({});
  const [result, setResult]  = useState<CostResult | null>(null);

  const PHASE_KEY_MAP: Record<NumericPhase, keyof CostInputs> = {
    1: 'carAge',
    2: 'carPrice',
    3: 'monthlyKm',
    4: 'loanPayment',
    5: 'annualInsurance',
  };

  function select<K extends keyof CostInputs>(key: K, value: CostInputs[K]) {
    const next: Partial<CostInputs> = { ...answers, [key]: value };
    setAnswers(next);
    setDir(1);

    const currentPhase = phase as NumericPhase;
    if (currentPhase < TOTAL_STEPS) {
      setTimeout(() => setPhase((currentPhase + 1) as NumericPhase), 120);
    } else {
      const inputs = next as CostInputs;
      setResult(calcCost(inputs));
      setTimeout(() => setPhase('result'), 120);
    }
  }

  function goBack() {
    setDir(-1);
    if (phase === 'result') {
      setPhase(TOTAL_STEPS);
    } else if ((phase as number) > 1) {
      setPhase(((phase as number) - 1) as NumericPhase);
    }
  }

  function reset() {
    setDir(-1);
    setAnswers({});
    setResult(null);
    setTimeout(() => setPhase(1), 50);
  }

  const canGoBack = phase !== 1;
  const progress = phase === 'result' ? 100 : ((phase as number) / TOTAL_STEPS) * 100;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0c0c1d 0%, #1a1a2e 60%, #0c0c1d 100%)' }}
    >
      <div className="max-w-[520px] mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            {canGoBack && (
              <button onClick={goBack} className="text-slate-400 hover:text-white transition-colors text-sm">
                ← 이전
              </button>
            )}
            <span className="ml-auto text-slate-500 text-xs">
              {phase === 'result' ? '결과' : `${phase as number} / ${TOTAL_STEPS}`}
            </span>
          </div>

          {/* 진행 바 */}
          <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-red-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* 인트로 (1단계 위) */}
        {phase === 1 && (
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-medium">유지비 진단</span>
            </div>
            <h1 className="text-white text-2xl font-bold leading-snug mb-2">
              내 차 유지비,<br />
              <span className="text-red-400">정말 이만큼일까요?</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              할부·유류·보험만 생각하셨나요? 감가상각·정비·세금까지 합치면
              체감의 1.5~2배가 됩니다.
            </p>
          </div>
        )}

        {/* 콘텐츠 */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={phase}
            custom={dir}
            initial={{ x: dir * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir * -40, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {phase === 'result' && result ? (
              <ResultScreen result={result} />
            ) : (
              <StepContent
                phase={phase as NumericPhase}
                answers={answers}
                onSelect={select}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* 처음으로 버튼 (결과 화면) */}
        {phase === 'result' && (
          <div className="mt-6 text-center">
            <button
              onClick={reset}
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              ↺ 다시 진단하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
