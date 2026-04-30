'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateComparison, type ComparisonInputs, type ComparisonResult, type MethodResult } from '@/lib/domain/comparison-engine';
import { scoreDecision, type DecisionResult, type ScoredMethod } from '@/lib/domain/decision-scorer';
import { getVehicleCC } from '@/lib/domain/vehicle-cc-map';
import { InsuranceInsightCard } from '@/components/diagnosis/report/InsuranceInsightCard';
import type { CustomerType, InsuranceHistory, PlatePreference, ContractEndOption } from '@/lib/domain/decision-scorer';
import type { Industry, RevenueRange } from '@/lib/domain/tax-calculator';
import type { AcquisitionVehicleType } from '@/lib/domain/acquisition-tax-calculator';
import type { YearPrices } from '@/lib/domain/depreciation-calculator';

// ── 타입 ──────────────────────────────────────────────────────────────

type Phase = 'group1' | 'group2' | 'result';
type TrimOption = { name: string; msrp: number; fuelType: string };
type AgeGroup = '20대 이하' | '30대' | '40대' | '50대' | '60대' | '70대 이상';
type SexType  = '남자' | '여자';

interface DbInsurance {
  amount:    number;                     // 연간 보험료 (원)
  baseYm:    string;                     // 기준연월 (예: 202601)
  breakdown: Record<string, number>;     // 담보별 월 보험료 (원)
  ageGroup:  string | null;
  sex:       string | null;
}

interface AdvancedSettings {
  vehicleAge:        number;
  ownershipYears:    number;
  annualKm:          number;
  contractEndOption: ContractEndOption;
  platePreference:   PlatePreference;
  businessUseRatio:  number;
}

interface FormState {
  // Group 1 (필수)
  customerType:     CustomerType;
  industry:         Industry;
  insuranceHistory: InsuranceHistory;
  ageGroup:         AgeGroup | null;
  sex:              SexType | null;
  // Group 2 (필수)
  brand:            string;
  model:            string;
  trimName:         string;
  carPriceMk:       string;
  carPriceMkAuto:   number;
  isEV:             boolean;
  isHEV:            boolean;
  // 고급 설정
  advanced:         AdvancedSettings;
}

// ── 상수 ──────────────────────────────────────────────────────────────

const ACCENT = '#C9A84C';

const DOMESTIC_BRANDS = new Set(['현대', '기아', '제네시스', 'KGM', '르노코리아', '쉐보레']);

const INSURANCE_PRESETS: Record<InsuranceHistory, { label: string; amount: number }> = {
  none:        { label: '처음 (경력 없음)', amount: 1_800_000 },
  under1y:     { label: '1년 미만',         amount: 1_400_000 },
  '1-3y':      { label: '1 ~ 3년',          amount: 1_100_000 },
  '3y+normal': { label: '3년+ 일반',         amount:   850_000 },
  '3y+good':   { label: '3년+ 우수',         amount:   650_000 },
};

const DEFAULT_INDUSTRY_RATIO: Record<Industry, number> = {
  construction: 90, retail: 85, food: 70, service: 60, freelance: 65,
};

const DEFAULT_REVENUE: Record<'corporation' | 'individual', RevenueRange> = {
  corporation: '1eok-3eok', individual: '5k-1eok',
};

const METHOD_META = {
  rent:        { label: '장기렌트', bg: '#EFF6FF', border: '#BFDBFE', accent: '#3B82F6', rankLabel: ['🥇 1위 추천', '🥈 2위', '🥉 3위'] },
  lease:       { label: '운영리스',  bg: '#F5F3FF', border: '#DDD6FE', accent: '#8B5CF6', rankLabel: ['🥇 1위 추천', '🥈 2위', '🥉 3위'] },
  installment: { label: '할부 구매', bg: '#F0FDF4', border: '#BBF7D0', accent: '#22C55E', rankLabel: ['🥇 1위 추천', '🥈 2위', '🥉 3위'] },
};

const DEFAULT_ADVANCED: AdvancedSettings = {
  vehicleAge: 0, ownershipYears: 4, annualKm: 24_000,
  contractEndOption: 'return', platePreference: 'any', businessUseRatio: 0,
};

const AGE_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: '20대 이하', label: '20대↓' },
  { value: '30대',      label: '30대'  },
  { value: '40대',      label: '40대'  },
  { value: '50대',      label: '50대'  },
  { value: '60대',      label: '60대'  },
  { value: '70대 이상', label: '70대↑' },
];

const SEX_OPTIONS: { value: SexType; label: string }[] = [
  { value: '남자', label: '남성' },
  { value: '여자', label: '여성' },
];

// ── 유틸 ──────────────────────────────────────────────────────────────

function fmtMk(won: number): string {
  const mk = Math.round(won / 10_000);
  if (mk >= 10_000) return `${(mk / 10_000).toFixed(1)}억원`;
  return `${mk.toLocaleString()}만원`;
}

