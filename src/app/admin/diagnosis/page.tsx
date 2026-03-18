'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { useToastStore } from '@/store/toastStore';
import { FINANCE_BASIC, FINANCE_DETAIL } from '@/data/diagnosis-finance';
import { ALL_VEHICLE_TAGS, DEFAULT_VEHICLE_BASIC, DEFAULT_VEHICLE_DETAIL } from '@/data/diagnosis-vehicle';
import { DEFAULT_PRODUCTS, PRODUCT_KEYS, PRODUCT_LABELS } from '@/data/diagnosis-products';
import { DEFAULT_AI_CONFIG, AI_MODELS } from '@/data/diagnosis-ai';
import type {
  AIConfig,
  DiagnosisData,
  FinanceOption,
  FinanceQuestion,
  Product,
  ProductKey,
  SkipCondition,
  VehicleOption,
  VehicleQuestion,
} from '@/types/diagnosis';

const CONFIG_ID = 'diagnosis_data_v1';

const TABS = ['금융 간편', '금융 상세', '차종 간편', '차종 상세', '상품', 'AI'] as const;
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
    aiConfig: DEFAULT_AI_CONFIG,
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

function normalizeDiagnosisData(input: unknown): DiagnosisData {
  const base = deepClone(buildDefaultData());
  if (!isRecord(input)) return base;

  const out: DiagnosisData = {
    finBasic:
      Array.isArray(input.finBasic) && (input.finBasic as unknown[]).length > 0
        ? (input.finBasic as FinanceQuestion[])
        : base.finBasic,
    finDetail:
      Array.isArray(input.finDetail) && (input.finDetail as unknown[]).length > 0
        ? (input.finDetail as FinanceQuestion[])
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
    aiConfig: isRecord(input.aiConfig)
      ? ({ ...base.aiConfig, ...(input.aiConfig as Partial<AIConfig>) } as AIConfig)
      : base.aiConfig,
  };

  // Ensure product keys exist
  (['installment', 'lease', 'rent', 'cash'] as const).forEach((k) => {
    out.products[k] = { ...base.products[k], ...(out.products[k] ?? {}) };
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
      ? 'bg-[#007AFF] text-white shadow-[0_4px_16px_rgba(0,122,255,0.25)]'
      : variant === 'danger'
        ? 'bg-[#FF3B30] text-white'
        : 'bg-[#F5F5F7] text-[#1D1D1F]';
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
      className="bg-[#F5F5F7] text-[#007AFF] rounded-[10px] px-2.5 py-1.5 text-xs font-semibold"
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
    { key: '상품', label: '상품' },
    { key: 'AI', label: 'AI' },
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
                ? 'bg-white text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
                : 'bg-transparent text-[#86868B]'
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

  const ainp = 'bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] outline-none w-full box-border';

  const addQuestion = () => {
    const id = `q_${Date.now()}`;
    if (type === 'finance') {
      const next: FinanceQuestion[] = [
        ...(questions as FinanceQuestion[]),
        {
          id,
          question: '새 질문',
          subtitle: '설명',
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
        <span className="text-[18px] font-bold text-[#1D1D1F]">
          {label} ({questions.length}개)
        </span>
        <button
          type="button"
          onClick={addQuestion}
          className="bg-[#007AFF] text-white rounded-[10px] px-4 py-2 text-sm font-semibold shadow-[0_4px_16px_rgba(0,122,255,0.25)]"
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
              isOpen ? 'border-[#007AFF]' : 'border-transparent'
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
              <span className="text-xs font-bold text-[#86868B] min-w-[26px]">Q{qi + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#1D1D1F]">{q.question.replace('\n', ' ')}</div>
                <div className="text-[10px] text-[#AEAEB2] mt-0.5 flex gap-2">
                  <span>{q.options.length}개</span>
                  {q.skipIf?.length > 0 && <span className="text-[#FF9500] font-semibold">스킵{q.skipIf.length}</span>}
                  {hasBranch && <span className="text-[#5856D6] font-semibold">분기</span>}
                  <span>id: {q.id}</span>
                </div>
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => moveQuestion(qi, -1)}
                  className="bg-[#F5F5F7] rounded-lg w-[30px] h-[30px] text-[13px]"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(qi, 1)}
                  className="bg-[#F5F5F7] rounded-lg w-[30px] h-[30px] text-[13px]"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => deleteQuestion(qi)}
                  className="bg-[#FFF5F5] text-[#FF3B30] rounded-lg w-[30px] h-[30px] text-[13px]"
                >
                  ✕
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-[#F5F5F7]">
                <div className="pt-[14px] flex flex-col gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#86868B] mb-1">질문</label>
                    <textarea
                      value={q.question}
                      onChange={(e) => updateQuestionField(qi, 'question', e.target.value)}
                      className={`${ainp} px-[14px] py-[10px] text-sm text-[#1D1D1F] resize-y`}
                      style={{ height: 56 }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#86868B] mb-1">설명</label>
                    <input
                      value={q.subtitle}
                      onChange={(e) => updateQuestionField(qi, 'subtitle', e.target.value)}
                      className={`${ainp} px-[14px] py-[10px] text-sm text-[#1D1D1F]`}
                    />
                  </div>

                  <div className="bg-[#FFFBF0] rounded-xl p-3 border border-[#FFE8B0]">
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] font-semibold text-[#FF9500]">🔀 스킵 조건</span>
                      <button
                        type="button"
                        onClick={() => addSkipCondition(qi)}
                        className="bg-[#FFF5E0] text-[#FF9500] rounded-[10px] px-2.5 py-1 text-[10px] font-semibold"
                      >
                        + 조건
                      </button>
                    </div>
                    {(!q.skipIf || q.skipIf.length === 0) ? (
                      <div className="text-[11px] text-[#AEAEB2]">조건 없음</div>
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
                              <button type="button" onClick={() => removeSkipCondition(qi, si)} className="text-[#FF3B30] text-sm px-2">
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
                                        active ? 'bg-[#FF9500] text-white' : 'bg-[#F5F5F7] text-[#86868B]'
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
                      <label className="text-[11px] font-semibold text-[#86868B]">
                        선택지{type === 'finance' ? ' & 가중치' : ''} & 분기{type === 'vehicle' ? ' & 태그' : ''}
                      </label>
                      <button
                        type="button"
                        onClick={() => addOption(qi)}
                        className="bg-[#F5F5F7] text-[#007AFF] rounded-[10px] px-2.5 py-1.5 text-xs font-semibold"
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
                            <button type="button" onClick={() => deleteOption(qi, oi)} className="text-[#FF3B30] text-sm font-semibold px-1">
                              ✕
                            </button>
                          )}
                        </div>

                        {type === 'finance' && (
                          <div className="grid grid-cols-4 gap-1.5 mb-2">
                            {PRODUCT_KEYS.map((pk) => (
                              <div key={pk} className="text-center">
                                <div className="text-[9px] font-semibold text-[#AEAEB2] mb-1">{PRODUCT_LABELS[pk]}</div>
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
                            <div className="text-[10px] text-[#86868B] mb-1">태그:</div>
                            <div className="flex flex-wrap gap-1">
                              {ALL_VEHICLE_TAGS.map((t) => {
                                const active = (o as VehicleOption).tags.includes(t);
                                return (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => toggleVehicleTag(qi, oi, t)}
                                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                                      active ? 'bg-[#5856D6] text-white' : 'bg-[#F0F0F0] text-[#86868B]'
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
                            className={`${ainp} flex-1 px-2 py-1.5 text-[11px] ${o.nextQ ? 'text-[#5856D6]' : 'text-[#AEAEB2]'}`}
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
  const labelCls = 'block text-[11px] font-semibold text-[#86868B] mb-1';
  const inpCls =
    'w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-[14px] py-[10px] text-sm text-[#1D1D1F] outline-none';
  const taCls =
    'w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-[14px] py-[10px] text-sm text-[#1D1D1F] outline-none resize-y';

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
              <div className="text-[18px] font-bold text-[#1D1D1F]">{p.name}</div>
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
                    <label className={`text-[11px] font-semibold ${field === 'pros' ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                      {field === 'pros' ? '장점' : '유의사항'}
                    </label>
                    <button
                      type="button"
                      onClick={() => addArrayItem(key, field)}
                      className="bg-none text-[#007AFF] text-xs font-semibold"
                    >
                      +
                    </button>
                  </div>
                  {p[field].map((item, idx) => (
                    <div key={`${key}-${field}-${idx}`} className="flex gap-2 mb-2">
                      <input className={`${inpCls} text-xs py-[6px] px-[10px]`} value={item} onChange={(e) => updateArray(key, field, idx, e.target.value)} />
                      <button type="button" onClick={() => removeArrayItem(key, field, idx)} className="text-[#FF3B30] text-sm px-2">
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

function AITab({
  cfg,
  setCfg,
}: {
  cfg: AIConfig;
  setCfg: (next: AIConfig) => void;
}) {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: '테스트: 할부 추천, 개인사업자, 36개월', config: cfg }),
      });
      const data = await res.json();
      setTestResult(data.comment);
    } catch {
      setTestResult('API 호출 실패');
    } finally {
      setTesting(false);
    }
  };

  const applyTone = (preset: { prompt: string }) => {
    setCfg({ ...cfg, promptTemplate: cfg.promptTemplate.replace(/^.*조언.*$/m, preset.prompt) });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Preview */}
      <div className="rounded-2xl p-5 text-white bg-[linear-gradient(135deg,#1D1D1F,#2C2C2E)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl bg-[#007AFF]">
            {cfg.charEmoji}
          </div>
          <div>
            <p className="text-sm font-bold">{cfg.charTitle}</p>
            <p className="text-xs text-white/60">{cfg.charSubtitle}</p>
          </div>
        </div>
        {testResult && <p className="mt-3 text-sm text-white/85">{testResult}</p>}
      </div>

      <div className="bg-white rounded-2xl p-5">
        <div className="text-sm font-bold text-[#1D1D1F] mb-4">캐릭터 기본 정보</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            { label: '캐릭터 이름', key: 'charName' as const },
            { label: '이모지', key: 'charEmoji' as const },
            { label: '표시 제목', key: 'charTitle' as const },
            { label: '부제', key: 'charSubtitle' as const },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-[11px] font-semibold text-[#86868B] mb-1">{label}</label>
              <input
                className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-[14px] py-[10px] text-sm text-[#1D1D1F] outline-none"
                value={cfg[key]}
                onChange={(e) => setCfg({ ...cfg, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#86868B] mb-1">아이콘 배경색</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={cfg.bgColor}
                onChange={(e) => setCfg({ ...cfg, bgColor: e.target.value })}
                className="w-10 h-9 rounded-lg cursor-pointer border border-[#E5E5EA]"
              />
              <input
                className="flex-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-[14px] py-[10px] text-sm text-[#1D1D1F] outline-none"
                value={cfg.bgColor}
                onChange={(e) => setCfg({ ...cfg, bgColor: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#86868B] mb-1">세션당 최대 호출</label>
            <input
              type="number"
              min={1}
              max={50}
              value={cfg.maxCalls}
              onChange={(e) => setCfg({ ...cfg, maxCalls: Math.max(1, Number(e.target.value) || 1) })}
              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-[14px] py-[10px] text-sm text-[#1D1D1F] outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5">
        <div className="text-sm font-bold text-[#1D1D1F] mb-3">AI 모델 선택</div>
        <div className="flex flex-col gap-2">
          {AI_MODELS.map((m) => {
            const active = cfg.model === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setCfg({ ...cfg, model: m.id })}
                className={`flex items-center gap-3 p-4 rounded-xl text-left ${active ? 'bg-[#007AFF] text-white' : 'bg-[#F5F5F7] text-[#1D1D1F]'}`}
              >
                <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center ${active ? 'bg-white' : 'border-2 border-[#D1D1D6]'}`}>
                  {active && <div className="w-2 h-2 rounded-full bg-[#007AFF]" />}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${active ? 'text-white' : 'text-[#1D1D1F]'}`}>
                    {m.name}
                    {m.badge && (
                      <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-[#007AFF1A] text-[#007AFF]'}`}>
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${active ? 'text-white/70' : 'text-[#86868B]'}`}>{m.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5">
        <div className="text-sm font-bold text-[#1D1D1F] mb-2">톤 프리셋</div>
        <div className="text-xs text-[#86868B] mb-3">클릭하면 프롬프트의 조언 스타일 라인이 변경됩니다</div>
        <div className="grid grid-cols-2 gap-2">
          {(cfg.tonePresets ?? []).map((tp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyTone(tp)}
              className="p-3 bg-[#F5F5F7] rounded-xl text-left"
            >
              <div className="text-[13px] font-semibold text-[#1D1D1F]">{tp.name}</div>
              <div className="text-[11px] text-[#86868B] mt-0.5">{tp.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-[#1D1D1F]">프롬프트 템플릿</div>
          <button
            type="button"
            onClick={() => setCfg({ ...cfg, promptTemplate: DEFAULT_AI_CONFIG.promptTemplate })}
            className="bg-[#F5F5F7] text-[#86868B] rounded-[10px] px-2.5 py-1.5 text-xs font-semibold"
          >
            기본값
          </button>
        </div>
        <div className="text-[11px] text-[#86868B] mb-2 leading-relaxed">
          사용 변수: <span className="font-mono bg-[#F0F0F5] px-1.5 py-0.5 rounded">{'{charName}'}</span>,{' '}
          <span className="font-mono bg-[#F0F0F5] px-1.5 py-0.5 rounded">{'{context}'}</span>
        </div>
        <textarea
          value={cfg.promptTemplate}
          onChange={(e) => setCfg({ ...cfg, promptTemplate: e.target.value })}
          className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-[14px] py-[10px] text-[13px] text-[#1D1D1F] outline-none font-mono leading-relaxed resize-y"
          rows={8}
        />
      </div>

      <div className="bg-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-[#1D1D1F]">폴백 메시지</div>
            <div className="text-[11px] text-[#86868B] mt-0.5">API 실패 또는 세션 한도 초과 시 표시됩니다</div>
          </div>
          <button
            type="button"
            onClick={() => setCfg({ ...cfg, fallbacks: [...cfg.fallbacks, ''] })}
            className="bg-[#F5F5F7] text-[#007AFF] rounded-[10px] px-2.5 py-1.5 text-xs font-semibold"
          >
            + 추가
          </button>
        </div>
        {cfg.fallbacks.map((fb, i) => (
          <div key={i} className="flex gap-2 items-start mb-2">
            <span className="text-xs text-[#AEAEB2] mt-2 min-w-5">{i + 1}</span>
            <textarea
              value={fb}
              onChange={(e) => {
                const next = [...cfg.fallbacks];
                next[i] = e.target.value;
                setCfg({ ...cfg, fallbacks: next });
              }}
              className="flex-1 bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-[14px] py-[10px] text-[13px] text-[#1D1D1F] outline-none resize-y"
              rows={2}
            />
            {cfg.fallbacks.length > 1 && (
              <button
                type="button"
                onClick={() => setCfg({ ...cfg, fallbacks: cfg.fallbacks.filter((_, j) => j !== i) })}
                className="text-[#FF3B30] text-sm font-semibold px-2 mt-2"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-[#1D1D1F]">테스트 실행</div>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className={`px-4 py-2 rounded-[10px] text-xs font-semibold ${
              testing ? 'bg-[#D1D1D6] text-white' : 'bg-[#007AFF] text-white'
            }`}
          >
            {testing ? '생성 중...' : '테스트 호출'}
          </button>
        </div>
        <div className="text-[11px] text-[#86868B] mb-2">샘플 데이터로 실제 API를 호출합니다</div>
        {testResult && (
          <div className="rounded-xl p-4 bg-[linear-gradient(135deg,#1D1D1F,#2C2C2E)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{cfg.charEmoji}</span>
              <span className="text-sm font-semibold text-white">{cfg.charName}</span>
            </div>
            <div className="text-sm text-white/85 leading-relaxed">{testResult}</div>
          </div>
        )}
      </div>
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
      상품: (
        <ProductsEditor
          products={data.products}
          setProducts={(next) => setData((p) => ({ ...p, products: next }))}
        />
      ),
      AI: <AITab cfg={data.aiConfig} setCfg={(next) => setData((p) => ({ ...p, aiConfig: next }))} />,
    }),
    [AI_MODELS, allFinanceQuestions, allVehicleQuestions, data]
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
    <div className="min-h-[100dvh] bg-[#F5F5F7]">
      <div className="px-5 py-6 max-w-[700px] mx-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-[#1D1D1F] flex items-center gap-2">
              <span className="text-2xl">📊</span> 진단 관리
            </h1>
            <p className="text-sm text-[#86868B] mt-1">
              질문/선택지/스킵/분기/태그/상품/AI 설정을 수정하고 저장할 수 있습니다.
            </p>
            {error && <p className="text-sm text-[#FF3B30] font-semibold mt-2">{error}</p>}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setResetConfirm((v) => !v)}
              disabled={saving || loading}
              className="text-sm font-semibold text-[#1D1D1F] px-3 py-2 rounded-[10px] bg-[#F5F5F7] disabled:opacity-60"
            >
              초기화
            </button>
            {resetConfirm ? (
              <button
                type="button"
                onClick={resetToDefault}
                disabled={saving || loading}
                className="text-sm font-semibold text-white px-3 py-2 rounded-[10px] bg-[#FF3B30] disabled:opacity-60"
              >
                확인
              </button>
            ) : (
              <button
                type="button"
                onClick={save}
                disabled={saving || loading}
                className="text-sm font-semibold text-white px-4 py-2 rounded-[10px] bg-[#007AFF] shadow-[0_4px_16px_rgba(0,122,255,0.25)] disabled:opacity-60"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            )}
          </div>
        </div>

        <SectionCard>
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#1D1D1F]">설정 범위</p>
              <p className="text-xs text-[#86868B]">
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
                  <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
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
