'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  calculateTaxSaving,
  type BusinessType,
  type DiagnosisInputs,
  type DiagnosisResult,
  type Industry,
  type MonthlyBudgetRange,
  type RevenueRange,
  type VehicleStatus,
} from '@/lib/domain/tax-calculator';

// ── 상수 ──────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

type NumericPhase = 1 | 2 | 3 | 4 | 5;
type Phase = NumericPhase | 'result';

// Step 1 — 사업자 유형
const BUSINESS_OPTIONS: { value: BusinessType; label: string; desc: string }[] = [
  { value: 'corporation', label: '법인 사업자', desc: '법인세 9 ~ 21% 적용' },
  { value: 'individual',  label: '개인 사업자', desc: '종합소득세 6 ~ 45% 적용' },
];

// Step 2 — 업종
const INDUSTRY_OPTIONS: { value: Industry; label: string; ratio: string }[] = [
  { value: 'construction', label: '건설업',         ratio: '90%' },
  { value: 'retail',       label: '도소매업',        ratio: '85%' },
  { value: 'food',         label: '음식업',          ratio: '70%' },
  { value: 'service',      label: '서비스업',        ratio: '60%' },
  { value: 'freelance',    label: '프리랜서·1인기업', ratio: '65%' },
];

// Step 3 — 연 매출
const REVENUE_OPTIONS: { value: RevenueRange; label: string }[] = [
  { value: 'under5k',    label: '5,000만원 미만' },
  { value: '5k-1eok',   label: '5,000만원 ~ 1억원' },
  { value: '1eok-3eok', label: '1억원 ~ 3억원' },
  { value: '3eok-10eok',label: '3억원 ~ 10억원' },
  { value: 'over10eok', label: '10억원 이상' },
];

// Step 4 — 차량 현황
const VEHICLE_OPTIONS: { value: VehicleStatus; label: string; desc: string }[] = [
  { value: 'none',     label: '현재 없음',       desc: '신규 도입 검토 중' },
  { value: 'owned',    label: '직접 구매·보유',   desc: '차량 소유 중' },
  { value: 'planning', label: '장기렌트 검토 중', desc: '렌탈 계약 예정' },
];

// Step 5 — 월 예산
const BUDGET_OPTIONS: { value: MonthlyBudgetRange; label: string; sub: string }[] = [
  { value: 'w300k',    label: '월 30만원',     sub: '연 360만원' },
  { value: 'w500k',    label: '월 50만원',     sub: '연 600만원' },
  { value: 'w700k',    label: '월 70만원',     sub: '연 840만원' },
  { value: 'w1m',      label: '월 100만원',    sub: '연 1,200만원' },
  { value: 'over1p5m', label: '월 150만원 이상', sub: '연 1,800만원+' },
];

const STEP_META: Record<NumericPhase, { title: string; sub: string }> = {
  1: { title: '어떤 사업자이신가요?',        sub: '사업자 유형에 따라 세율이 달라집니다' },
  2: { title: '주요 업종을 선택해 주세요',    sub: '업종별 업무사용비율이 적용됩니다' },
  3: { title: '연 매출 규모가 어느 정도인가요?', sub: '한계세율 산정에 사용됩니다' },
  4: { title: '현재 차량 상황은 어떤가요?',   sub: '절세 전략 방향을 결정합니다' },
  5: { title: '월 차량 관련 예산은 얼마인가요?', sub: '렌탈료 또는 유지비 기준으로 선택해 주세요' },
};

// ── 유틸 ──────────────────────────────────────────────────────────────

