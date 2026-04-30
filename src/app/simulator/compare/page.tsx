'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateComparison, type ComparisonInputs } from '@/lib/domain/comparison-engine';
import { scoreDecision, type DecisionResult, type ScoredMethod } from '@/lib/domain/decision-scorer';
import { getVehicleCC } from '@/lib/domain/vehicle-cc-map';
import type { YearPrices } from '@/lib/domain/depreciation-calculator';
import type { CustomerType, InsuranceHistory, PlatePreference, ContractEndOption } from '@/lib/domain/decision-scorer';
import type { Industry, RevenueRange } from '@/lib/domain/tax-calculator';
import type { AcquisitionVehicleType } from '@/lib/domain/acquisition-tax-calculator';

// ── 타입 ──────────────────────────────────────────────────────────────

type Phase = 'group1' | 'group2' | 'group3' | 'result';

interface TrimOption { name: string; msrp: number; fuelType: string }

interface FormState {
  // Group 1
  customerType:      CustomerType;
  industry:          Industry;
  insuranceHistory:  InsuranceHistory;
  platePreference:   PlatePreference;
  // Group 2
  brand:             string;
  model:             string;
  trimName:          string;
  carPriceMk:        string;       // 숫자 문자열 (만원)
  carPriceMkAuto:    number;       // DB에서 자동 채운 값
  vehicleAge:        number;       // 0=신차, 1, 2, 3, 4
  isEV:              boolean;
  isHEV:             boolean;
  // Group 3
  ownershipYears:    number;       // 1-7
  annualKm:          number;       // 12000 / 24000 / 36000 / 42000
  insuranceAnnual:   string;       // 숫자 문자열 (원)
  insuranceAutoFill: number;       // Group 1에서 자동 채운 값 (원)
  businessUseRatio:  number;       // 0-100 (%)
  contractEndOption: ContractEndOption;
}

// ── 상수 ──────────────────────────────────────────────────────────────

const INSURANCE_PRESETS: Record<InsuranceHistory, { label: string; amount: number }> = {
  none:       { label: '처음 (경력 없음)', amount: 1_800_000 },
  under1y:    { label: '1년 미만',         amount: 1_400_000 },
  '1-3y':     { label: '1 ~ 3년',          amount: 1_100_000 },
  '3y+normal':{ label: '3년+ 일반',         amount:   850_000 },
  '3y+good':  { label: '3년+ 우수',         amount:   650_000 },
};

const DEFAULT_INDUSTRY_RATIO: Record<Industry, number> = {
  construction: 90, retail: 85, food: 70, service: 60, freelance: 65,
};

const DEFAULT_REVENUE: Record<'corporation' | 'individual', RevenueRange> = {
  corporation: '1eok-3eok',
  individual:  '5k-1eok',
};

const INITIAL_FORM: FormState = {
  customerType: 'employee', industry: 'service',
  insuranceHistory: '3y+normal', platePreference: 'any',
  brand: '', model: '', trimName: '', carPriceMk: '', carPriceMkAuto: 0,
  vehicleAge: 0, isEV: false, isHEV: false,
  ownershipYears: 4, annualKm: 20_000,
  insuranceAnnual: '', insuranceAutoFill: 850_000,
  businessUseRatio: 0, contractEndOption: 'return',
};

const METHOD_COLORS = {
  rent:        { accent: '#3b82f6', bg: '#0c1424', border: '#1e3a5f' },
  lease:       { accent: '#8b5cf6', bg: '#130c24', border: '#3b1f5f' },
  installment: { accent: '#22c55e', bg: '#0c1a0c', border: '#1a4a1a' },
};
const RANK_BADGE = ['🥇 1위 추천', '🥈 2위', '🥉 3위'];

// ── 유틸 ──────────────────────────────────────────────────────────────

function fmtMk(won: number): string {
  const mk = Math.round(won / 10_000);
  if (mk >= 10_000) return `${(mk / 10_000).toFixed(1)}억원`;
  return `${mk.toLocaleString()}만원`;
}

