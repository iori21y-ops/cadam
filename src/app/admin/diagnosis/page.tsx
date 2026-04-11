'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { useToastStore } from '@/store/toastStore';
import { FINANCE_BASIC, FINANCE_DETAIL } from '@/data/diagnosis-finance';
import { ALL_VEHICLE_TAGS, DEFAULT_VEHICLE_BASIC, DEFAULT_VEHICLE_DETAIL } from '@/data/diagnosis-vehicle';
import { DEFAULT_PRODUCTS, PRODUCT_KEYS, PRODUCT_LABELS, RENT_FIT_TIERS } from '@/data/diagnosis-products';
import { DEFAULT_AI_CONFIG } from '@/data/diagnosis-ai';
import { VEHICLES } from '@/data/diagnosis-vehicles';
import { calcMonthly } from '@/lib/calc-monthly';
import type {
  AIConfig,
  DiagnosisData,
  DiagnosisVehicle,
  FinanceOption,
  FinanceQuestion,
  Product,
  ProductKey,
  RentFitTierKey,
  RentFitTierData,
  SkipCondition,
  VehicleOption,
  VehicleQuestion,
} from '@/types/diagnosis';

const CONFIG_ID = 'diagnosis_data_v1';

const TABS = ['금융 간편', '금융 상세', '차종 간편', '차종 상세', '렌트적합도', '차종결과'] as const;
type Tab = (typeof TABS)[number];

function deepClone<T>(v: T): T {
  if (typeof structuredClone === 'function') return structuredClone(v);
  return JSON.parse(JSON.stringify(v)) as T;
}

function buildDefaultData(): DiagnosisData {
  return {
    finBasic: FINANCE_BASIC,
    finDetail: FINANCE_DETAIL,
    vehBasic: DEFAULT_VEHICLE_BASIC,
    vehDetail: DEFAULT_VEHICLE_DETAIL,
    products: DEFAULT_PRODUCTS,
    rentFitTiers: RENT_FIT_TIERS,
    aiConfig: DEFAULT_AI_CONFIG,
    vehicles: VEHICLES,
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

function normalizeDiagnosisData(input: unknown): DiagnosisData {
  const base = deepClone(buildDefaultData());
  if (!isRecord(input)) return base;

  // Supabase에서 로드한 기존 데이터에 weight가 없을 수 있으므로 기본값 채움
  const ensureWeight = (qs: FinanceQuestion[]): FinanceQuestion[] =>
    qs.map((q) => ({ ...q, weight: q.weight ?? 1.0 }));

  const out: DiagnosisData = {
    finBasic:
      Array.isArray(input.finBasic) && (input.finBasic as unknown[]).length > 0
        ? ensureWeight(input.finBasic as FinanceQuestion[])
        : base.finBasic,
    finDetail:
      Array.isArray(input.finDetail) && (input.finDetail as unknown[]).length > 0
        ? ensureWeight(input.finDetail as FinanceQuestion[])
        : base.finDetail,
    vehBasic:
      Array.isArray(input.vehBasic) && (input.vehBasic as unknown[]).length > 0
        ? (input.vehBasic as VehicleQuestion[])
        : base.vehBasic,
    vehDetail:
      Array.isArray(input.vehDetail) && (input.vehDetail as unknown[]).length > 0
        ? (input.vehDetail as VehicleQuestion[])
        : base.vehDetail,
    products: isRecord(input.products)
      ? ({ ...base.products, ...(input.products as Partial<DiagnosisData['products']>) } as DiagnosisData['products'])
      : base.products,
    rentFitTiers: isRecord(input.rentFitTiers)
      ? ({ ...base.rentFitTiers, ...(input.rentFitTiers as Partial<DiagnosisData['rentFitTiers']>) } as DiagnosisData['rentFitTiers'])
      : base.rentFitTiers,
    aiConfig: isRecord(input.aiConfig)
      ? ({ ...base.aiConfig, ...(input.aiConfig as Partial<AIConfig>) } as AIConfig)
      : base.aiConfig,
    vehicles:
      Array.isArray(input.vehicles) && (input.vehicles as unknown[]).length > 0
        ? (input.vehicles as DiagnosisVehicle[])
        : base.vehicles,
  };

  // Ensure product keys exist
  (['installment', 'lease', 'rent', 'cash'] as const).forEach((k) => {
    out.products[k] = { ...base.products[k], ...(out.products[k] ?? {}) };
  });

  // Ensure rentFitTiers keys exist
  (['high', 'mid', 'low'] as const).forEach((k) => {
    out.rentFitTiers[k] = { ...base.rentFitTiers[k], ...(out.rentFitTiers[k] ?? {}) };
  });

  // Ensure aiConfig arrays exist
  out.aiConfig.tonePresets = Array.isArray(out.aiConfig.tonePresets)
    ? out.aiConfig.tonePresets
    : base.aiConfig.tonePresets;
  out.aiConfig.fallbacks = Array.isArray(out.aiConfig.fallbacks) ? out.aiConfig.fallbacks : base.aiConfig.fallbacks;

  return out;
}

function SectionCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
      {children}
    </section>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-xl bg-surface-secondary text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/25 ${className}`}
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 3,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className={`w-full px-3 py-2 rounded-xl bg-surface-secondary text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/25 resize-y ${className}`}
    />
  );
}

function SmallButton({
  children,
  onClick,
  variant = 'surface',
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'surface';
  disabled?: boolean;
}) {
  const cls =
    variant === 'primary'
      ? 'bg-primary text-white shadow-[0_4px_16px_rgba(0,122,255,0.25)]'
      : variant === 'danger'
        ? 'bg-danger text-white'
        : 'bg-surface-secondary text-text';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-[10px] text-sm font-semibold transition-all disabled:opacity-60 ${cls}`}
    >
      {children}
    </button>
  );
}

function PlusTinyButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="bg-surface-secondary text-primary rounded-[10px] px-2.5 py-1.5 text-xs font-semibold"
    >
      +
    </button>
  );
}

function AdminTabBar({
  tab,
  setTab,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
}) {
  const items: Array<{ key: Tab; label: string }> = [
    { key: '금융 간편', label: '금융간편' },
    { key: '금융 상세', label: '금융상세' },
    { key: '차종 간편', label: '차종간편' },
    { key: '차종 상세', label: '차종상세' },
    { key: '렌트적합도', label: '렌트적합도' },
    { key: '차종결과', label: '차종결과' },
  ];
  return (
    <div className="flex gap-[3px] bg-[#E5E5EA] rounded-xl p-[3px] flex-wrap">
      {items.map((it) => {
        const active = tab === it.key;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => setTab(it.key)}
            className={`flex-1 min-w-[50px] py-2 rounded-[10px] border-0 text-[11px] font-semibold ${
              active
                ? 'bg-white text-text shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
                : 'bg-transparent text-text-sub'
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function getQuestionSummary(q: FinanceQuestion | VehicleQuestion): {
  optionCount: number;
  hasSkip: boolean;
  hasBranch: boolean;
} {
  return {
    optionCount: q.options.length,
    hasSkip: q.skipIf.length > 0,
    hasBranch: q.options.some((o) => Boolean(o.nextQ)),
  };
}

function QuestionEditor({
  label,
  type,
  questions,
  setQuestions,
  allQuestionsForBranch,
  allQuestionsForSkipRef,
}: {
  label: string;
  type: 'finance' | 'vehicle';
  questions: (FinanceQuestion | VehicleQuestion)[];
  setQuestions: (next: (FinanceQuestion | VehicleQuestion)[]) => void;
  allQuestionsForBranch: (FinanceQuestion | VehicleQuestion)[];
  allQuestionsForSkipRef: (FinanceQuestion | VehicleQuestion)[];
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const ainp = 'bg-surface-secondary border border-border-solid rounded-[10px] outline-none w-full box-border';

  const addQuestion = () => {
    const id = `q_${Date.now()}`;
    if (type === 'finance') {
      const next: FinanceQuestion[] = [
        ...(questions as FinanceQuestion[]),
        {
          id,
          question: '새 질문',
          subtitle: '설명',
          weight: 1.0,
          skipIf: [],
          options: [
            { label: '선택지 1', value: 'o1', scores: { installment: 0, lease: 0, rent: 0, cash: 0 }, nextQ: '' },
            { label: '선택지 2', value: 'o2', scores: { installment: 0, lease: 0, rent: 0, cash: 0 }, nextQ: '' },
          ],
        },
      ];
      setQuestions(next);
      setOpenIdx(next.length - 1);
      return;
    }
    const next: VehicleQuestion[] = [
      ...(questions as VehicleQuestion[]),
      {
        id,
        question: '새 질문',
        subtitle: '설명',
        skipIf: [],
        options: [
          { label: '선택지 1', value: 'o1', tags: [], nextQ: '' },
          { label: '선택지 2', value: 'o2', tags: [], nextQ: '' },
        ],
      },
    ];
    setQuestions(next);
    setOpenIdx(next.length - 1);
  };

  const moveQuestion = (idx: number, delta: -1 | 1) => {
    const n = idx + delta;
    if (n < 0 || n >= questions.length) return;
    const next = [...questions];
    [next[idx], next[n]] = [next[n], next[idx]];
    setQuestions(next);
    setOpenIdx((cur) => (cur === idx ? n : cur === n ? idx : cur));
  };

  const deleteQuestion = (idx: number) => {
    const next = [...questions];
    next.splice(idx, 1);
    setQuestions(next);
    setOpenIdx((cur) => (cur === idx ? null : cur != null && cur > idx ? cur - 1 : cur));
  };

  const updateQuestionField = <K extends 'question' | 'subtitle'>(idx: number, key: K, value: string) => {
    const next = [...questions] as (FinanceQuestion | VehicleQuestion)[];
    next[idx] = { ...next[idx], [key]: value } as FinanceQuestion | VehicleQuestion;
    setQuestions(next);
  };

  const updateWeight = (idx: number, value: number) => {
    const next = deepClone(questions) as FinanceQuestion[];
    next[idx].weight = Math.max(0.5, Math.min(3.0, Number.isFinite(value) ? value : 1.0));
    setQuestions(next);
  };

  const addSkipCondition = (idx: number) => {
    const next = deepClone(questions) as (FinanceQuestion | VehicleQuestion)[];
    next[idx].skipIf.push({ qId: '', values: [] });
    setQuestions(next);
  };

  const removeSkipCondition = (qIdx: number, sIdx: number) => {
    const next = deepClone(questions) as (FinanceQuestion | VehicleQuestion)[];
    next[qIdx].skipIf.splice(sIdx, 1);
    setQuestions(next);
  };

  const updateSkipQId = (qIdx: number, sIdx: number, qId: string) => {
    const next = deepClone(questions) as (FinanceQuestion | VehicleQuestion)[];
    next[qIdx].skipIf[sIdx] = { qId, values: [] };
    setQuestions(next);
  };

  const toggleSkipValue = (qIdx: number, sIdx: number, value: string) => {
    const next = deepClone(questions) as (FinanceQuestion | VehicleQuestion)[];
    const values = next[qIdx].skipIf[sIdx].values;
    const i = values.indexOf(value);
    if (i >= 0) values.splice(i, 1);
    else values.push(value);
    setQuestions(next);
  };

  const addOption = (qIdx: number) => {
    const next = deepClone(questions) as (FinanceQuestion | VehicleQuestion)[];
    if (type === 'finance') {
      (next[qIdx] as FinanceQuestion).options.push({
        label: '새 선택지',
        value: `v_${Date.now()}`,
        scores: { installment: 0, lease: 0, rent: 0, cash: 0 },
        nextQ: '',
      });
      setQuestions(next);
      return;
    }
    (next[qIdx] as VehicleQuestion).options.push({
      label: '새 선택지',
      value: `v_${Date.now()}`,
      tags: [],
      nextQ: '',
    });
    setQuestions(next);
  };

  const deleteOption = (qIdx: number, oIdx: number) => {
    const next = deepClone(questions) as (FinanceQuestion | VehicleQuestion)[];
    if (next[qIdx].options.length <= 2) return;
    next[qIdx].options.splice(oIdx, 1);
    setQuestions(next);
  };

  const updateOptionField = (qIdx: number, oIdx: number, key: 'label' | 'nextQ' | 'value', value: string) => {
    if (type === 'finance') {
      const next = deepClone(questions) as FinanceQuestion[];
      const opt = next[qIdx].options[oIdx];
      if (key === 'label') opt.label = value;
      if (key === 'value') opt.value = value;
      if (key === 'nextQ') opt.nextQ = value;
      setQuestions(next);
      return;
    }
    const next = deepClone(questions) as VehicleQuestion[];
    const opt = next[qIdx].options[oIdx];
    if (key === 'label') opt.label = value;
    if (key === 'value') opt.value = value;
    if (key === 'nextQ') opt.nextQ = value;
    setQuestions(next);
  };

  const updateFinanceScore = (qIdx: number, oIdx: number, pk: ProductKey, value: number) => {
    const next = deepClone(questions) as FinanceQuestion[];
    const opt = next[qIdx].options[oIdx];
    opt.scores[pk] = Math.max(0, Math.min(5, Number.isFinite(value) ? value : 0));
    setQuestions(next);
  };

  const toggleVehicleTag = (qIdx: number, oIdx: number, tag: string) => {
    const next = deepClone(questions) as VehicleQuestion[];
    const tags = next[qIdx].options[oIdx].tags;
    const i = tags.indexOf(tag);
    if (i >= 0) tags.splice(i, 1);
    else tags.push(tag);
    setQuestions(next);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[18px] font-bold text-text">
          {label} ({questions.length}개)
        </span>
        <button
          type="button"
          onClick={addQuestion}
          className="bg-primary text-white rounded-[10px] px-4 py-2 text-sm font-semibold shadow-[0_4px_16px_rgba(0,122,255,0.25)]"
        >
          + 추가
        </button>
      </div>

      {questions.map((q, qi) => {
        const isOpen = openIdx === qi;
        const hasBranch = q.options.some((o) => Boolean(o.nextQ));
        return (
          <div
            key={q.id}
            className={`bg-white rounded-2xl overflow-hidden mb-[10px] border-2 ${
              isOpen ? 'border-primary' : 'border-transparent'
            }`}
          >
            <div
              className="px-5 py-[14px] flex items-center gap-3 cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => setOpenIdx(isOpen ? null : qi)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpenIdx(isOpen ? null : qi);
                }
              }}
            >
              <span className="text-xs font-bold text-text-sub min-w-[26px]">Q{qi + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-text">{q.question.replace('\n', ' ')}</div>
                <div className="text-[10px] text-text-muted mt-0.5 flex gap-2">
                  <span>{q.options.length}개</span>
                  {type === 'finance' && <span className="text-primary font-semibold">W{(q as FinanceQuestion).weight ?? 1.0}</span>}
                  {q.skipIf?.length > 0 && <span className="text-warning font-semibold">스킵{q.skipIf.length}</span>}
                  {hasBranch && <span className="text-[#5856D6] font-semibold">분기</span>}
                  <span>id: {q.id}</span>
                </div>
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => moveQuestion(qi, -1)}
                  className="bg-surface-secondary rounded-lg w-[30px] h-[30px] text-[13px]"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(qi, 1)}
                  className="bg-surface-secondary rounded-lg w-[30px] h-[30px] text-[13px]"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => deleteQuestion(qi)}
                  className="bg-[#FFF5F5] text-danger rounded-lg w-[30px] h-[30px] text-[13px]"
                >
                  ✕
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-[#F5F5F7]">
                <div className="pt-[14px] flex flex-col gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-sub mb-1">질문</label>
                    <textarea
                      value={q.question}
                      onChange={(e) => updateQuestionField(qi, 'question', e.target.value)}
                      className={`${ainp} px-[14px] py-[10px] text-sm text-text resize-y`}
                      style={{ height: 56 }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-sub mb-1">설명</label>
                    <input
                      value={q.subtitle}
                      onChange={(e) => updateQuestionField(qi, 'subtitle', e.target.value)}
                      className={`${ainp} px-[14px] py-[10px] text-sm text-text`}
                    />
                  </div>

                  {type === 'finance' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-text-sub mb-1">
                        가중치 <span className="text-text-muted font-normal">(0.5~3.0, 높을수록 결과에 큰 영향)</span>
                      </label>
                      <input
                        type="number"
                        step={0.5}
                        min={0.5}
                        max={3.0}
                        value={(q as FinanceQuestion).weight ?? 1.0}
                        onChange={(e) => updateWeight(qi, parseFloat(e.target.value))}
                        className={`${ainp} px-[14px] py-[10px] text-sm text-text w-28`}
                      />
                    </div>
                  )}

                  <div className="bg-[#FFFBF0] rounded-xl p-3 border border-[#FFE8B0]">
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] font-semibold text-warning">🔀 스킵 조건</span>
                      <button
                        type="button"
                        onClick={() => addSkipCondition(qi)}
                        className="bg-[#FFF5E0] text-warning rounded-[10px] px-2.5 py-1 text-[10px] font-semibold"
                      >
                        + 조건
                      </button>
                    </div>
                    {(!q.skipIf || q.skipIf.length === 0) ? (
                      <div className="text-[11px] text-text-muted">조건 없음</div>
                    ) : (
                      q.skipIf.map((c, si) => {
                        const refQ = allQuestionsForSkipRef.find((x) => x.id === c.qId) ?? null;
                        return (
                          <div key={`${q.id}-sk-${si}`} className="bg-white rounded-[10px] p-2.5 mb-2">
                            <div className="flex gap-2 items-center mb-2">
                              <select
                                value={c.qId}
                                onChange={(e) => updateSkipQId(qi, si, e.target.value)}
                                className={`${ainp} flex-1 px-2 py-1.5 text-xs`}
                              >
                                <option value="">질문 선택</option>
                                {allQuestionsForSkipRef.filter((x) => x.id !== q.id).map((x) => (
                                  <option key={x.id} value={x.id}>
                                    {x.question.replace('\n', ' ')}
                                  </option>
                                ))}
                              </select>
                              <button type="button" onClick={() => removeSkipCondition(qi, si)} className="text-danger text-sm px-2">
                                ✕
                              </button>
                            </div>
                            {refQ && (
                              <div className="flex flex-wrap gap-1">
                                {refQ.options.map((o) => {
                                  const active = c.values.includes(o.value);
                                  return (
                                    <button
                                      key={`${refQ.id}-${o.value}`}
                                      type="button"
                                      onClick={() => toggleSkipValue(qi, si, o.value)}
                                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                                        active ? 'bg-[#FF9500] text-white' : 'bg-surface-secondary text-text-sub'
                                      }`}
                                    >
                                      {o.label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-[11px] font-semibold text-text-sub">
                        선택지{type === 'finance' ? ' & 가중치' : ''} & 분기{type === 'vehicle' ? ' & 태그' : ''}
                      </label>
                      <button
                        type="button"
                        onClick={() => addOption(qi)}
                        className="bg-surface-secondary text-primary rounded-[10px] px-2.5 py-1.5 text-xs font-semibold"
                      >
                        +
                      </button>
                    </div>

                    {q.options.map((o, oi) => (
                      <div key={`${q.id}-opt-${oi}`} className="bg-[#FAFAFA] rounded-xl p-3 mb-2">
                        <div className="flex gap-2 items-center mb-2">
                          <input
                            value={o.label}
                            onChange={(e) => updateOptionField(qi, oi, 'label', e.target.value)}
                            className={`${ainp} flex-1 px-[14px] py-[10px] text-[13px]`}
                          />
                          {q.options.length > 2 && (
                            <button type="button" onClick={() => deleteOption(qi, oi)} className="text-danger text-sm font-semibold px-1">
                              ✕
                            </button>
                          )}
                        </div>

                        {type === 'finance' && (
                          <div className="grid grid-cols-4 gap-1.5 mb-2">
                            {PRODUCT_KEYS.map((pk) => (
                              <div key={pk} className="text-center">
                                <div className="text-[9px] font-semibold text-text-muted mb-1">{PRODUCT_LABELS[pk]}</div>
                                <input
                                  type="number"
                                  min={0}
                                  max={5}
                                  value={(o as FinanceOption).scores[pk]}
                                  onChange={(e) => updateFinanceScore(qi, oi, pk, Number(e.target.value))}
                                  className={`${ainp} px-1 py-1.5 text-sm font-bold text-center`}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {type === 'vehicle' && (
                          <div className="mb-2">
                            <div className="text-[10px] text-text-sub mb-1">태그:</div>
                            <div className="flex flex-wrap gap-1">
                              {ALL_VEHICLE_TAGS.map((t) => {
                                const active = (o as VehicleOption).tags.includes(t);
                                return (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => toggleVehicleTag(qi, oi, t)}
                                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                                      active ? 'bg-[#5856D6] text-white' : 'bg-[#F0F0F0] text-text-sub'
                                    }`}
                                  >
                                    {t}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#5856D6] font-semibold shrink-0">↳분기:</span>
                          <select
                            value={o.nextQ || ''}
                            onChange={(e) => updateOptionField(qi, oi, 'nextQ', e.target.value)}
                            className={`${ainp} flex-1 px-2 py-1.5 text-[11px] ${o.nextQ ? 'text-[#5856D6]' : 'text-text-muted'}`}
                          >
                            <option value="">기본 순서</option>
                            {allQuestionsForBranch.filter((x) => x.id !== q.id).map((x) => (
                              <option key={x.id} value={x.id}>
                                → {x.question.replace('\n', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProductsTab() {
  return null;
}

function VehiclesEditor({
  vehicles,
  setVehicles,
}: {
  vehicles: DiagnosisVehicle[];
  setVehicles: (next: DiagnosisVehicle[]) => void;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const ainp = 'bg-surface-secondary border border-border-solid rounded-[10px] outline-none w-full box-border px-[14px] py-[10px] text-sm text-text';

  const addVehicle = () => {
    const next: DiagnosisVehicle[] = [
      ...vehicles,
      { name: '새 차종', brand: '브랜드', class: '차급', price: 0, tags: [], img: '🚗' },
    ];
    setVehicles(next);
    setOpenIdx(next.length - 1);
  };

  const deleteVehicle = (idx: number) => {
    const next = [...vehicles];
    next.splice(idx, 1);
    setVehicles(next);
    setOpenIdx((cur) => (cur === idx ? null : cur != null && cur > idx ? cur - 1 : cur));
  };

  const moveVehicle = (idx: number, delta: -1 | 1) => {
    const n = idx + delta;
    if (n < 0 || n >= vehicles.length) return;
    const next = [...vehicles];
    [next[idx], next[n]] = [next[n], next[idx]];
    setVehicles(next);
    setOpenIdx((cur) => (cur === idx ? n : cur === n ? idx : cur));
  };

  const updateField = <K extends keyof DiagnosisVehicle>(idx: number, key: K, value: DiagnosisVehicle[K]) => {
    const next = deepClone(vehicles);
    next[idx][key] = value;
    setVehicles(next);
  };

  const toggleTag = (idx: number, tag: string) => {
    const next = deepClone(vehicles);
    const tags = next[idx].tags;
    const i = tags.indexOf(tag);
    if (i >= 0) tags.splice(i, 1);
    else tags.push(tag);
    setVehicles(next);
  };

  // monthly 필드 제거됨 — 가격은 calcMonthly(price)로 자동 계산

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[18px] font-bold text-text">차종 목록 ({vehicles.length}개)</span>
        <button
          type="button"
          onClick={addVehicle}
          className="bg-primary text-white rounded-[10px] px-4 py-2 text-sm font-semibold shadow-[0_4px_16px_rgba(0,122,255,0.25)]"
        >
          + 추가
        </button>
      </div>

      {vehicles.map((v, vi) => {
        const isOpen = openIdx === vi;
        return (
          <div
            key={`${v.name}-${vi}`}
            className={`bg-white rounded-2xl overflow-hidden mb-[10px] border-2 ${isOpen ? 'border-primary' : 'border-transparent'}`}
          >
            <div
              className="px-5 py-[14px] flex items-center gap-3 cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => setOpenIdx(isOpen ? null : vi)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenIdx(isOpen ? null : vi); }
              }}
            >
              <span className="text-xl shrink-0">{v.img}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-text">{v.brand} {v.name}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{v.class} · {v.price}만원~ · 렌트 {calcMonthly(v.price, 'rent')}만</div>
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => moveVehicle(vi, -1)} className="bg-surface-secondary rounded-lg w-[30px] h-[30px] text-[13px]">↑</button>
                <button type="button" onClick={() => moveVehicle(vi, 1)} className="bg-surface-secondary rounded-lg w-[30px] h-[30px] text-[13px]">↓</button>
                <button type="button" onClick={() => deleteVehicle(vi)} className="bg-[#FFF5F5] text-danger rounded-lg w-[30px] h-[30px] text-[13px]">✕</button>
              </div>
            </div>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-[#F5F5F7]">
                <div className="pt-4 flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-text-sub mb-1">이모지</label>
                      <input className={ainp} value={v.img} onChange={(e) => updateField(vi, 'img', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-text-sub mb-1">차종명</label>
                      <input className={ainp} value={v.name} onChange={(e) => updateField(vi, 'name', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-text-sub mb-1">브랜드</label>
                      <input className={ainp} value={v.brand} onChange={(e) => updateField(vi, 'brand', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-text-sub mb-1">차급</label>
                      <input className={ainp} value={v.class} onChange={(e) => updateField(vi, 'class', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-text-sub mb-1">기본가격 (만원)</label>
                      <input type="number" min={0} className={ainp} value={v.price} onChange={(e) => updateField(vi, 'price', Number(e.target.value))} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-sub mb-2">월 예상금 (자동 계산)</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PRODUCT_KEYS.map((key) => (
                        <div key={key} className="text-center py-1.5 rounded-lg bg-surface-secondary">
                          <div className="text-[9px] font-semibold text-text-muted mb-0.5">{DEFAULT_PRODUCTS[key].name}</div>
                          <div className="text-sm font-bold text-text">
                            {key === 'cash' ? '일시불' : `${calcMonthly(v.price, key)}만`}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-text-muted mt-1">기본가격 기준 48개월 · 연 2만km · 선납금 0%</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-sub mb-2">매칭 태그</label>
                    <div className="flex flex-wrap gap-1">
                      {ALL_VEHICLE_TAGS.map((tag) => {
                        const active = v.tags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(vi, tag)}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${active ? 'bg-[#5856D6] text-white' : 'bg-[#F0F0F0] text-text-sub'}`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const TIER_KEYS: RentFitTierKey[] = ['high', 'mid', 'low'];
const TIER_LABELS: Record<RentFitTierKey, string> = { high: '높음 (70%+)', mid: '보통 (40~69%)', low: '낮음 (~39%)' };
const TIER_COLORS: Record<RentFitTierKey, string> = { high: '#10B981', mid: '#F59E0B', low: '#8E8E93' };

function RentFitTierEditor({
  tiers,
  setTiers,
}: {
  tiers: Record<RentFitTierKey, RentFitTierData>;
  setTiers: (next: Record<RentFitTierKey, RentFitTierData>) => void;
}) {
  type TierTextField = 'emoji' | 'title' | 'message' | 'cta' | 'description';

  const updateField = (key: RentFitTierKey, field: TierTextField, value: string) => {
    const next = deepClone(tiers);
    next[key][field] = value;
    setTiers(next);
  };

  const fieldWrap = 'bg-white rounded-2xl p-5 mb-3';
  const labelCls = 'block text-[11px] font-semibold text-text-sub mb-1';
  const inpCls =
    'w-full bg-surface-secondary border border-border-solid rounded-[10px] px-[14px] py-[10px] text-sm text-text outline-none';
  const taCls =
    'w-full bg-surface-secondary border border-border-solid rounded-[10px] px-[14px] py-[10px] text-sm text-text outline-none resize-y';

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-sub">장기렌트 적합도 구간별 메시지를 편집합니다.</p>
      {TIER_KEYS.map((key) => {
        const t = tiers[key];
        return (
          <div key={key} className={fieldWrap}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: `${TIER_COLORS[key]}15` }}
              >
                {t.emoji}
              </div>
              <div>
                <div className="text-[16px] font-bold text-text">{TIER_LABELS[key]}</div>
                <div className="text-[11px] font-semibold" style={{ color: TIER_COLORS[key] }}>{t.title}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelCls}>이모지</label>
                <input className={inpCls} value={t.emoji} onChange={(e) => updateField(key, 'emoji', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>타이틀</label>
                <input className={inpCls} value={t.title} onChange={(e) => updateField(key, 'title', e.target.value)} />
              </div>
            </div>

            <div className="mb-3">
              <label className={labelCls}>메시지</label>
              <textarea className={taCls} rows={2} value={t.message} onChange={(e) => updateField(key, 'message', e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelCls}>CTA 버튼 텍스트</label>
                <input className={inpCls} value={t.cta} onChange={(e) => updateField(key, 'cta', e.target.value)} />
              </div>
            </div>

            <div className="mb-3">
              <label className={labelCls}>설명</label>
              <textarea className={taCls} rows={2} value={t.description} onChange={(e) => updateField(key, 'description', e.target.value)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProductsEditor({
  products,
  setProducts,
}: {
  products: Record<ProductKey, Product>;
  setProducts: (next: Record<ProductKey, Product>) => void;
}) {
  type ProductTextField =
    | 'name'
    | 'color'
    | 'lightBg'
    | 'emoji'
    | 'tagline'
    | 'description'
    | 'bestFor';

  const updateField = (key: ProductKey, field: ProductTextField, value: string) => {
    const next = deepClone(products);
    next[key][field] = value;
    setProducts(next);
  };

  const updateArray = (key: ProductKey, field: 'pros' | 'cons', idx: number, value: string) => {
    const next = deepClone(products);
    next[key][field][idx] = value;
    setProducts(next);
  };

  const addArrayItem = (key: ProductKey, field: 'pros' | 'cons') => {
    const next = deepClone(products);
    next[key][field].push('새 항목');
    setProducts(next);
  };

  const removeArrayItem = (key: ProductKey, field: 'pros' | 'cons', idx: number) => {
    const next = deepClone(products);
    next[key][field].splice(idx, 1);
    setProducts(next);
  };

  const iconBgByKey: Record<ProductKey, string> = {
    installment: 'bg-[rgba(0,122,255,0.08)]',
    lease: 'bg-[rgba(88,86,214,0.08)]',
    rent: 'bg-[rgba(52,199,89,0.08)]',
    cash: 'bg-[rgba(255,149,0,0.08)]',
  };
  const fieldWrap = 'bg-white rounded-2xl p-5 mb-3';
  const labelCls = 'block text-[11px] font-semibold text-text-sub mb-1';
  const inpCls =
    'w-full bg-surface-secondary border border-border-solid rounded-[10px] px-[14px] py-[10px] text-sm text-text outline-none';
  const taCls =
    'w-full bg-surface-secondary border border-border-solid rounded-[10px] px-[14px] py-[10px] text-sm text-text outline-none resize-y';

  return (
    <div className="flex flex-col gap-4">
      {PRODUCT_KEYS.map((key) => {
        const p = products[key];
        const iconBg = iconBgByKey[key];
        return (
          <div key={key} className={fieldWrap}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${iconBg}`}>
                {p.emoji}
              </div>
              <div className="text-[18px] font-bold text-text">{p.name}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelCls}>상품명</label>
                <input className={inpCls} value={p.name} onChange={(e) => updateField(key, 'name', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>태그라인</label>
                <input className={inpCls} value={p.tagline} onChange={(e) => updateField(key, 'tagline', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>이모지</label>
                <input className={inpCls} value={p.emoji} onChange={(e) => updateField(key, 'emoji', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>색상</label>
                <input className={inpCls} value={p.color} onChange={(e) => updateField(key, 'color', e.target.value)} />
              </div>
            </div>

            <div className="mb-3">
              <label className={labelCls}>설명</label>
              <textarea className={taCls} rows={3} value={p.description} onChange={(e) => updateField(key, 'description', e.target.value)} />
            </div>
            <div className="mb-3">
              <label className={labelCls}>추천 대상</label>
              <input className={inpCls} value={p.bestFor} onChange={(e) => updateField(key, 'bestFor', e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['pros', 'cons'] as const).map((field) => (
                <div key={field}>
                  <div className="flex justify-between mb-2">
                    <label className={`text-[11px] font-semibold ${field === 'pros' ? 'text-success' : 'text-danger'}`}>
                      {field === 'pros' ? '장점' : '유의사항'}
                    </label>
                    <button
                      type="button"
                      onClick={() => addArrayItem(key, field)}
                      className="bg-none text-primary text-xs font-semibold"
                    >
                      +
                    </button>
                  </div>
                  {p[field].map((item, idx) => (
                    <div key={`${key}-${field}-${idx}`} className="flex gap-2 mb-2">
                      <input className={`${inpCls} text-xs py-[6px] px-[10px]`} value={item} onChange={(e) => updateArray(key, field, idx, e.target.value)} />
                      <button type="button" onClick={() => removeArrayItem(key, field, idx)} className="text-danger text-sm px-2">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}


export default function DiagnosisAdminPage() {
  const [tab, setTab] = useState<Tab>('금융 간편');

  const [data, setData] = useState<DiagnosisData>(() => deepClone(buildDefaultData()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createBrowserSupabaseClient();
        const res = await supabase
          .from('diagnosis_config')
          .select('data')
          .eq('id', CONFIG_ID)
          .maybeSingle();

        if (res.error) {
          throw new Error(res.error.message);
        }

        const stored = (res.data?.data ?? null) as unknown;
        setData(normalizeDiagnosisData(stored));
      } catch (e) {
        setError(e instanceof Error ? e.message : '진단 설정을 불러오지 못했습니다.');
        setData(deepClone(buildDefaultData()));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const allFinanceQuestions = useMemo(
    () => [...data.finBasic, ...data.finDetail],
    [data.finBasic, data.finDetail]
  );
  const allVehicleQuestions = useMemo(
    () => [...data.vehBasic, ...data.vehDetail],
    [data.vehBasic, data.vehDetail]
  );

  const tabContent: Record<Tab, React.ReactNode> = useMemo(
    () => ({
      '금융 간편': (
        <QuestionEditor
          label="금융 간편"
          type="finance"
          questions={data.finBasic}
          setQuestions={(next) => setData((p) => ({ ...p, finBasic: next as FinanceQuestion[] }))}
          allQuestionsForBranch={allFinanceQuestions}
          allQuestionsForSkipRef={allFinanceQuestions}
        />
      ),
      '금융 상세': (
        <QuestionEditor
          label="금융 상세"
          type="finance"
          questions={data.finDetail}
          setQuestions={(next) => setData((p) => ({ ...p, finDetail: next as FinanceQuestion[] }))}
          allQuestionsForBranch={allFinanceQuestions}
          allQuestionsForSkipRef={allFinanceQuestions}
        />
      ),
      '차종 간편': (
        <QuestionEditor
          label="차종 간편"
          type="vehicle"
          questions={data.vehBasic}
          setQuestions={(next) => setData((p) => ({ ...p, vehBasic: next as VehicleQuestion[] }))}
          allQuestionsForBranch={allVehicleQuestions}
          allQuestionsForSkipRef={allVehicleQuestions}
        />
      ),
      '차종 상세': (
        <QuestionEditor
          label="차종 상세"
          type="vehicle"
          questions={data.vehDetail}
          setQuestions={(next) => setData((p) => ({ ...p, vehDetail: next as VehicleQuestion[] }))}
          allQuestionsForBranch={allVehicleQuestions}
          allQuestionsForSkipRef={allVehicleQuestions}
        />
      ),
      '렌트적합도': (
        <RentFitTierEditor
          tiers={data.rentFitTiers}
          setTiers={(next) => setData((p) => ({ ...p, rentFitTiers: next }))}
        />
      ),
      '차종결과': (
        <VehiclesEditor
          vehicles={data.vehicles ?? []}
          setVehicles={(next) => setData((p) => ({ ...p, vehicles: next }))}
        />
      ),
    }),
    [allFinanceQuestions, allVehicleQuestions, data]
  );

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const now = new Date().toISOString();
      const res = await supabase
        .from('diagnosis_config')
        .upsert({ id: CONFIG_ID, data, updated_at: now }, { onConflict: 'id' });
      if (res.error) throw new Error(res.error.message);
      setSavedTick((t) => t + 1);
      showToast('저장 완료', 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.');
      showToast(e instanceof Error ? e.message : '저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    const next = deepClone(buildDefaultData());
    setData(next);
    setResetConfirm(false);
    setTimeout(() => void save(), 0);
  };

  return (
    <div className="min-h-[100dvh] bg-surface-secondary">
      <div className="px-5 py-6 max-w-[700px] mx-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-text flex items-center gap-2">
              <span className="text-2xl">📊</span> 진단 관리
            </h1>
            <p className="text-sm text-text-sub mt-1">
              질문/선택지/스킵/분기/태그/상품/AI 설정을 수정하고 저장할 수 있습니다.
            </p>
            {error && <p className="text-sm text-danger font-semibold mt-2">{error}</p>}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setResetConfirm((v) => !v)}
              disabled={saving || loading}
              className="text-sm font-semibold text-text px-3 py-2 rounded-[10px] bg-surface-secondary disabled:opacity-60"
            >
              초기화
            </button>
            {resetConfirm ? (
              <button
                type="button"
                onClick={resetToDefault}
                disabled={saving || loading}
                className="text-sm font-semibold text-white px-3 py-2 rounded-[10px] bg-danger disabled:opacity-60"
              >
                확인
              </button>
            ) : (
              <button
                type="button"
                onClick={save}
                disabled={saving || loading}
                className="text-sm font-semibold text-white px-4 py-2 rounded-[10px] bg-primary shadow-[0_4px_16px_rgba(0,122,255,0.25)] disabled:opacity-60"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            )}
          </div>
        </div>

        <SectionCard>
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-text">설정 범위</p>
              <p className="text-xs text-text-sub">
                저장 id: <span className="font-mono">{CONFIG_ID}</span>
              </p>
            </div>
            <AdminTabBar tab={tab} setTab={setTab} />
          </div>
        </SectionCard>

        <div className="mt-4">
          <SectionCard>
            <div className="p-5">
              {loading ? (
                <div className="py-16 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                tabContent[tab]
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