function formatWon(n: number): string {
  if (n >= 100_000_000) {
    const eok = n / 100_000_000;
    return eok % 1 === 0 ? `${eok}억원` : `${eok.toFixed(1)}억원`;
  }
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만원`;
  return `${n.toLocaleString()}원`;
}

function pctStr(n: number): string {
  return `${Math.round(n * 100)}%`;
}

// ── 슬라이드 애니메이션 ───────────────────────────────────────────────

const slide = {
  enter: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
};
const TRANS = { duration: 0.22, ease: 'easeOut' as const };

// ── 공용 카드 버튼 ────────────────────────────────────────────────────

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
          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40'
          : 'border-[#334155] bg-[#1e293b] hover:border-slate-500',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ── 단계별 콘텐츠 ─────────────────────────────────────────────────────

function StepContent({
  phase,
  answers,
  onSelect,
}: {
  phase: NumericPhase;
  answers: Partial<DiagnosisInputs>;
  onSelect: <K extends keyof DiagnosisInputs>(k: K, v: DiagnosisInputs[K]) => void;
}) {
  const meta = STEP_META[phase];

  return (
    <div>
      <p className="text-slate-400 text-sm mb-1">{meta.sub}</p>
      <h2 className="text-white text-xl font-semibold mb-6 leading-snug">{meta.title}</h2>

      <div className="flex flex-col gap-3">
        {/* Step 1 */}
        {phase === 1 && BUSINESS_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            selected={answers.businessType === o.value}
            onClick={() => onSelect('businessType', o.value)}
          >
            <span className="block text-white font-medium">{o.label}</span>
            <span className="block text-slate-400 text-sm mt-0.5">{o.desc}</span>
          </OptionCard>
        ))}

        {/* Step 2 */}
        {phase === 2 && INDUSTRY_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            selected={answers.industry === o.value}
            onClick={() => onSelect('industry', o.value)}
          >
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">{o.label}</span>
              <span className="text-emerald-400 text-sm font-mono">업무사용 {o.ratio}</span>
            </div>
          </OptionCard>
        ))}

        {/* Step 3 */}
        {phase === 3 && REVENUE_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            selected={answers.revenue === o.value}
            onClick={() => onSelect('revenue', o.value)}
          >
            <span className="text-white font-medium">{o.label}</span>
          </OptionCard>
        ))}

        {/* Step 4 */}
        {phase === 4 && VEHICLE_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            selected={answers.vehicleStatus === o.value}
            onClick={() => onSelect('vehicleStatus', o.value)}
          >
            <span className="block text-white font-medium">{o.label}</span>
            <span className="block text-slate-400 text-sm mt-0.5">{o.desc}</span>
          </OptionCard>
        ))}

        {/* Step 5 */}
        {phase === 5 && BUDGET_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            selected={answers.monthlyBudget === o.value}
            onClick={() => onSelect('monthlyBudget', o.value)}
          >
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">{o.label}</span>
              <span className="text-slate-400 text-sm">{o.sub}</span>
            </div>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

// ── 결과 화면 ─────────────────────────────────────────────────────────

function ResultScreen({
  result,
  showLeadForm,
  leadData,
  leadSubmitted,
  leadSubmitting,
  leadError,
  onShowLeadForm,
  onLeadChange,
  onLeadSubmit,
}: {
  result: DiagnosisResult;
  showLeadForm: boolean;
  leadData: { name: string; phone: string };
  leadSubmitted: boolean;
  leadSubmitting: boolean;
  leadError: string | null;
  onShowLeadForm: () => void;
  onLeadChange: (d: { name: string; phone: string }) => void;
  onLeadSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* 헤더 */}
      <div>
        <p className="text-emerald-400 text-sm font-medium mb-1">세무 진단 완료</p>
        <h2 className="text-white text-2xl font-bold">절세 예상 금액</h2>
      </div>

      {/* 메인 절세 금액 */}
      <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/40 rounded-2xl p-6 text-center">
        <p className="text-slate-400 text-sm mb-2">연간 절세 예상액</p>
        <p className="text-emerald-400 text-5xl font-bold tracking-tight">
          {formatWon(result.annualTaxSaving)}
        </p>
        <p className="text-slate-500 text-xs mt-2">* 운행일지 미작성 기준 추정치</p>
      </div>

      {/* 항목별 분석 */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4 flex flex-col gap-3">
        <StatRow
          label="비용처리 가능 금액"
          value={formatWon(result.deductibleExpense)}
          sub={result.expenseLimitApplied ? '연 1,500만원 한도 적용' : ''}
        />
        <div className="border-t border-[#334155]" />
        <StatRow
          label="적용 한계세율"
          value={pctStr(result.marginalTaxRate)}
          highlight
        />
        <div className="border-t border-[#334155]" />
        <StatRow
          label="업무사용비율"
          value={pctStr(result.businessUseRatio)}
        />
        <div className="border-t border-[#334155]" />
        <StatRow
          label="연간 차량 비용"
          value={formatWon(result.annualCarExpense)}
        />
      </div>

      {/* 상세 분석 — 블러 잠금 영역 */}
      <div className="relative rounded-2xl overflow-hidden border border-[#334155]">
        {/* 블러 대상 */}
        <div className="select-none pointer-events-none blur-sm p-5 bg-[#1e293b] flex flex-col gap-3">
          <p className="text-slate-300 font-semibold text-sm">📊 상세 절세 분석</p>
          <FakeAnalysisRow label="추천 차종 TOP 3" value="국산 SUV 기준" />
          <FakeAnalysisRow label="최적 계약 기간" value="36 vs 48 vs 60개월" />
          <FakeAnalysisRow label="보증금 전략" value="0원 vs 30% 시나리오" />
          <FakeAnalysisRow label="월 실효 절세액" value="약 ██만원" />
          <FakeAnalysisRow label="5년 총 절세 효과" value="약 ████만원" />
        </div>
        {/* 오버레이 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0f172a]/60 backdrop-blur-[2px]">
          <div className="text-2xl">🔒</div>
          <p className="text-white font-semibold text-sm text-center px-4">
            무료 맞춤 상담 신청 후<br />상세 분석을 확인하세요
          </p>
          {!showLeadForm && (
            <button
              onClick={onShowLeadForm}
              className="mt-1 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              무료 맞춤 상담 신청 →
            </button>
          )}
        </div>
      </div>

      {/* 리드 폼 */}
      {showLeadForm && (
        <div className="bg-[#1e293b] border border-emerald-700/40 rounded-2xl p-5">
          {leadSubmitted ? (
            <div className="text-center py-4">
              <p className="text-emerald-400 text-2xl mb-2">✓</p>
              <p className="text-white font-semibold">상담 신청 완료!</p>
              <p className="text-slate-400 text-sm mt-1">곧 연락드리겠습니다.</p>
            </div>
          ) : (
            <>
              <p className="text-white font-semibold mb-1">무료 맞춤 상담 신청</p>
              <p className="text-slate-400 text-xs mb-4">
                전문 세무사가 검토 후 1영업일 내 연락드립니다
              </p>
              <form onSubmit={onLeadSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="이름"
                  required
                  value={leadData.name}
                  onChange={(e) => onLeadChange({ ...leadData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <input
                  type="tel"
                  placeholder="연락처 (010-0000-0000)"
                  required
                  value={leadData.phone}
                  onChange={(e) => onLeadChange({ ...leadData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-slate-600 text-xs text-center">
                  신청 시{' '}
                  <a href="/privacy" target="_blank" rel="noreferrer" className="underline text-slate-500 hover:text-slate-400">
                    개인정보 처리방침
                  </a>
                  에 동의합니다.
                </p>
                {leadError && (
                  <p className="text-red-400 text-xs text-center">{leadError}</p>
                )}
                <button
                  type="submit"
                  disabled={leadSubmitting}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  {leadSubmitting ? '신청 중...' : '상담 신청하기'}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* 면책 문구 */}
      <p className="text-slate-600 text-xs leading-relaxed text-center px-2">
        ※ 본 진단은 참고용입니다. 정확한 세무 처리는 전문 세무사 상담을 권장합니다.<br />
        세법 개정에 따라 한도 및 세율이 변경될 수 있습니다.
      </p>
    </div>
  );
}

// ── 소형 서브 컴포넌트 ────────────────────────────────────────────────

function StatRow({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400 text-sm">{label}</span>
      <div className="text-right">
        <span className={highlight ? 'text-emerald-400 font-semibold' : 'text-white font-medium'}>
          {value}
        </span>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function FakeAnalysisRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-slate-300 text-sm">{value}</span>
    </div>
  );
}

// ── 메인 페이지 컴포넌트 ──────────────────────────────────────────────

export default function TaxSimulatorPage() {
  const [phase, setPhase]                 = useState<Phase>(1);
  const [dir, setDir]                     = useState(1);
  const [answers, setAnswers]             = useState<Partial<DiagnosisInputs>>({});
  const [result, setResult]               = useState<DiagnosisResult | null>(null);
  const [showLeadForm, setShowLeadForm]   = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError]         = useState<string | null>(null);
  const [leadData, setLeadData]           = useState({ name: '', phone: '' });

  function select<K extends keyof DiagnosisInputs>(key: K, value: DiagnosisInputs[K]) {
    const next: Partial<DiagnosisInputs> = { ...answers, [key]: value };
    setAnswers(next);
    setDir(1);

    if (phase === 5) {
      setResult(calculateTaxSaving(next as DiagnosisInputs));
      setPhase('result');
    } else if (typeof phase === 'number') {
      setPhase((phase + 1) as NumericPhase);
    }
  }

  function back() {
    setDir(-1);
    if (phase === 'result')                          setPhase(5);
    else if (typeof phase === 'number' && phase > 1) setPhase((phase - 1) as NumericPhase);
  }

  function restart() {
    setDir(-1);
    setAnswers({});
    setResult(null);
    setShowLeadForm(false);
    setLeadSubmitted(false);
    setLeadSubmitting(false);
    setLeadError(null);
    setLeadData({ name: '', phone: '' });
    setPhase(1);
  }

  // 월예산 범위 → 원 단위 변환
  const BUDGET_WON: Record<string, number> = {
    w300k:    300_000,
    w500k:    500_000,
    w700k:    700_000,
    w1m:    1_000_000,
    over1p5m: 1_500_000,
  };

  // 답변 레이블 매핑 (financeAnswers용)
  const BUSINESS_LABEL: Record<string, string> = {
    corporation: '법인 사업자',
    individual:  '개인 사업자',
  };
  const INDUSTRY_LABEL: Record<string, string> = {
    construction: '건설업',
    retail:       '도소매업',
    food:         '음식업',
    service:      '서비스업',
    freelance:    '프리랜서·1인기업',
  };
  const REVENUE_LABEL: Record<string, string> = {
    'under5k':    '5천만원 미만',
    '5k-1eok':   '5천~1억',
    '1eok-3eok': '1억~3억',
    '3eok-10eok':'3억~10억',
    'over10eok': '10억 이상',
  };
  const VEHICLE_LABEL: Record<string, string> = {
    none:     '차량 없음',
    owned:    '직접 구매·보유',
    planning: '장기렌트 검토 중',
  };

  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!result) return;

    setLeadSubmitting(true);
    setLeadError(null);

    const financeSummary = [
      `[세무진단] 연간 절세 예상: ${formatWon(result.annualTaxSaving)}`,
      `사업자: ${BUSINESS_LABEL[answers.businessType ?? ''] ?? answers.businessType ?? ''}`,
      `업종: ${INDUSTRY_LABEL[answers.industry ?? ''] ?? answers.industry ?? ''}`,
      `연매출: ${REVENUE_LABEL[answers.revenue ?? ''] ?? answers.revenue ?? ''}`,
      `한계세율: ${Math.round(result.marginalTaxRate * 100)}%`,
      `비용처리가능: ${formatWon(result.deductibleExpense)}`,
      `차량현황: ${VEHICLE_LABEL[answers.vehicleStatus ?? ''] ?? answers.vehicleStatus ?? ''}`,
    ].join(' / ');

    try {
      const res = await fetch('/api/consultation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          leadData.name,
          phone:         leadData.phone,
          privacyAgreed: true,
          contactMethod: 'phone',
          financeSummary,
          financeAnswers: Object.fromEntries(
            Object.entries(answers)
              .filter(([, v]) => v != null)
              .map(([k, v]) => [k, { value: String(v), label: String(v) }]),
          ),
          monthlyBudget: BUDGET_WON[answers.monthlyBudget ?? ''] ?? null,
          stepCompleted: 6,
        }),
      });

      if (!res.ok) throw new Error('server');
      setLeadSubmitted(true);
    } catch {
      setLeadError('오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLeadSubmitting(false);
    }
  }

  const progress = phase === 'result'
    ? 100
    : (((phase as number) - 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      {/* 상단 진행 바 */}
      <div className="w-full h-1 bg-[#1e293b]">
        <motion.div
          className="h-full bg-emerald-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* 네비게이션 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 max-w-[520px] mx-auto w-full">
        {phase !== 1 ? (
          <button
            onClick={back}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            ← 이전
          </button>
        ) : (
          <div />
        )}
        {typeof phase === 'number' && (
          <span className="text-slate-500 text-xs">{phase} / {TOTAL_STEPS}</span>
        )}
        {phase === 'result' && (
          <button
            onClick={restart}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            다시하기
          </button>
        )}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 flex justify-center px-4 pt-2 pb-12">
        <div className="w-full max-w-[520px]">
          <AnimatePresence mode="wait" custom={dir}>
            {typeof phase === 'number' && (
              <motion.div
                key={phase}
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={TRANS}
              >
                <StepContent
                  phase={phase}
                  answers={answers}
                  onSelect={select}
                />
              </motion.div>
            )}

            {phase === 'result' && result && (
              <motion.div
                key="result"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={TRANS}
              >
                <ResultScreen
                  result={result}
                  showLeadForm={showLeadForm}
                  leadData={leadData}
                  leadSubmitted={leadSubmitted}
                  leadSubmitting={leadSubmitting}
                  leadError={leadError}
                  onShowLeadForm={() => setShowLeadForm(true)}
                  onLeadChange={setLeadData}
                  onLeadSubmit={submitLead}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