function fmtMkShort(won: number): string {
  return `${Math.round(won / 10_000).toLocaleString()}만원`;
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────

function Chip({
  selected, onClick, children, disabled,
}: {
  selected: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-150',
        disabled ? 'opacity-40 cursor-not-allowed border-[#2a2a3e] text-slate-600' :
        selected
          ? 'border-red-500 bg-red-500/15 text-red-300 ring-1 ring-red-500/40'
          : 'border-[#2a2a3e] bg-[#0e0e20] text-slate-400 hover:border-[#3a3a5e] hover:text-slate-300',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-300 text-sm font-semibold mb-2">{children}</p>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-500 text-xs mt-1">{children}</p>;
}

function SelectStyled({
  value, onChange, disabled, children, loading,
}: {
  value: string; onChange: (v: string) => void; disabled?: boolean;
  children: React.ReactNode; loading?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className="w-full px-4 py-3 rounded-xl border border-[#2a2a3e] bg-[#0e0e20] text-white text-sm appearance-none focus:outline-none focus:border-red-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
        {loading ? '⟳' : '▾'}
      </span>
    </div>
  );
}

function NumberInput({
  value, onChange, placeholder, unit, note,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; unit?: string; note?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 rounded-xl border border-[#2a2a3e] bg-[#0e0e20] text-white text-sm focus:outline-none focus:border-red-500/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {unit && <span className="text-slate-400 text-sm shrink-0">{unit}</span>}
      </div>
      {note && <p className="text-slate-500 text-xs mt-1">{note}</p>}
    </div>
  );
}

// ── 결과 카드 ─────────────────────────────────────────────────────────

function ResultCard({
  scored,
  ownershipYears,
  rentalMarket,
}: {
  scored: ScoredMethod;
  ownershipYears: number;
  rentalMarket?: { monthlyPrice: number; source: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const { method, label, rank, excluded, excludeReason, keyReasons, result } = scored;
  const c = METHOD_COLORS[method];
  const bd = result.breakdown;
  const isBest = rank === 1 && !excluded;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: c.bg, borderColor: isBest ? c.accent + '80' : c.border }}
    >
      {/* 헤더 */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold" style={{ color: c.accent }}>
            {RANK_BADGE[rank - 1]}
          </span>
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ color: c.accent, backgroundColor: c.accent + '20' }}
          >
            {label}
          </span>
        </div>

        {excluded ? (
          <div className="text-slate-500 text-sm py-2">{excludeReason}</div>
        ) : (
          <>
            <div className="flex items-end gap-4 mb-4">
              <div>
                <p className="text-slate-400 text-xs mb-0.5">월 납입</p>
                <p className="text-white text-2xl font-bold">{fmtMkShort(result.monthlyPayment)}</p>
              </div>
              <div className="flex-1 text-right">
                <p className="text-slate-400 text-xs mb-0.5">{ownershipYears}년 총비용</p>
                <p className="text-xl font-semibold" style={{ color: c.accent }}>
                  {fmtMk(result.totalCostLow)} ~ {fmtMk(result.totalCostHigh)}
                </p>
              </div>
            </div>

            {/* 핵심 이유 */}
            <div className="flex flex-col gap-1.5 mb-3">
              {keyReasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs mt-0.5" style={{ color: c.accent }}>✓</span>
                  <span className="text-slate-300 text-xs leading-relaxed">{r}</span>
                </div>
              ))}
            </div>

            {/* 절세효과 */}
            {result.annualTaxSaving > 100_000 && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-yellow-300 text-xs font-medium">
                  💡 절세 효과 연 {fmtMkShort(result.annualTaxSaving)} 별도
                </p>
              </div>
            )}

            {/* 렌탈료 시장가 참고 */}
            {method === 'rent' && rentalMarket && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-blue-300 text-xs">
                  📊 시장 참고가 {Math.round(rentalMarket.monthlyPrice / 10_000)}만원/월
                  <span className="text-blue-500 ml-1">({rentalMarket.source} · 48개월)</span>
                </p>
              </div>
            )}

            {/* 계산 근거 토글 */}
            <button
              type="button"
              onClick={() => setOpen((p) => !p)}
              className="mt-3 text-slate-500 text-xs hover:text-slate-300 transition-colors"
            >
              계산 근거 {open ? '▲ 닫기' : '▼ 보기'}
            </button>

            {open && (
              <div className="mt-2 pt-3 border-t border-white/5 space-y-1.5">
                {[
                  ['납입금 합계', bd.payments],
                  ['취등록세', bd.initialCost],
                  ['자동차세', bd.autoTax],
                  ['보험료', bd.insurance],
                  ['정비비', bd.maintenance],
                ].map(([lbl, val]) =>
                  (val as number) > 0 ? (
                    <div key={lbl as string} className="flex justify-between text-xs">
                      <span className="text-slate-500">{lbl as string}</span>
                      <span className="text-slate-300">{fmtMk(val as number)}</span>
                    </div>
                  ) : null,
                )}
                {bd.salvageValue > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">중고 매각가 (차감)</span>
                    <span className="text-green-400">−{fmtMk(bd.salvageValue)}</span>
                  </div>
                )}
                {method === 'rent' && (
                  <p className="text-slate-600 text-xs pt-1">
                    * 보험·정비·세금이 납입금에 포함됨
                  </p>
                )}
                <div className="flex justify-between text-xs pt-1.5 border-t border-white/5 font-semibold">
                  <span className="text-slate-400">추정 총비용</span>
                  <span style={{ color: c.accent }}>{fmtMk(result.totalCostMid)}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 다이렉트 링크 */}
      {!excluded && rank === 1 && (
        <div className="px-5 pb-4 flex gap-2 flex-wrap">
          {method === 'rent' && (
            <>
              <a href="https://www.skrentacar.com" target="_blank" rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-colors">
                SK렌터카 →
              </a>
              <a href="https://www.lotterentacar.net" target="_blank" rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-colors">
                롯데렌터카 →
              </a>
            </>
          )}
          {method === 'lease' && (
            <a href="https://www.kbcapital.co.kr" target="_blank" rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-colors">
              KB캐피탈 →
            </a>
          )}
          {method === 'installment' && (
            <a href="https://www.hyundaicapital.com" target="_blank" rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-colors">
              현대캐피탈 →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareInner />
    </Suspense>
  );
}

function CompareInner() {
  const searchParams = useSearchParams();
  const [phase, setPhase]     = useState<Phase>('group1');
  const [dir, setDir]         = useState(1);   // 1: 앞으로, -1: 뒤로
  const [form, setForm]       = useState<FormState>(() => {
    const init = { ...INITIAL_FORM };
    // URL 파라미터로 Group 2 자동 채움 (차량 상세 deep-link)
    const brand = searchParams.get('brand');
    const model = searchParams.get('model');
    if (brand) init.brand = brand;
    if (model) init.model = model;
    return init;
  });

  // 드롭다운 데이터
  const [brands, setBrands]   = useState<string[]>([]);
  const [models, setModels]   = useState<string[]>([]);
  const [trims, setTrims]     = useState<TrimOption[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingTrims, setLoadingTrims]   = useState(false);

  // 결과
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [cmpResult, setCmpResult] = useState<ReturnType<typeof calculateComparison> | null>(null);
  const [assumptions, setAssumptions] = useState<string[]>([]);

  // 중고시세 (used-prices API)
  const [usedPrices, setUsedPrices] = useState<{
    prices: Record<number, YearPrices>;
    latestWeek: string | null;
  } | null>(null);
  const [dataWeek, setDataWeek] = useState<string | null>(null);

  // 렌탈료 시장가 (rental-price API)
  const [rentalMarket, setRentalMarket] = useState<{
    monthlyPrice: number;
    source: string;
  } | null>(null);

  // 리드폼
  const [leadData, setLeadData]     = useState({ name: '', phone: '' });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError]   = useState<string | null>(null);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);

  // ── 브랜드 로드 ─────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingBrands(true);
    fetch('/api/vehicle-msrp/brands')
      .then((r) => r.json())
      .then((d: { brands?: string[] }) => setBrands(d.brands ?? []))
      .catch(() => setBrands([]))
      .finally(() => setLoadingBrands(false));
  }, []);

  // ── 중고시세 + 렌탈료 시장가 로드 (브랜드·모델 변경 시) ──────────────
  useEffect(() => {
    if (!form.brand || !form.model || form.brand === '__manual__') {
      setUsedPrices(null);
      setRentalMarket(null);
      return;
    }
    const ctrl = new AbortController();

    fetch(
      `/api/used-prices?brand=${encodeURIComponent(form.brand)}&model=${encodeURIComponent(form.model)}`,
      { signal: ctrl.signal },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { status?: string; prices?: Record<number, YearPrices>; latestWeek?: string } | null) => {
        if (d?.status === 'ok' && d.prices) {
          setUsedPrices({ prices: d.prices, latestWeek: d.latestWeek ?? null });
        } else {
          setUsedPrices(null);
        }
      })
      .catch(() => setUsedPrices(null));

    fetch('/api/rental-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand: form.brand, model: form.model, contractMonths: 48, annualKm: 20000 }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { status?: string; data?: Array<{ monthly_price: number; source?: string }> } | null) => {
        if (d?.status === 'ok' && d.data?.[0]) {
          setRentalMarket({
            monthlyPrice: d.data[0].monthly_price,
            source: d.data[0].source ?? 'DB',
          });
        } else {
          setRentalMarket(null);
        }
      })
      .catch(() => setRentalMarket(null));

    return () => ctrl.abort();
  }, [form.brand, form.model]);

  // ── 모델 로드 ─────────────────────────────────────────────────────
  const loadModels = useCallback(async (brand: string) => {
    if (!brand) { setModels([]); return; }
    setLoadingModels(true);
    setModels([]);
    setTrims([]);
    setForm((f) => ({ ...f, model: '', trimName: '', carPriceMk: '', carPriceMkAuto: 0 }));
    try {
      const r  = await fetch(`/api/vehicle-msrp/models?brand=${encodeURIComponent(brand)}`);
      const d  = await r.json() as { models?: string[] };
      setModels(d.models ?? []);
    } catch { setModels([]); }
    finally { setLoadingModels(false); }
  }, []);

  // ── 트림 로드 ─────────────────────────────────────────────────────
  const loadTrims = useCallback(async (brand: string, model: string) => {
    if (!brand || !model) { setTrims([]); return; }
    setLoadingTrims(true);
    setTrims([]);
    setForm((f) => ({ ...f, trimName: '', carPriceMk: '', carPriceMkAuto: 0 }));
    try {
      const r   = await fetch(`/api/vehicle-msrp?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`);
      const d   = await r.json() as { trims?: Array<{ trim_name: string; msrp_price: number; fuel_type: string }> };
      const ts  = (d.trims ?? []).map((t) => ({ name: t.trim_name, msrp: t.msrp_price, fuelType: t.fuel_type }));
      setTrims(ts);
    } catch { setTrims([]); }
    finally { setLoadingTrims(false); }
  }, []);

  // 트림 선택 시 MSRP + 연료 자동 채움
  function onTrimSelect(trimName: string) {
    const t = trims.find((x) => x.name === trimName);
    if (!t) { setForm((f) => ({ ...f, trimName })); return; }
    const isEV  = ['electric', 'ev', 'bev'].includes(t.fuelType.toLowerCase());
    const isHEV = ['hybrid', 'hev', 'phev'].includes(t.fuelType.toLowerCase());
    setForm((f) => ({
      ...f,
      trimName,
      carPriceMkAuto: t.msrp,
      carPriceMk: String(t.msrp),
      isEV,
      isHEV,
    }));
  }

  // Group 1 → Group 2 이동 시 보험료 자동 채움
  function goGroup2() {
    const preset = INSURANCE_PRESETS[form.insuranceHistory].amount;
    const biz = form.customerType === 'corporation' || form.customerType === 'individual';
    const ratio = biz ? (DEFAULT_INDUSTRY_RATIO[form.industry] ?? 60) : 0;
    setForm((f) => ({
      ...f,
      insuranceAutoFill: preset,
      insuranceAnnual: String(preset),
      businessUseRatio: ratio,
    }));
    setDir(1); setPhase('group2');
  }

  // 계산 실행
  function runCalculation() {
    const carPriceMk = Number(form.carPriceMk);
    if (!carPriceMk || carPriceMk <= 0) return;

    const cc = getVehicleCC(form.model) ?? 1998;
    const isBusiness = form.customerType === 'corporation' || form.customerType === 'individual';
    const businessType = isBusiness
      ? (form.customerType as 'corporation' | 'individual')
      : 'none';

    const inputs: ComparisonInputs = {
      carPriceMk,
      modelName:              form.model,
      vehicleAge:             form.vehicleAge,
      isEV:                   form.isEV,
      isHEV:                  form.isHEV,
      acquisitionVehicleType: '승용' as AcquisitionVehicleType,
      cc,
      ownershipYears:         form.ownershipYears,
      annualKm:               form.annualKm,
      insuranceAnnual:        Number(form.insuranceAnnual) || form.insuranceAutoFill,
      businessType,
      industry:               form.industry,
      revenueRange:           isBusiness ? DEFAULT_REVENUE[form.customerType as 'corporation' | 'individual'] : '5k-1eok',
      businessUseRatio:       form.businessUseRatio / 100,
    };

    const cmp = calculateComparison(inputs, usedPrices?.prices);
    const dec = scoreDecision({
      customerType:      form.customerType,
      insuranceHistory:  form.insuranceHistory,
      ownershipYears:    form.ownershipYears,
      platePreference:   form.platePreference,
      contractEndOption: form.contractEndOption,
      businessUseRatio:  form.businessUseRatio / 100,
      comparison:        cmp,
    });

    setCmpResult(cmp);
    setDecision(dec);
    setAssumptions(cmp.assumptions);
    setDataWeek(usedPrices?.latestWeek ?? null);
    setDir(1);
    setPhase('result');
  }

  // 리드폼 제출
  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!decision || !cmpResult) return;
    setLeadSubmitting(true);
    setLeadError(null);

    const top = cmpResult[decision.topMethod];
    const summary = [
      `[비교시뮬레이터] ${displayBrand} ${form.model} ${form.carPriceMk}만원`,
      `추천: ${decision.topMethod} / 월 ${Math.round(top.monthlyPayment / 10_000)}만원`,
      `총비용 ${Math.round(top.totalCostMid / 10_000)}만원 (${form.ownershipYears}년)`,
      `고객유형: ${form.customerType} / 보험: ${form.insuranceHistory}`,
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
          financeSummary: summary,
          stepCompleted:  6,
        }),
      });
      if (!res.ok) throw new Error('API 오류');
      setLeadSubmitted(true);
    } catch {
      setLeadError('잠시 후 다시 시도해주세요.');
    } finally {
      setLeadSubmitting(false);
    }
  }

  // __manual__ 브랜드는 UI/DB에서 "직접입력"으로 표시
  const displayBrand = form.brand === '__manual__' ? '직접입력' : form.brand;

  // ── 유효성 ────────────────────────────────────────────────────────
  const g1Valid = !!form.customerType && !!form.insuranceHistory && !!form.platePreference;
  const g2Valid = !!form.model && Number(form.carPriceMk) > 0 && form.vehicleAge >= 0;
  const g3Valid = form.ownershipYears > 0 && form.annualKm > 0 && (Number(form.insuranceAnnual) > 0 || form.insuranceAutoFill > 0);

  // ── 애니메이션 ────────────────────────────────────────────────────
  const variants = {
    enter:  (d: number) => ({ x: d > 0 ?  40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? -40 :  40, opacity: 0 }),
  };

  const progress = phase === 'group1' ? 1 : phase === 'group2' ? 2 : phase === 'group3' ? 3 : 3;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0c0c1d 0%, #1a1a2e 60%, #0c0c1d 100%)' }}
    >
      <div className="max-w-[520px] mx-auto px-4 py-10">

        {/* 헤더 */}
        {phase !== 'result' && (
          <div className="mb-8">
            <p className="text-slate-500 text-xs font-medium tracking-widest uppercase mb-2">
              RENTAILOR
            </p>
            <h1 className="text-white text-2xl font-bold mb-1">결제방식 비교</h1>
            <p className="text-slate-400 text-sm">할부 · 리스 · 렌트 총비용을 한눈에</p>

            {/* 진행 바 */}
            <div className="flex gap-1.5 mt-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{ backgroundColor: n <= progress ? '#ef4444' : '#2a2a3e' }}
                />
              ))}
            </div>
            <p className="text-slate-600 text-xs mt-1.5">
              {progress === 1 ? '1/3 — 고객 정보' : progress === 2 ? '2/3 — 차량 정보' : '3/3 — 사용 패턴'}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait" custom={dir}>
          {/* ═══ GROUP 1 — 나는 누구? ═══════════════════════════════════ */}
          {phase === 'group1' && (
            <motion.div
              key="g1"
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {/* 고객 유형 */}
              <div>
                <Label>어떤 고객이신가요?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([ ['corporation','💼 법인 사업자'],['individual','🏪 개인 사업자'],['employee','🧑‍💼 직장인'],['other','👤 기타'] ] as [CustomerType, string][]).map(([v, l]) => (
                    <Chip key={v} selected={form.customerType === v} onClick={() => setForm((f) => ({ ...f, customerType: v, businessUseRatio: 0 }))}>
                      {l}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* 업종 (사업자만) */}
              {(form.customerType === 'corporation' || form.customerType === 'individual') && (
                <div>
                  <Label>주요 업종</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([ ['service','서비스업'],['retail','도소매업'],['construction','건설업'],['food','음식업'],['freelance','프리랜서'] ] as [Industry, string][]).map(([v, l]) => (
                      <Chip key={v} selected={form.industry === v} onClick={() => setForm((f) => ({ ...f, industry: v }))}>
                        {l}
                      </Chip>
                    ))}
                  </div>
                  <Hint>업종별 업무사용비율: {DEFAULT_INDUSTRY_RATIO[form.industry]}%</Hint>
                </div>
              )}

              {/* 보험 경력 */}
              <div>
                <Label>자동차 보험 경력</Label>
                <div className="flex flex-col gap-2">
                  {(Object.entries(INSURANCE_PRESETS) as [InsuranceHistory, typeof INSURANCE_PRESETS[InsuranceHistory]][]).map(([v, { label, amount }]) => (
                    <Chip key={v} selected={form.insuranceHistory === v} onClick={() => setForm((f) => ({ ...f, insuranceHistory: v }))}>
                      <span className="flex justify-between w-full">
                        <span>{label}</span>
                        <span className="text-slate-500 text-xs">(보험료 추산 연 {Math.round(amount / 10_000)}만원)</span>
                      </span>
                    </Chip>
                  ))}
                </div>
                {form.insuranceHistory === 'none' && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-blue-300 text-xs">💡 보험 경력 없음 → 렌트 선택 시 보험료 부담 없음</p>
                  </div>
                )}
              </div>

              {/* 번호판 선호 */}
              <div>
                <Label>번호판 선호</Label>
                <div className="flex gap-2">
                  <Chip selected={form.platePreference === 'any'} onClick={() => setForm((f) => ({ ...f, platePreference: 'any' }))}>
                    🚗 무관 (렌트·리스·할부 모두)
                  </Chip>
                  <Chip selected={form.platePreference === 'standard'} onClick={() => setForm((f) => ({ ...f, platePreference: 'standard' }))}>
                    📋 일반 번호판 필수
                  </Chip>
                </div>
                {form.platePreference === 'standard' && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-orange-300 text-xs">⚠️ 렌트는 영업용(하/허/호) 번호판이 발급됩니다</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={goGroup2}
                disabled={!g1Valid}
                className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                다음 — 차량 정보 →
              </button>
            </motion.div>
          )}

          {/* ═══ GROUP 2 — 어떤 차? ═══════════════════════════════════ */}
          {phase === 'group2' && (
            <motion.div
              key="g2"
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {/* 브랜드 */}
              <div>
                <Label>브랜드</Label>
                <SelectStyled
                  value={form.brand}
                  onChange={(v) => { setForm((f) => ({ ...f, brand: v })); loadModels(v); }}
                  loading={loadingBrands}
                >
                  <option value="">브랜드 선택</option>
                  {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                  <option value="__manual__">직접 입력 (목록에 없음)</option>
                </SelectStyled>
              </div>

              {/* 모델 */}
              <div>
                <Label>모델</Label>
                {form.brand === '__manual__' ? (
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                    placeholder="모델명 입력 (예: K5)"
                    className="w-full px-4 py-3 rounded-xl border border-[#2a2a3e] bg-[#0e0e20] text-white text-sm focus:outline-none focus:border-red-500/60"
                  />
                ) : (
                  <SelectStyled
                    value={form.model}
                    onChange={(v) => { setForm((f) => ({ ...f, model: v })); loadTrims(form.brand, v); }}
                    disabled={!form.brand}
                    loading={loadingModels}
                  >
                    <option value="">모델 선택</option>
                    {models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </SelectStyled>
                )}
              </div>

              {/* 트림 */}
              {form.brand !== '__manual__' && (
                <div>
                  <Label>트림 <span className="text-slate-500 font-normal text-xs">(선택, 신차가 자동 채움)</span></Label>
                  <SelectStyled
                    value={form.trimName}
                    onChange={onTrimSelect}
                    disabled={!form.model}
                    loading={loadingTrims}
                  >
                    <option value="">트림 선택 (생략 가능)</option>
                    {trims.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} — {t.msrp.toLocaleString()}만원
                      </option>
                    ))}
                  </SelectStyled>
                </div>
              )}

              {/* 차량 가격 */}
              <div>
                <Label>차량 가격</Label>
                <div className="flex flex-col gap-2 mb-2">
                  <div className="flex flex-wrap gap-2">
                    {[1500,2500,3500,5000,7000].map((v) => (
                      <Chip key={v} selected={Number(form.carPriceMk) === v}
                        onClick={() => setForm((f) => ({ ...f, carPriceMk: String(v) }))}>
                        {v.toLocaleString()}만원
                      </Chip>
                    ))}
                  </div>
                </div>
                <NumberInput
                  value={form.carPriceMk}
                  onChange={(v) => setForm((f) => ({ ...f, carPriceMk: v }))}
                  placeholder="직접 입력"
                  unit="만원"
                  note={form.carPriceMkAuto > 0 && Number(form.carPriceMk) !== form.carPriceMkAuto
                    ? `DB 신차가: ${form.carPriceMkAuto.toLocaleString()}만원`
                    : form.carPriceMkAuto > 0 ? `트림 기준 신차가 자동 채움` : undefined}
                />
                {form.carPriceMkAuto > 0 && Number(form.carPriceMk) !== form.carPriceMkAuto && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, carPriceMk: String(f.carPriceMkAuto) }))}
                    className="text-xs text-red-400 hover:text-red-300 mt-1">
                    기본값 복원 ({form.carPriceMkAuto.toLocaleString()}만원)
                  </button>
                )}
              </div>

              {/* 차령 */}
              <div>
                <Label>차령 (현재)</Label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { v: 0, l: '신차' }, { v: 1, l: '1년' },
                    { v: 2, l: '2년' }, { v: 3, l: '3년' }, { v: 4, l: '4년+' },
                  ].map(({ v, l }) => (
                    <Chip key={v} selected={form.vehicleAge === v} onClick={() => setForm((f) => ({ ...f, vehicleAge: v }))}>
                      {l}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* EV/HEV 감지 표시 */}
              {(form.isEV || form.isHEV) && (
                <div className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-green-300 text-xs">
                    {form.isEV ? '⚡ 전기차 — 자동차세 10만원 정액 / 취등록세 최대 140만원 감면'
                      : '🔋 하이브리드 — 취등록세 최대 40만원 감면'}
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => { setDir(-1); setPhase('group1'); }}
                  className="flex-1 py-3.5 rounded-xl border border-[#2a2a3e] text-slate-400 hover:text-white font-medium transition-colors">
                  ← 이전
                </button>
                <button type="button" onClick={() => { setDir(1); setPhase('group3'); }} disabled={!g2Valid}
                  className="flex-[2] py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  다음 — 사용 패턴 →
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ GROUP 3 — 어떻게 사용? ═══════════════════════════════ */}
          {phase === 'group3' && (
            <motion.div
              key="g3"
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {/* 보유 계획 */}
              <div>
                <Label>보유 계획 ({form.ownershipYears}년)</Label>
                <input
                  type="range" min={1} max={7} step={1}
                  value={form.ownershipYears}
                  onChange={(e) => setForm((f) => ({ ...f, ownershipYears: Number(e.target.value) }))}
                  className="w-full accent-red-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  {[1,2,3,4,5,6,7].map((n) => <span key={n}>{n}년</span>)}
                </div>
                {form.ownershipYears <= 2 && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-orange-300 text-xs">⚠️ 단기 보유엔 할부 불리 — 초기비용 회수 전 매각</p>
                  </div>
                )}
                {form.ownershipYears >= 5 && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-green-300 text-xs">💡 장기 보유엔 할부 유리 — 대출 상환 후 무부담</p>
                  </div>
                )}
              </div>

              {/* 월 주행거리 */}
              <div>
                <Label>월 주행거리</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: 12_000, l: '1,000km 이하', sub: '연 12,000km' },
                    { v: 24_000, l: '1,000 ~ 2,000km', sub: '연 24,000km' },
                    { v: 36_000, l: '2,000 ~ 3,000km', sub: '연 36,000km' },
                    { v: 42_000, l: '3,000km 이상', sub: '연 42,000km+' },
                  ].map(({ v, l, sub }) => (
                    <button type="button" key={v} onClick={() => setForm((f) => ({ ...f, annualKm: v }))}
                      className={[
                        'px-3 py-3 rounded-xl border text-left transition-all',
                        form.annualKm === v
                          ? 'border-red-500 bg-red-500/10 ring-1 ring-red-500/40'
                          : 'border-[#2a2a3e] bg-[#0e0e20] hover:border-[#3a3a5e]',
                      ].join(' ')}>
                      <p className="text-white text-sm font-medium">{l}</p>
                      <p className="text-slate-500 text-xs">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 연간 보험료 */}
              <div>
                <Label>연간 자동차 보험료</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(Object.entries(INSURANCE_PRESETS) as [InsuranceHistory, typeof INSURANCE_PRESETS[InsuranceHistory]][]).map(([k, { amount }]) => (
                    <Chip key={k} selected={Number(form.insuranceAnnual) === amount}
                      onClick={() => setForm((f) => ({ ...f, insuranceAnnual: String(amount) }))}>
                      {Math.round(amount / 10_000)}만원
                    </Chip>
                  ))}
                </div>
                <NumberInput
                  value={form.insuranceAnnual}
                  onChange={(v) => setForm((f) => ({ ...f, insuranceAnnual: v }))}
                  placeholder="직접 입력"
                  unit="원/년"
                  note="위 경력 구간은 추산값 — 실제 보험료로 수정 가능"
                />
              </div>

              {/* 업무사용비율 (사업자만) */}
              {(form.customerType === 'corporation' || form.customerType === 'individual') && (
                <div>
                  <Label>업무사용비율 ({form.businessUseRatio}%)</Label>
                  <input
                    type="range" min={0} max={100} step={5}
                    value={form.businessUseRatio}
                    onChange={(e) => setForm((f) => ({ ...f, businessUseRatio: Number(e.target.value) }))}
                    className="w-full accent-red-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0%</span>
                    <span>업종 기본 {DEFAULT_INDUSTRY_RATIO[form.industry]}%</span>
                    <span>100%</span>
                  </div>
                  {form.businessUseRatio >= 60 && (
                    <Hint>절세 효과가 결과 카드에 표시됩니다</Hint>
                  )}
                </div>
              )}

              {/* 계약 종료 후 */}
              <div>
                <Label>계약 종료 후 계획</Label>
                <div className="flex flex-col gap-2">
                  {([
                    ['return',  '🔄 반납 / 새 차 계약', '매번 최신 차로 교체'],
                    ['purchase','🏠 인수 (차량 소유)',   '리스 인수 또는 할부 완납'],
                    ['renew',   '🔃 재계약 (동일 차)',  '동일 차량 계속 이용'],
                  ] as [ContractEndOption, string, string][]).map(([v, l, sub]) => (
                    <button type="button" key={v} onClick={() => setForm((f) => ({ ...f, contractEndOption: v }))}
                      className={[
                        'px-4 py-3 rounded-xl border text-left transition-all',
                        form.contractEndOption === v
                          ? 'border-red-500 bg-red-500/10 ring-1 ring-red-500/40'
                          : 'border-[#2a2a3e] bg-[#0e0e20] hover:border-[#3a3a5e]',
                      ].join(' ')}>
                      <p className="text-white text-sm font-medium">{l}</p>
                      <p className="text-slate-500 text-xs">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => { setDir(-1); setPhase('group2'); }}
                  className="flex-1 py-3.5 rounded-xl border border-[#2a2a3e] text-slate-400 hover:text-white font-medium transition-colors">
                  ← 이전
                </button>
                <button type="button" onClick={runCalculation} disabled={!g3Valid}
                  className="flex-[2] py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  결과 보기 →
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ RESULT ════════════════════════════════════════════════ */}
          {phase === 'result' && decision && cmpResult && (
            <motion.div
              key="result"
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-5"
            >
              {/* 헤더 */}
              <div>
                <p className="text-red-400 text-sm font-medium mb-1">비교 완료</p>
                <h2 className="text-white text-2xl font-bold">{decision.summary}</h2>
                <p className="text-slate-400 text-sm mt-1">
                  {displayBrand} {form.model} / {form.carPriceMk}만원 / {form.ownershipYears}년 보유
                </p>
                {dataWeek ? (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-emerald-400 text-xs font-medium">📊 엔카 {dataWeek} 실시세 적용</span>
                  </div>
                ) : (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-700/30 border border-slate-600/20">
                    <span className="text-slate-500 text-xs">감가상각 내부 추산 기준</span>
                  </div>
                )}
              </div>

              {/* 3개 결과 카드 */}
              {decision.ranked.map((s) => (
                <ResultCard
                  key={s.method}
                  scored={s}
                  ownershipYears={form.ownershipYears}
                  rentalMarket={s.method === 'rent' ? rentalMarket : null}
                />
              ))}

              {/* 계산 가정 */}
              <div className="bg-[#12122a] border border-[#2a2a3e] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => setShowAssumptions((p) => !p)}
                  className="w-full px-5 py-4 text-left flex justify-between items-center">
                  <span className="text-slate-400 text-sm font-medium">📋 계산 가정 확인</span>
                  <span className="text-slate-600 text-xs">{showAssumptions ? '▲' : '▼'}</span>
                </button>
                {showAssumptions && (
                  <div className="px-5 pb-4 space-y-1.5 border-t border-[#1a1a3e]">
                    {assumptions.map((a, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-slate-600 text-xs mt-0.5">•</span>
                        <span className="text-slate-500 text-xs leading-relaxed">{a}</span>
                      </div>
                    ))}
                    <p className="text-slate-600 text-xs mt-2 pt-2 border-t border-[#1a1a3e]">
                      계산 기준일: {new Date().toLocaleDateString('ko-KR')} / 렌테일러 비교 엔진 v1
                    </p>
                  </div>
                )}
              </div>

              {/* 다시 계산 */}
              <button type="button" onClick={() => { setDir(-1); setPhase('group1'); }}
                className="text-slate-500 text-sm hover:text-slate-300 transition-colors text-center">
                ← 조건 변경 후 다시 계산
              </button>

              {/* 리드폼 */}
              <div className="bg-[#12122a] border border-red-900/40 rounded-2xl p-5">
                {leadSubmitted ? (
                  <div className="text-center py-4">
                    <p className="text-red-400 text-3xl mb-2">✓</p>
                    <p className="text-white font-semibold">신청 완료!</p>
                    <p className="text-slate-400 text-sm mt-1">
                      빠른 시일 내 렌테일러 전문가가 연락드립니다.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-white font-semibold mb-1">무료 맞춤 견적 비교 받기</p>
                    <p className="text-slate-400 text-xs mb-4">
                      결과를 바탕으로 실제 시장 견적을 비교해 드립니다.
                    </p>
                    <form onSubmit={submitLead} className="flex flex-col gap-3">
                      <input
                        type="text"
                        placeholder="이름"
                        value={leadData.name}
                        onChange={(e) => setLeadData((d) => ({ ...d, name: e.target.value }))}
                        required
                        className="px-4 py-3 rounded-xl border border-[#2a2a3e] bg-[#0c0c1d] text-white text-sm focus:outline-none focus:border-red-500/60"
                      />
                      <input
                        type="tel"
                        placeholder="연락처"
                        value={leadData.phone}
                        onChange={(e) => setLeadData((d) => ({ ...d, phone: e.target.value }))}
                        required
                        className="px-4 py-3 rounded-xl border border-[#2a2a3e] bg-[#0c0c1d] text-white text-sm focus:outline-none focus:border-red-500/60"
                      />
                      {leadError && <p className="text-red-400 text-xs">{leadError}</p>}
                      <p className="text-slate-600 text-xs">
                        개인정보는 견적 안내 목적으로만 사용됩니다.
                      </p>
                      <button
                        type="submit"
                        disabled={leadSubmitting}
                        className="py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                      >
                        {leadSubmitting ? '전송 중…' : '무료 견적 비교 신청 →'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