function getCarType(carPriceMk: number): '소형' | '중형' | '대형' {
  if (carPriceMk < 2_000) return '소형';
  if (carPriceMk < 4_500) return '중형';
  return '대형';
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────

function Chip({ selected, onClick, children, disabled }: {
  selected: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={[
        'px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 text-left',
        disabled ? 'opacity-40 cursor-not-allowed border-[#E5E7EB] text-[#8E8E93] bg-white' :
        selected
          ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#92702A] ring-1 ring-[#C9A84C]/30'
          : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#C9A84C]/50',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function AgeChip({ selected, onClick, children }: {
  selected: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick}
      className={[
        'py-2 rounded-xl border-2 text-[12px] font-semibold transition-all text-center',
        selected
          ? 'border-[#FF9500] bg-[#FF9500]/10 text-[#FF9500]'
          : 'border-[#E5E7EB] bg-white text-[#6D6D72] hover:border-[#FF9500]/40',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[#1C1C1E] text-sm font-semibold mb-2">{children}</p>;
}

function DataBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-[#8E8E93] bg-[#F2F2F7] px-2 py-0.5 rounded-full">
      {children}
    </span>
  );
}

function SelectField({ value, onChange, disabled, children, loading }: {
  value: string; onChange: (v: string) => void;
  disabled?: boolean; children: React.ReactNode; loading?: boolean;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1C1C1E] text-sm appearance-none focus:outline-none focus:border-[#C9A84C] disabled:opacity-50 disabled:cursor-not-allowed">
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] text-xs">
        {loading ? '⟳' : '▾'}
      </span>
    </div>
  );
}

// ── 결과 카드 ─────────────────────────────────────────────────────────

function MethodCard({ scored, ownershipYears, insuranceSource }:
  { scored: ScoredMethod; ownershipYears: number; insuranceSource: string }) {
  const [open, setOpen] = useState(false);
  const { method, rank, excluded, excludeReason, keyReasons, result } = scored;
  const m = METHOD_META[method];
  const bd = result.breakdown;
  const isBest = rank === 1 && !excluded;

  return (
    <div className="rounded-2xl border overflow-hidden shadow-sm"
      style={{ backgroundColor: m.bg, borderColor: isBest ? m.accent + 'AA' : m.border }}>
      <div className="px-5 pt-5 pb-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold" style={{ color: m.accent }}>
            {m.rankLabel[rank - 1]}
          </span>
          <span className="text-xs px-2 py-1 rounded-full font-semibold"
            style={{ color: m.accent, backgroundColor: m.accent + '20' }}>
            {m.label}
          </span>
        </div>

        {excluded ? (
          <p className="text-[#6B7280] text-sm py-2">{excludeReason}</p>
        ) : (
          <>
            {/* 핵심 수치 */}
            <div className="flex items-end gap-4 mb-4">
              <div>
                <p className="text-[#6B7280] text-xs mb-0.5">월 납입</p>
                <p className="text-[#1C1C1E] text-2xl font-bold">{fmtMk(result.monthlyPayment)}</p>
              </div>
              <div className="flex-1 text-right">
                <p className="text-[#6B7280] text-xs mb-0.5">{ownershipYears}년 총비용</p>
                <p className="text-xl font-semibold" style={{ color: m.accent }}>
                  {fmtMk(result.totalCostLow)} ~ {fmtMk(result.totalCostHigh)}
                </p>
              </div>
            </div>

            {/* 핵심 이유 */}
            <div className="space-y-1.5 mb-3">
              {keyReasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs mt-0.5 shrink-0" style={{ color: m.accent }}>✓</span>
                  <span className="text-[#374151] text-xs leading-relaxed">{r}</span>
                </div>
              ))}
            </div>

            {/* 절세효과 */}
            {result.annualTaxSaving > 100_000 && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-yellow-700 text-xs font-medium">
                  💡 절세 효과 연 {fmtMk(result.annualTaxSaving)} 별도 (업무사용비율 적용)
                </p>
              </div>
            )}

            {/* 계산 근거 토글 */}
            <button type="button" onClick={() => setOpen((p) => !p)}
              className="mt-3 text-[#8E8E93] text-xs hover:text-[#6B7280] transition-colors">
              계산 근거 {open ? '▲' : '▼'}
            </button>

            {open && (
              <div className="mt-2 pt-3 border-t border-black/5 space-y-1.5">
                {([
                  ['납입금 합계', bd.payments, null],
                  ['취등록세', bd.initialCost, '지방세법 §12'],
                  ['자동차세', bd.autoTax, '지방세법 §127'],
                  ['보험료', bd.insurance, insuranceSource],
                  ['정비비', bd.maintenance, '차령·가격 추산'],
                ] as [string, number, string | null][]).map(([lbl, val, src]) =>
                  val > 0 ? (
                    <div key={lbl} className="flex justify-between items-center text-xs">
                      <span className="text-[#6B7280] flex items-center gap-1">
                        {lbl}
                        {src && <DataBadge>{src}</DataBadge>}
                      </span>
                      <span className="text-[#374151] font-medium">{fmtMk(val)}</span>
                    </div>
                  ) : null,
                )}
                {bd.salvageValue > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#6B7280] flex items-center gap-1">
                      중고 매각가 (차감)
                      <DataBadge>엔카 시세</DataBadge>
                    </span>
                    <span className="text-green-600 font-medium">−{fmtMk(bd.salvageValue)}</span>
                  </div>
                )}
                {method === 'rent' && (
                  <p className="text-[#8E8E93] text-xs pt-1">* 보험·정비·세금이 월납입에 포함됨</p>
                )}
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-black/5 font-semibold">
                  <span className="text-[#6B7280]">추정 총비용 (중간값)</span>
                  <span style={{ color: m.accent }}>{fmtMk(result.totalCostMid)}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 다이렉트 링크 */}
      {!excluded && rank === 1 && (
        <div className="px-5 pb-4 flex gap-2 flex-wrap border-t border-black/5 pt-3">
          {method === 'rent' && (<>
            <a href="https://www.skrentacar.com" target="_blank" rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#1C1C1E] hover:border-[#C9A84C] transition-colors">
              SK렌터카 →
            </a>
            <a href="https://www.lotterentacar.net" target="_blank" rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#1C1C1E] hover:border-[#C9A84C] transition-colors">
              롯데렌터카 →
            </a>
          </>)}
          {method === 'lease' && (
            <a href="https://www.kbcapital.co.kr" target="_blank" rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#1C1C1E] hover:border-[#C9A84C] transition-colors">
              KB캐피탈 →
            </a>
          )}
          {method === 'installment' && (
            <a href="https://www.hyundaicapital.com" target="_blank" rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#1C1C1E] hover:border-[#C9A84C] transition-colors">
              현대캐피탈 →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────

export default function CompareDiagnosisPage() {
  return (
    <Suspense fallback={null}>
      <CompareInner />
    </Suspense>
  );
}

function CompareInner() {
  const searchParams = useSearchParams();
  const [phase, setPhase]   = useState<Phase>('group1');
  const [dir, setDir]       = useState(1);
  const [form, setForm]     = useState<FormState>(() => ({
    customerType: 'employee', industry: 'service',
    insuranceHistory: '3y+normal',
    ageGroup: null, sex: null,
    brand: searchParams.get('brand') ?? '',
    model: searchParams.get('model') ?? '',
    trimName: '', carPriceMk: '', carPriceMkAuto: 0,
    isEV: false, isHEV: false,
    advanced: { ...DEFAULT_ADVANCED },
  }));

  // 드롭다운 API 상태
  const [brands, setBrands]   = useState<string[]>([]);
  const [models, setModels]   = useState<string[]>([]);
  const [trims, setTrims]     = useState<TrimOption[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingTrims, setLoadingTrims]   = useState(false);

  // 자동채움 API 상태
  const [dbInsurance, setDbInsurance]     = useState<DbInsurance | null>(null);
  const [dbUsedPrices, setDbUsedPrices]   = useState<Record<number, YearPrices> | null>(null);
  const [loadingInsurance, setLoadingInsurance] = useState(false);
  const [loadingUsedPrices, setLoadingUsedPrices] = useState(false);

  // 고급 설정 토글
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 결과
  const [decision, setDecision]   = useState<DecisionResult | null>(null);
  const [cmpResult, setCmpResult] = useState<ComparisonResult | null>(null);
  const [showAssumptions, setShowAssumptions] = useState(false);

  // 리드폼
  const [leadData, setLeadData]       = useState({ name: '', phone: '' });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError]     = useState<string | null>(null);

  // 브랜드 로드
  useEffect(() => {
    setLoadingBrands(true);
    fetch('/api/vehicle-msrp/brands')
      .then((r) => r.json())
      .then((d: { brands?: string[] }) => setBrands(d.brands ?? []))
      .catch(() => setBrands([]))
      .finally(() => setLoadingBrands(false));
  }, []);

  // 모델 로드
  const loadModels = useCallback(async (brand: string) => {
    if (!brand || brand === '__manual__') { setModels([]); return; }
    setLoadingModels(true);
    setModels([]); setTrims([]);
    setForm((f) => ({ ...f, model: '', trimName: '', carPriceMk: '', carPriceMkAuto: 0 }));
    try {
      const d = await fetch(`/api/vehicle-msrp/models?brand=${encodeURIComponent(brand)}`).then((r) => r.json()) as { models?: string[] };
      setModels(d.models ?? []);
    } catch { setModels([]); }
    setLoadingModels(false);
  }, []);

  // 트림 로드 + used-prices 자동 호출
  const loadTrims = useCallback(async (brand: string, model: string) => {
    if (!brand || !model) { setTrims([]); return; }
    setLoadingTrims(true);
    setTrims([]);
    setForm((f) => ({ ...f, trimName: '', carPriceMk: '', carPriceMkAuto: 0 }));
    try {
      const d = await fetch(`/api/vehicle-msrp?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`).then((r) => r.json()) as { trims?: Array<{ trim_name: string; msrp_price: number; fuel_type: string }> };
      setTrims((d.trims ?? []).map((t) => ({ name: t.trim_name, msrp: t.msrp_price, fuelType: t.fuel_type })));
    } catch { setTrims([]); }
    setLoadingTrims(false);

    // 엔카 중고시세 백그라운드 로드
    if (brand !== '__manual__') {
      setLoadingUsedPrices(true);
      setDbUsedPrices(null);
      fetch(`/api/used-prices?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`)
        .then((r) => r.json())
        .then((d: { status: string; prices?: Record<number, YearPrices> }) => {
          if (d.status === 'ok' && d.prices) setDbUsedPrices(d.prices);
        })
        .catch(() => {})
        .finally(() => setLoadingUsedPrices(false));
    }
  }, []);

  // 보험료 통계 조회 헬퍼 — 트림 선택 시 & ageGroup/sex 변경 시 호출
  const formRef = useRef(form);
  formRef.current = form;

  const fetchInsuranceStats = useCallback((
    brand: string, carPriceMk: number,
    ageGroup: string | null, sex: string | null,
  ) => {
    if (!carPriceMk || carPriceMk <= 0) return;
    const carType = getCarType(carPriceMk);
    const origin  = DOMESTIC_BRANDS.has(brand) ? '국산' : brand && brand !== '__manual__' ? '외산' : undefined;
    const payload: Record<string, string> = { car_type: carType };
    if (origin)   payload.origin    = origin;
    if (ageGroup) payload.age_group = ageGroup;
    if (sex)      payload.sex       = sex;

    setLoadingInsurance(true);
    setDbInsurance(null);
    fetch('/api/insurance-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((d: { status: string; estimated_annual_won?: number; base_ym?: string; breakdown_monthly?: Record<string, number>; age_group?: string; sex?: string }) => {
        if (d.status === 'ok' && d.estimated_annual_won) {
          setDbInsurance({
            amount:    d.estimated_annual_won,
            baseYm:    d.base_ym ?? '',
            breakdown: d.breakdown_monthly ?? {},
            ageGroup:  d.age_group ?? null,
            sex:       d.sex       ?? null,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingInsurance(false));
  }, []);

  // 트림 선택 → MSRP + 연료 자동채움 + 보험료 조회
  function onTrimSelect(trimName: string) {
    const t = trims.find((x) => x.name === trimName);
    if (!t) { setForm((f) => ({ ...f, trimName })); return; }
    const isEV  = ['electric', 'ev', 'bev'].includes(t.fuelType.toLowerCase());
    const isHEV = ['hybrid', 'hev', 'phev'].includes(t.fuelType.toLowerCase());
    setForm((f) => ({ ...f, trimName, carPriceMkAuto: t.msrp, carPriceMk: String(t.msrp), isEV, isHEV }));
    fetchInsuranceStats(formRef.current.brand, t.msrp, formRef.current.ageGroup, formRef.current.sex);
  }

  // ageGroup / sex 변경 시 보험료 재조회 (트림이 이미 선택된 경우에만)
  useEffect(() => {
    const price = Number(formRef.current.carPriceMk);
    if (price > 0 && formRef.current.brand) {
      fetchInsuranceStats(formRef.current.brand, price, form.ageGroup, form.sex);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.ageGroup, form.sex]);

  // 계산 실행
  function runCalculation() {
    const carPriceMk = Number(form.carPriceMk);
    if (!carPriceMk || carPriceMk <= 0) return;
    const cc = getVehicleCC(form.model) ?? 1998;
    const isBusiness = form.customerType === 'corporation' || form.customerType === 'individual';
    const businessType = isBusiness ? (form.customerType as 'corporation' | 'individual') : 'none';
    const adv = form.advanced;

    const insuranceAnnual = dbInsurance?.amount ?? INSURANCE_PRESETS[form.insuranceHistory].amount;

    const inputs: ComparisonInputs = {
      carPriceMk, modelName: form.model, vehicleAge: adv.vehicleAge,
      isEV: form.isEV, isHEV: form.isHEV,
      acquisitionVehicleType: '승용' as AcquisitionVehicleType,
      cc, ownershipYears: adv.ownershipYears, annualKm: adv.annualKm,
      insuranceAnnual, businessType, industry: form.industry,
      revenueRange: isBusiness ? DEFAULT_REVENUE[form.customerType as 'corporation' | 'individual'] : '5k-1eok',
      businessUseRatio: adv.businessUseRatio / 100,
    };

    const cmp = calculateComparison(inputs, dbUsedPrices ?? undefined);
    const dec = scoreDecision({
      customerType: form.customerType, insuranceHistory: form.insuranceHistory,
      ownershipYears: adv.ownershipYears, platePreference: adv.platePreference,
      contractEndOption: adv.contractEndOption, businessUseRatio: adv.businessUseRatio / 100,
      comparison: cmp,
    });

    setCmpResult(cmp); setDecision(dec);
    setDir(1); setPhase('result');
  }

  // 리드폼 제출
  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!decision || !cmpResult) return;
    setLeadSubmitting(true); setLeadError(null);
    const top = cmpResult[decision.topMethod];
    const summary = [
      `[비교진단] ${form.brand === '__manual__' ? '직접입력' : form.brand} ${form.model} ${form.carPriceMk}만원`,
      `추천: ${decision.topMethod} / 월 ${Math.round(top.monthlyPayment / 10_000)}만원`,
      `총비용 ${Math.round(top.totalCostMid / 10_000)}만원 (${form.advanced.ownershipYears}년)`,
      `고객: ${form.customerType} / 보험: ${form.insuranceHistory}`,
      dbInsurance?.ageGroup ? `연령: ${dbInsurance.ageGroup}${dbInsurance.sex ? ' ' + dbInsurance.sex : ''}` : null,
    ].filter(Boolean).join(' / ');
    try {
      const res = await fetch('/api/consultation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: leadData.name, phone: leadData.phone, privacyAgreed: true, contactMethod: 'phone', financeSummary: summary, stepCompleted: 6 }),
      });
      if (!res.ok) throw new Error();
      setLeadSubmitted(true);
    } catch { setLeadError('잠시 후 다시 시도해주세요.'); }
    setLeadSubmitting(false);
  }

  // 유효성
  const g1Valid = !!form.customerType && !!form.insuranceHistory;
  const g2Valid = !!form.model && Number(form.carPriceMk) > 0;

  const contextLabel  = [dbInsurance?.ageGroup, dbInsurance?.sex].filter(Boolean).join(' ');
  const insuranceSource = dbInsurance
    ? `금융위원회 통계 (${dbInsurance.baseYm}${contextLabel ? ` · ${contextLabel}` : ''})`
    : `보험경력 기준 추산`;

  const variants = {
    enter:  (d: number) => ({ x: d > 0 ? 32 : -32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? -32 : 32, opacity: 0 }),
  };

  const progress = phase === 'group1' ? 1 : phase === 'group2' ? 2 : 2;

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      <div className="max-w-[520px] mx-auto px-4 pt-8">

        {/* 헤더 */}
        {phase !== 'result' && (
          <div className="mb-6">
            <div className="flex gap-1.5 mb-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{ backgroundColor: n <= progress ? ACCENT : '#D1D1D6' }} />
              ))}
            </div>
            <p className="text-[#8E8E93] text-xs font-medium mb-1">
              {progress}/2 — {progress === 1 ? '내 상황 파악' : '차량 정보'}
            </p>
            <h1 className="text-[#1C1C1E] text-2xl font-bold">결제방식 비교</h1>
            <p className="text-[#6B7280] text-sm mt-1">5번의 선택으로 최적 방법을 확인하세요</p>
          </div>
        )}

        <AnimatePresence mode="wait" custom={dir}>

          {/* ═══ GROUP 1 — 내 상황 ═════════════════════════════════════ */}
          {phase === 'group1' && (
            <motion.div key="g1" custom={dir} variants={variants}
              initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}
              className="flex flex-col gap-5">

              {/* 고객유형 */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-5">
                <Label>나는 어떤 고객인가요?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['corporation', '💼 법인 사업자'],
                    ['individual',  '🏪 개인 사업자'],
                    ['employee',    '🧑‍💼 직장인'],
                    ['other',       '👤 기타'],
                  ] as [CustomerType, string][]).map(([v, l]) => (
                    <Chip key={v} selected={form.customerType === v}
                      onClick={() => setForm((f) => ({ ...f, customerType: v, advanced: { ...f.advanced, businessUseRatio: 0 } }))}>
                      {l}
                    </Chip>
                  ))}
                </div>

                {/* 업종 (사업자만) */}
                {(form.customerType === 'corporation' || form.customerType === 'individual') && (
                  <div className="mt-4">
                    <Label>주요 업종</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        ['service', '서비스업'], ['retail', '도소매업'],
                        ['construction', '건설업'], ['food', '음식업'], ['freelance', '프리랜서'],
                      ] as [Industry, string][]).map(([v, l]) => (
                        <Chip key={v} selected={form.industry === v}
                          onClick={() => setForm((f) => ({
                            ...f, industry: v,
                            advanced: { ...f.advanced, businessUseRatio: DEFAULT_INDUSTRY_RATIO[v] },
                          }))}>
                          {l}
                        </Chip>
                      ))}
                    </div>
                    <p className="text-[#8E8E93] text-xs mt-1.5">업무사용비율 기본 {DEFAULT_INDUSTRY_RATIO[form.industry]}% 적용</p>
                  </div>
                )}
              </div>

              {/* 보험 경력 */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-5">
                <Label>자동차 보험 경력</Label>
                <div className="flex flex-col gap-2">
                  {(Object.entries(INSURANCE_PRESETS) as [InsuranceHistory, typeof INSURANCE_PRESETS[InsuranceHistory]][]).map(([v, { label, amount }]) => (
                    <Chip key={v} selected={form.insuranceHistory === v}
                      onClick={() => setForm((f) => ({ ...f, insuranceHistory: v }))}>
                      <div className="flex justify-between w-full">
                        <span>{label}</span>
                        <span className="text-[#8E8E93] text-xs">보험료 추산 연 {Math.round(amount / 10_000)}만원</span>
                      </div>
                    </Chip>
                  ))}
                </div>
                {(form.insuranceHistory === 'none' || form.insuranceHistory === 'under1y') && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-blue-600 text-xs">💡 렌트 선택 시 보험료 부담 없음 (렌트료에 포함)</p>
                  </div>
                )}
              </div>

              {/* 운전자 연령대 (선택 — 맞춤 보험료 추정용) */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-5">
                <Label>
                  운전자 연령대
                  <span className="ml-1.5 text-[11px] font-normal text-[#8E8E93]">선택 — 맞춤 보험료 추정</span>
                </Label>
                <div className="grid grid-cols-6 gap-1.5">
                  {AGE_OPTIONS.map((opt) => {
                    const sel = form.ageGroup === opt.value;
                    return (
                      <AgeChip key={opt.value} selected={sel}
                        onClick={() => setForm((f) => ({ ...f, ageGroup: sel ? null : opt.value, sex: sel ? null : f.sex }))}>
                        {opt.label}
                      </AgeChip>
                    );
                  })}
                </div>

                {form.ageGroup !== null && (
                  <div className="mt-3">
                    <p className="text-[#1C1C1E] text-[12px] font-semibold mb-1.5">
                      성별
                      <span className="ml-1 text-[11px] font-normal text-[#8E8E93]">선택</span>
                    </p>
                    <div className="flex gap-2">
                      {SEX_OPTIONS.map((opt) => {
                        const sel = form.sex === opt.value;
                        return (
                          <AgeChip key={opt.value} selected={sel}
                            onClick={() => setForm((f) => ({ ...f, sex: sel ? null : opt.value }))}>
                            {opt.label}
                          </AgeChip>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-[#8E8E93] mt-2">
                  * 차량 선택 후 금융위원회 통계로 연령별 보험료가 자동 조회됩니다.
                </p>
              </div>

              <button type="button" onClick={() => { setDir(1); setPhase('group2'); }} disabled={!g1Valid}
                className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all disabled:opacity-40"
                style={{ backgroundColor: g1Valid ? ACCENT : '#D1D1D6' }}>
                다음 — 차량 정보 →
              </button>
            </motion.div>
          )}

          {/* ═══ GROUP 2 — 차량 정보 ═══════════════════════════════════ */}
          {phase === 'group2' && (
            <motion.div key="g2" custom={dir} variants={variants}
              initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}
              className="flex flex-col gap-4">

              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-5 flex flex-col gap-4">
                {/* 브랜드 */}
                <div>
                  <Label>브랜드</Label>
                  <SelectField value={form.brand} loading={loadingBrands}
                    onChange={(v) => { setForm((f) => ({ ...f, brand: v })); loadModels(v); }}>
                    <option value="">브랜드 선택</option>
                    {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                    <option value="__manual__">직접 입력</option>
                  </SelectField>
                </div>

                {/* 모델 */}
                <div>
                  <Label>모델</Label>
                  {form.brand === '__manual__' ? (
                    <input type="text" value={form.model}
                      onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                      placeholder="모델명 입력 (예: K5)"
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1C1C1E] text-sm focus:outline-none focus:border-[#C9A84C]" />
                  ) : (
                    <SelectField value={form.model} disabled={!form.brand} loading={loadingModels}
                      onChange={(v) => { setForm((f) => ({ ...f, model: v })); loadTrims(form.brand, v); }}>
                      <option value="">모델 선택</option>
                      {models.map((m) => <option key={m} value={m}>{m}</option>)}
                    </SelectField>
                  )}
                </div>

                {/* 트림 */}
                {form.brand !== '__manual__' && (
                  <div>
                    <Label>트림 <span className="text-[#8E8E93] font-normal text-xs">(선택 — 신차가 자동 채움)</span></Label>
                    <SelectField value={form.trimName} disabled={!form.model} loading={loadingTrims}
                      onChange={onTrimSelect}>
                      <option value="">트림 선택</option>
                      {trims.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name} — {t.msrp.toLocaleString()}만원
                        </option>
                      ))}
                    </SelectField>
                  </div>
                )}

                {/* 차량 가격 */}
                <div>
                  <Label>차량 가격 (만원)</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[1500, 2500, 3500, 5000, 7000].map((v) => (
                      <Chip key={v} selected={Number(form.carPriceMk) === v}
                        onClick={() => setForm((f) => ({ ...f, carPriceMk: String(v) }))}>
                        {v.toLocaleString()}만
                      </Chip>
                    ))}
                  </div>
                  <input type="number" value={form.carPriceMk}
                    onChange={(e) => setForm((f) => ({ ...f, carPriceMk: e.target.value }))}
                    placeholder="직접 입력"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#1C1C1E] text-sm focus:outline-none focus:border-[#C9A84C] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  {form.carPriceMkAuto > 0 && Number(form.carPriceMk) !== form.carPriceMkAuto && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, carPriceMk: String(f.carPriceMkAuto) }))}
                      className="text-xs mt-1" style={{ color: ACCENT }}>
                      DB 신차가로 복원 ({form.carPriceMkAuto.toLocaleString()}만원)
                    </button>
                  )}
                </div>

                {/* EV/HEV 감지 */}
                {(form.isEV || form.isHEV) && (
                  <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-100">
                    <p className="text-green-700 text-xs">
                      {form.isEV ? '⚡ 전기차 감지 — 자동차세 10만원·취등록세 최대 140만원 감면 자동 적용'
                        : '🔋 하이브리드 감지 — 취등록세 최대 40만원 감면 자동 적용'}
                    </p>
                  </div>
                )}

                {/* 보험료 DB 표시 */}
                {(loadingInsurance || dbInsurance) && (
                  <div className="px-3 py-2.5 rounded-lg bg-[#F9F9F9] border border-[#E5E7EB]">
                    {loadingInsurance ? (
                      <p className="text-[#8E8E93] text-xs">보험료 통계 조회 중…</p>
                    ) : dbInsurance ? (
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[#374151] text-xs font-semibold">금융위원회 평균 보험료</p>
                            <span className="text-[#8E8E93] text-[10px]">{dbInsurance.baseYm}</span>
                          </div>
                          <p className="text-[#1C1C1E] text-sm font-bold">
                            연 {Math.round(dbInsurance.amount / 10_000)}만원
                          </p>
                        </div>
                        {contextLabel && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="inline-flex items-center text-[10px] font-semibold text-[#FF9500] bg-[#FF950015] px-1.5 py-0.5 rounded-full">
                              {contextLabel} 기준
                            </span>
                            <span className="text-[10px] text-[#8E8E93]">연령별 맞춤 추정치 적용됨</span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* 중고시세 DB 표시 */}
                {(loadingUsedPrices || dbUsedPrices) && (
                  <div className="px-3 py-1.5 rounded-lg bg-[#F9F9F9] border border-[#E5E7EB]">
                    {loadingUsedPrices ? (
                      <p className="text-[#8E8E93] text-xs">엔카 시세 로드 중…</p>
                    ) : dbUsedPrices ? (
                      <p className="text-[#6B7280] text-xs">✓ 엔카 실거래 시세 로드됨 — 감가상각 계산에 반영</p>
                    ) : null}
                  </div>
                )}
              </div>

              {/* 고급 설정 */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                <button type="button" onClick={() => setShowAdvanced((p) => !p)}
                  className="w-full px-5 py-4 flex justify-between items-center">
                  <span className="text-[#1C1C1E] text-sm font-medium">⚙️ 고급 설정 (선택)</span>
                  <span className="text-[#8E8E93] text-xs">
                    {showAdvanced ? '▲ 접기' : '▼ 기본값으로 계산 중 — 수정 가능'}
                  </span>
                </button>

                {showAdvanced && (
                  <div className="px-5 pb-5 pt-0 flex flex-col gap-4 border-t border-[#F0F0F5]">
                    {/* 차령 */}
                    <div>
                      <Label>차령 (현재)</Label>
                      <div className="flex gap-2 flex-wrap">
                        {[{v:0,l:'신차'},{v:1,l:'1년'},{v:2,l:'2년'},{v:3,l:'3년'},{v:4,l:'4년+'}].map(({v,l}) => (
                          <Chip key={v} selected={form.advanced.vehicleAge === v}
                            onClick={() => setForm((f) => ({ ...f, advanced: { ...f.advanced, vehicleAge: v } }))}>
                            {l}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    {/* 보유계획 */}
                    <div>
                      <Label>보유 계획 ({form.advanced.ownershipYears}년)</Label>
                      <input type="range" min={1} max={7} step={1}
                        value={form.advanced.ownershipYears}
                        onChange={(e) => setForm((f) => ({ ...f, advanced: { ...f.advanced, ownershipYears: Number(e.target.value) } }))}
                        className="w-full" style={{ accentColor: ACCENT }} />
                      <div className="flex justify-between text-xs text-[#8E8E93] mt-0.5">
                        {[1,2,3,4,5,6,7].map((n) => <span key={n}>{n}년</span>)}
                      </div>
                    </div>

                    {/* 주행거리 */}
                    <div>
                      <Label>연간 주행거리</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[{v:12000,l:'연 12,000km'},{v:24000,l:'연 24,000km'},{v:36000,l:'연 36,000km'},{v:42000,l:'연 42,000km+'}].map(({v,l}) => (
                          <Chip key={v} selected={form.advanced.annualKm === v}
                            onClick={() => setForm((f) => ({ ...f, advanced: { ...f.advanced, annualKm: v } }))}>
                            {l}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    {/* 계약종료후 */}
                    <div>
                      <Label>계약 종료 후</Label>
                      <div className="flex flex-col gap-2">
                        {([
                          ['return',  '🔄 반납 / 새 차'],
                          ['purchase','🏠 인수 (소유)'],
                          ['renew',   '🔃 재계약'],
                        ] as [ContractEndOption, string][]).map(([v, l]) => (
                          <Chip key={v} selected={form.advanced.contractEndOption === v}
                            onClick={() => setForm((f) => ({ ...f, advanced: { ...f.advanced, contractEndOption: v } }))}>
                            {l}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    {/* 번호판 */}
                    <div>
                      <Label>번호판 선호</Label>
                      <div className="flex gap-2">
                        <Chip selected={form.advanced.platePreference === 'any'}
                          onClick={() => setForm((f) => ({ ...f, advanced: { ...f.advanced, platePreference: 'any' } }))}>
                          🚗 무관
                        </Chip>
                        <Chip selected={form.advanced.platePreference === 'standard'}
                          onClick={() => setForm((f) => ({ ...f, advanced: { ...f.advanced, platePreference: 'standard' } }))}>
                          📋 일반 필수
                        </Chip>
                      </div>
                    </div>

                    {/* 업무사용비율 (사업자만) */}
                    {(form.customerType === 'corporation' || form.customerType === 'individual') && (
                      <div>
                        <Label>업무사용비율 ({form.advanced.businessUseRatio}%)</Label>
                        <input type="range" min={0} max={100} step={5}
                          value={form.advanced.businessUseRatio}
                          onChange={(e) => setForm((f) => ({ ...f, advanced: { ...f.advanced, businessUseRatio: Number(e.target.value) } }))}
                          className="w-full" style={{ accentColor: ACCENT }} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setDir(-1); setPhase('group1'); }}
                  className="flex-1 py-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#1C1C1E] font-medium transition-colors">
                  ← 이전
                </button>
                <button type="button" onClick={runCalculation} disabled={!g2Valid}
                  className="flex-[2] py-3.5 rounded-2xl text-white font-semibold transition-all disabled:opacity-40"
                  style={{ backgroundColor: g2Valid ? ACCENT : '#D1D1D6' }}>
                  결과 보기 →
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ RESULT ════════════════════════════════════════════════ */}
          {phase === 'result' && decision && cmpResult && (
            <motion.div key="result" custom={dir} variants={variants}
              initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}
              className="flex flex-col gap-4">

              <div>
                <p className="text-[#8E8E93] text-sm font-medium mb-1">비교 완료</p>
                <h2 className="text-[#1C1C1E] text-xl font-bold">{decision.summary}</h2>
                <p className="text-[#6B7280] text-sm mt-1">
                  {form.brand === '__manual__' ? '직접입력' : form.brand} {form.model} / {form.carPriceMk}만원 / {form.advanced.ownershipYears}년
                </p>
              </div>

              {/* 3개 결과 카드 */}
              {decision.ranked.map((s) => (
                <MethodCard key={s.method} scored={s}
                  ownershipYears={form.advanced.ownershipYears}
                  insuranceSource={insuranceSource} />
              ))}

              {/* 보험료 분석 카드 — 금융위원회 통계 데이터 가용 시 */}
              {dbInsurance && Object.keys(dbInsurance.breakdown).length > 0 && (
                <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#F2F2F7]">
                    <p className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-wide">보험료 분석</p>
                  </div>
                  <div className="p-4">
                    <InsuranceInsightCard
                      annualMk={Math.round(dbInsurance.amount / 10_000)}
                      breakdown={dbInsurance.breakdown}
                      ageGroup={dbInsurance.ageGroup}
                      sex={dbInsurance.sex}
                    />
                  </div>
                </div>
              )}

              {/* 계산 가정 */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                <button type="button" onClick={() => setShowAssumptions((p) => !p)}
                  className="w-full px-5 py-4 flex justify-between items-center">
                  <span className="text-[#6B7280] text-sm">📋 계산 가정 보기</span>
                  <span className="text-[#8E8E93] text-xs">{showAssumptions ? '▲' : '▼'}</span>
                </button>
                {showAssumptions && (
                  <div className="px-5 pb-4 space-y-1.5 border-t border-[#F0F0F5]">
                    {cmpResult.assumptions.map((a, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[#C7C7CC] text-xs mt-0.5">•</span>
                        <span className="text-[#6B7280] text-xs leading-relaxed">{a}</span>
                      </div>
                    ))}
                    <p className="text-[#C7C7CC] text-xs pt-2 border-t border-[#F0F0F5]">
                      기준일: {new Date().toLocaleDateString('ko-KR')} / 렌테일러 비교 엔진 v1
                    </p>
                  </div>
                )}
              </div>

              <button type="button" onClick={() => { setDir(-1); setPhase('group1'); }}
                className="text-[#8E8E93] text-sm hover:text-[#6B7280] transition-colors text-center">
                ← 조건 변경하기
              </button>

              {/* 리드폼 */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-5">
                {leadSubmitted ? (
                  <div className="text-center py-4">
                    <p className="text-2xl mb-2" style={{ color: ACCENT }}>✓</p>
                    <p className="text-[#1C1C1E] font-semibold">신청 완료!</p>
                    <p className="text-[#6B7280] text-sm mt-1">렌테일러 전문가가 빠르게 연락드립니다.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[#1C1C1E] font-semibold mb-1">무료 맞춤 견적 비교</p>
                    <p className="text-[#6B7280] text-xs mb-4">비교 결과를 바탕으로 실제 시장 견적을 받아보세요.</p>
                    <form onSubmit={submitLead} className="flex flex-col gap-3">
                      <input type="text" placeholder="이름" value={leadData.name} required
                        onChange={(e) => setLeadData((d) => ({ ...d, name: e.target.value }))}
                        className="px-4 py-3 rounded-xl border border-[#E5E7EB] text-[#1C1C1E] text-sm focus:outline-none focus:border-[#C9A84C]" />
                      <input type="tel" placeholder="연락처" value={leadData.phone} required
                        onChange={(e) => setLeadData((d) => ({ ...d, phone: e.target.value }))}
                        className="px-4 py-3 rounded-xl border border-[#E5E7EB] text-[#1C1C1E] text-sm focus:outline-none focus:border-[#C9A84C]" />
                      {leadError && <p className="text-red-500 text-xs">{leadError}</p>}
                      <p className="text-[#8E8E93] text-xs">개인정보는 견적 안내 목적으로만 사용됩니다.</p>
                      <button type="submit" disabled={leadSubmitting}
                        className="py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50"
                        style={{ backgroundColor: ACCENT }}>
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
