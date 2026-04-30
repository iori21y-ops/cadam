'use client';

/**
 * /diagnosis/report — 차량 감가상각 진단 리포트 (Phase 1)
 *
 * 흐름: 브랜드/모델/트림 선택 → 계산 → 6섹션 리포트
 * Phase 2 TODO: 차량번호 입력 → car365 API 자동 매칭
 */

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

import { DiagnosisForm }       from '@/components/diagnosis/report/DiagnosisForm';
import { CostComparisonTable } from '@/components/diagnosis/report/CostComparisonTable';
import { TaxSummaryCard }      from '@/components/diagnosis/report/TaxSummaryCard';
import { TaxSavingCard }       from '@/components/diagnosis/report/TaxSavingCard';
import { EvChargingCard, type EvChargingStats } from '@/components/diagnosis/report/EvChargingCard';
import { LeasePenaltyCard }    from '@/components/diagnosis/report/LeasePenaltyCard';
import { InsuranceInsightCard } from '@/components/diagnosis/report/InsuranceInsightCard';
import { AccidentStatsCard }   from '@/components/diagnosis/report/AccidentStatsCard';
import { VictimStatsCard, type VictimStats } from '@/components/diagnosis/report/VictimStatsCard';
import { SwitchTimingCard }    from '@/components/diagnosis/report/SwitchTimingCard';
import { ReportSection }       from '@/components/diagnosis/report/ReportSection';
import { Button }              from '@/components/ui/Button';

import {
  calculateDepreciationWithTrim,
  calculateDepreciation,
  getDepreciationCurve,
  fetchDbPrices,
  type DepreciationResult,
  type YearlyRow,
  type YearPrices,
  type MileageGroup,
  type TrimMsrpResult,
} from '@/lib/domain/depreciation-calculator';
import { calculateAutoTax,        type AutoTaxResult }        from '@/lib/domain/auto-tax-calculator';
import { calculateAcquisitionTax, type AcquisitionTaxResult } from '@/lib/domain/acquisition-tax-calculator';
import { getVehicleCC }                         from '@/lib/domain/vehicle-cc-map';
import { calcMonthly }                          from '@/lib/calc-monthly';
import { calculateComparison }                  from '@/lib/domain/comparison-engine';
import type { DiagnosisFormData }               from '@/components/diagnosis/report/DiagnosisForm';
import { useQuoteStore }                        from '@/store/quoteStore';
import type { Brand }                           from '@/constants/vehicles';

// recharts SSR 오류 방지 (recharts는 클라이언트 전용)
const DepreciationChart = dynamic(
  () => import('@/components/diagnosis/report/DepreciationChart').then((m) => m.DepreciationChart),
  { ssr: false, loading: () => <div className="h-[220px] animate-pulse bg-[#F2F2F7] rounded-xl" /> },
);

const CostTimelineChart = dynamic(
  () => import('@/components/diagnosis/report/CostTimelineChart').then((m) => m.CostTimelineChart),
  { ssr: false, loading: () => <div className="h-[220px] animate-pulse bg-[#F2F2F7] rounded-xl" /> },
);

// ── 상수 ────────────────────────────────────────────────────────────────────

const DATA_YEAR = 2026;

// cc → insurance_stats car_type 매핑
function toInsuranceCarType(cc: number, isEV: boolean, msrp: number): '소형' | '중형' | '대형' | '다인승' {
  if (isEV) return msrp < 4000 ? '소형' : '중형';
  if (cc <= 1600) return '소형';
  if (cc <= 2000) return '중형';
  return '대형';
}

// 브랜드 → insurance_stats origin 매핑 (국산/외산)
const DOMESTIC_BRANDS = new Set(['현대', '기아', '제네시스', 'KGM', '르노코리아', '쉐보레']);
function toInsuranceOrigin(brand: string): '국산' | '외산' {
  return DOMESTIC_BRANDS.has(brand) ? '국산' : '외산';
}

// ── 타입 ────────────────────────────────────────────────────────────────────

interface ReportData {
  formData:       DiagnosisFormData;
  vehicleAge:     number;
  cc:             number;
  isEV:           boolean;
  isHybrid:       boolean;
  depResult:      DepreciationResult;
  curve:          YearlyRow[];
  autoTaxResult:  AutoTaxResult;
  acqTaxResult:   AcquisitionTaxResult;
  residual5yr:    number;   // 만원 (신차 기준 5년차 시세)
  dbUsed:         boolean;  // vehicle_used_prices DB 시세 사용 여부
}

type Step = 'input' | 'calculating' | 'result';

// ── 유틸 ────────────────────────────────────────────────────────────────────

function fmtMk(n: number) {
  return `${n.toLocaleString()}만원`;
}

function retentionColor(rate: number | null) {
  if (rate === null) return '#8E8E93';
  if (rate >= 0.90) return '#34C759';
  if (rate >= 0.70) return '#007AFF';
  if (rate >= 0.50) return '#FF9500';
  return '#FF3B30';
}

// ── 계산 로직 ─────────────────────────────────────────────────────────────

function runCalculations(formData: DiagnosisFormData, dbPrices?: Record<number, YearPrices>): ReportData {
  const dbUsed = !!dbPrices && Object.keys(dbPrices).length > 0;
  const { model, trimData, mileageGroup } = formData;
  const vehicleAge = DATA_YEAR - trimData.model_year;
  const isEV       = trimData.fuel_type === 'ev';
  const isHybrid   = trimData.fuel_type === 'hybrid';
  const cc         = getVehicleCC(model) ?? (isEV ? 0 : 2000);

  // 감가상각 계산 — DB 시세 있으면 우선 사용, 없으면 MARKET_PRICE_TABLE 폴백
  const depResult = calculateDepreciationWithTrim(
    model,
    trimData.msrp_price,
    vehicleAge > 0 ? vehicleAge : 1,
    mileageGroup,
    undefined,
    dbPrices,
  );

  // 1~10년차 커브 (차트용) — DB 시세 동일하게 반영
  const curve = getDepreciationCurve(model, mileageGroup, undefined, undefined, dbPrices);

  // 자동차세
  const autoTaxResult = calculateAutoTax({
    cc:          isEV ? 0 : cc,
    vehicleType: 'passenger',
    ageYears:    vehicleAge > 0 ? vehicleAge : 1,
    isElectric:  isEV,
    isHybrid,
  });

  // 취득세 (신차 구매 기준)
  const vehicleTypeTax = cc < 1000 ? '경차' : '승용' as const;
  const acqTaxResult = calculateAcquisitionTax({
    vehiclePrice: trimData.msrp_price * 10000,  // 만원 → 원
    vehicleType:  vehicleTypeTax,
    isEV,
    isHEV:        isHybrid,
    isUsed:       false,
  });

  // 5년차 잔존가치 (신차 기준 age=5 행)
  const residual5yr = depResult.yearlyTable.find((r) => r.age === 5)?.value ?? 0;

  return {
    formData,
    vehicleAge: vehicleAge > 0 ? vehicleAge : 1,
    cc,
    isEV,
    isHybrid,
    depResult,
    curve,
    autoTaxResult,
    acqTaxResult,
    residual5yr,
    dbUsed,
  };
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

// 연료 종류 → 한국어 레이블
const FUEL_LABEL: Record<string, string> = {
  gasoline: '가솔린',
  diesel:   '디젤',
  lpg:      'LPG',
  hybrid:   '하이브리드',
  ev:       'EV',
};

export default function ReportPage() {
  const [step, setStep]       = useState<Step>('input');
  const [report, setReport]   = useState<ReportData | null>(null);
  const [insuranceData, setInsuranceData] = useState<{
    annual:    number;
    breakdown: Record<string, number>;
    trend?:    { year: string; annual_mk: number }[];
  } | null>(null);
  const [accidentStats, setAccidentStats] = useState<{
    year: string; isAnnual: boolean;
    stats: Record<string, { lossRate: number; injuredPer10k: number; deathPer10k: number; totalInjured: number; totalDeath: number }>;
    trend?: { year: string; lossRates: Record<string, number> }[];
  } | null>(null);
  const [victimStats, setVictimStats] = useState<VictimStats | null>(null);
  const [evStats, setEvStats]               = useState<EvChargingStats | null>(null);
  const [monthlyFuelMk, setMonthlyFuelMk]   = useState<number | null>(null);
  const [pdfToast, setPdfToast]             = useState(false);
  const resultRef                           = useRef<HTMLDivElement>(null);

  const setCarBrand      = useQuoteStore((s) => s.setCarBrand);
  const setCarModel      = useQuoteStore((s) => s.setCarModel);
  const setTrim          = useQuoteStore((s) => s.setTrim);
  const setReportSummary = useQuoteStore((s) => s.setReportSummary);

  function handleSubmit(formData: DiagnosisFormData) {
    setStep('calculating');
    setInsuranceData(null);
    setAccidentStats(null);
    setVictimStats(null);
    setMonthlyFuelMk(null);

    // "계산 중..." 600ms 동안 DB 시세 조회를 병렬 실행
    const delay   = new Promise<void>((resolve) => setTimeout(resolve, 600));
    const dbFetch = fetchDbPrices(formData.brand, formData.model);

    Promise.all([delay, dbFetch]).then(([, dbPrices]) => {
      const data = runCalculations(formData, dbPrices ?? undefined);
      setReport(data);
      setStep('result');
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      // 보험료 비동기 조회 (리포트 렌더 후 백그라운드 fetch)
      const carType = toInsuranceCarType(data.cc, data.isEV, data.formData.trimData.msrp_price);
      const origin  = toInsuranceOrigin(data.formData.brand);
      const insurancePayload: Record<string, string | boolean> = { car_type: carType, origin, include_trend: true };
      if (data.formData.ageGroup)     insurancePayload.age_group     = data.formData.ageGroup;
      if (data.formData.sex)          insurancePayload.sex            = data.formData.sex;
      if (data.formData.businessType !== 'personal')
        insurancePayload.business_type = data.formData.businessType;
      fetch('/api/insurance-stats', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(insurancePayload),
      })
        .then((r) => r.ok ? r.json() : null)
        .then((json) => {
          if (json?.status === 'ok' && json.estimated_annual_mk) {
            setInsuranceData({
              annual:    json.estimated_annual_mk,
              breakdown: json.breakdown_monthly ?? {},
              trend:     json.trend ?? undefined,
            });
          }
        })
        .catch(() => { /* 보험료 로드 실패 시 미표시 */ });

      // 사고 통계 비동기 조회 (모든 차종, 8개년 추이 포함)
      fetch('/api/accident-stats?trend=true')
        .then((r) => r.ok ? r.json() : null)
        .then((json) => {
          if (json?.status === 'ok' && json.stats) {
            setAccidentStats({ year: json.year, isAnnual: json.is_annual, stats: json.stats, trend: json.trend });
          }
        })
        .catch(() => { /* 사고 통계 로드 실패 시 미표시 */ });

      // 피해자 부상 통계 비동기 조회 (한 번만 로드)
      fetch('/api/victim-stats')
        .then((r) => r.ok ? r.json() : null)
        .then((json) => {
          if (json?.status === 'ok') setVictimStats(json as VictimStats);
        })
        .catch(() => { /* 피해자 통계 로드 실패 시 미표시 */ });

      // EV 충전 통계 비동기 조회 (EV 차량일 때만)
      if (data.isEV) {
        fetch('/api/ev-charger-stats')
          .then((r) => r.ok ? r.json() : null)
          .then((json) => {
            if (json?.status === 'ok') {
              setEvStats(json as EvChargingStats);
            }
          })
          .catch(() => { /* EV 통계 로드 실패 시 미표시 */ });
      }

      // 유류비 비동기 조회 (EV 제외)
      if (!data.isEV) {
        fetch('/api/fuel-prices')
          .then((r) => r.ok ? r.json() : null)
          .then((json) => {
            if (json?.status === 'ok') {
              const MONTHLY_KM = { low: 833, mid: 1250, high: 1667 } as const;
              const KM_PER_L   = { gasoline: 12, diesel: 14, lpg: 9, hybrid: 18 } as const;
              const PRICE_MAP  = {
                gasoline: json.gasoline as number,
                diesel:   json.diesel   as number,
                lpg:      json.lpg      as number,
                hybrid:   json.gasoline as number,  // 하이브리드는 휘발유 가격 사용
              } as const;
              const fuelType  = data.formData.trimData.fuel_type as keyof typeof KM_PER_L;
              const monthlyKm = MONTHLY_KM[data.formData.mileageGroup];
              const kmPerL    = KM_PER_L[fuelType]  ?? 12;
              const pricePerL = PRICE_MAP[fuelType]  ?? json.gasoline as number;
              setMonthlyFuelMk(Math.round((monthlyKm / kmPerL) * pricePerL / 10000));
            }
          })
          .catch(() => { /* 유류비 로드 실패 시 미표시 */ });
      }
    });
  }

  function handleReset() {
    setStep('input');
    setReport(null);
    setInsuranceData(null);
    setAccidentStats(null);
    setVictimStats(null);
    setEvStats(null);
    setMonthlyFuelMk(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handlePdfSave() {
    setPdfToast(true);
    setTimeout(() => setPdfToast(false), 4000);
    setTimeout(() => window.print(), 150);
  }

  function handleQuoteClick() {
    if (!report) {
      window.location.href = '/quote';
      return;
    }

    // 리포트 요약 문자열 생성
    const fuelLabel = FUEL_LABEL[report.formData.trimData.fuel_type] ?? report.formData.trimData.fuel_type;
    const retentionPct = report.depResult.retentionRate != null
      ? `잔존가치율 ${Math.round(report.depResult.retentionRate * 100)}%`
      : '';
    const parts = [
      `[감가상각 진단] ${report.formData.brand} ${report.formData.model} ${report.formData.trimData.model_year}년식 ${report.formData.trimData.trim_name}`,
      `연료: ${fuelLabel}`,
      `신차가: ${report.formData.trimData.msrp_price.toLocaleString()}만원`,
      `현재시세 추정: ${report.depResult.currentValue.toLocaleString()}만원 (${retentionPct}, 차령 ${report.vehicleAge}년)`,
      `연간 자동차세: ${Math.round(report.autoTaxResult.discountedTotal / 10000)}만원`,
      `취득세: ${Math.round(report.acqTaxResult.finalTax / 10000)}만원`,
      insuranceData != null ? `보험료(추정): 연 ${insuranceData.annual}만원` : null,
      monthlyFuelMk     != null ? `유류비(추정): 월 ${monthlyFuelMk}만원` : null,
    ].filter(Boolean).join(' / ');

    // quoteStore에 차량 정보 + 리포트 요약 세팅
    setCarBrand(report.formData.brand as Brand);
    setCarModel(report.formData.model);
    setTrim(report.formData.trimData.trim_name);
    setReportSummary(parts);

    window.location.href = '/quote';
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24 diagnosis-print-root">
      {/* PDF 저장 안내 토스트 */}
      {pdfToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 diagnosis-no-print
          bg-[#1C1C1E] text-white text-[12px] font-medium px-4 py-2.5 rounded-xl shadow-lg
          flex items-center gap-2 whitespace-nowrap">
          <span>🖨️</span>
          <span>인쇄 화면에서 <strong>'PDF로 저장'</strong> 선택 (Chrome 권장)</span>
        </div>
      )}

      {/* 헤더 */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10 diagnosis-print-header">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-[#1C1C1E]">차량 감가상각 진단</h1>
            <p className="text-[11px] text-[#8E8E93]">엔카 실데이터 기반</p>
          </div>
          <div className="flex items-center gap-2">
            {step === 'result' && (
              <button
                onClick={handlePdfSave}
                className="diagnosis-no-print flex items-center gap-1 text-[12px] font-semibold text-[#5856D6] border border-[#5856D6] rounded-lg px-2.5 py-1 hover:bg-[#5856D610] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                PDF
              </button>
            )}
            {step === 'result' && (
              <button
                onClick={handleReset}
                className="diagnosis-no-print text-[13px] font-semibold text-[#007AFF]"
              >
                다시 진단
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 diagnosis-print-content">
        {/* ── 입력 폼 ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#F2F2F7] p-5 diagnosis-no-print">
          <p className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wide mb-4">
            차량 정보 입력
          </p>
          <DiagnosisForm
            onSubmit={handleSubmit}
            loading={step === 'calculating'}
          />
        </div>

        {/* ── 계산 중 스피너 ────────────────────────────────────────── */}
        <AnimatePresence>
          {step === 'calculating' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center justify-center py-12 gap-3 diagnosis-no-print"
            >
              <div className="w-10 h-10 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
              <p className="text-[13px] text-[#8E8E93]">감가상각 분석 중…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 리포트 결과 ───────────────────────────────────────────── */}
        <AnimatePresence>
          {step === 'result' && report && (
            <motion.div
              ref={resultRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="space-y-4"
            >
              {/* ── 섹션1: 시세 요약 ─────────────────────────────── */}
              <ReportSection
                title="내 차 시세 요약"
                badgeColor={report.dbUsed ? '#34C759' : '#8E8E93'}
                badge={
                  report.dbUsed
                    ? '엔카 DB'
                    : report.depResult.dataSource !== 'fallback'
                    ? '시세 추정'
                    : '카테고리 추정'
                }
              >
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-[11px] text-[#8E8E93] mb-0.5">
                      {report.formData.brand} {report.formData.model} · {report.formData.trimData.model_year}년식
                    </p>
                    <p className="text-[28px] font-bold text-[#1C1C1E] leading-tight">
                      {fmtMk(report.depResult.currentValue)}
                    </p>
                    <p className="text-[12px] text-[#8E8E93] mt-0.5">
                      현재 예상 시세 ({['저주행', '일반', '고주행'][['low', 'mid', 'high'].indexOf(report.formData.mileageGroup)]} 기준)
                    </p>
                  </div>
                  <div className="text-right">
                    {report.depResult.retentionRate !== null && (
                      <>
                        <p
                          className="text-[32px] font-bold leading-tight"
                          style={{ color: retentionColor(report.depResult.retentionRate) }}
                        >
                          {Math.round(report.depResult.retentionRate * 100)}%
                        </p>
                        <p className="text-[11px] text-[#8E8E93]">잔존가치율</p>
                      </>
                    )}
                  </div>
                </div>

                {/* 신차가 vs 현재 시세 바 */}
                {report.depResult.msrp && (
                  <div>
                    <div className="flex justify-between text-[11px] text-[#8E8E93] mb-1.5">
                      <span>현재 시세</span>
                      <span>신차가 {fmtMk(report.depResult.msrp)}</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#F2F2F7] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            (report.depResult.currentValue / report.depResult.msrp) * 100,
                            100,
                          )}%`,
                          background: retentionColor(report.depResult.retentionRate),
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] mt-1">
                      <span
                        className="font-semibold"
                        style={{ color: retentionColor(report.depResult.retentionRate) }}
                      >
                        {fmtMk(report.depResult.currentValue)}
                      </span>
                      <span className="text-[#8E8E93]">차령 {report.vehicleAge}년</span>
                    </div>
                  </div>
                )}

                {/* 트림 정보 */}
                <div className="mt-3 pt-3 border-t border-[#F2F2F7]">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '트림', value: report.formData.trimData.trim_name },
                      { label: '신차가', value: fmtMk(report.formData.trimData.msrp_price) },
                      { label: '연료',   value: report.formData.trimData.fuel_type.toUpperCase() },
                      { label: '배기량', value: report.isEV ? 'EV (면제)' : `${report.cc.toLocaleString()}cc` },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-[10px] text-[#8E8E93]">{item.label}</p>
                        <p className="text-[12px] font-semibold text-[#1C1C1E] truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ReportSection>

              {/* ── 섹션2: 감가상각 커브 ─────────────────────────── */}
              <ReportSection
                title="감가상각 커브"
                subtitle="신차 구매 시점부터 10년간 예상 시세 변화"
                badgeColor="#007AFF"
              >
                <DepreciationChart
                  curve={report.curve}
                  currentAge={report.vehicleAge}
                  msrp={report.depResult.msrp}
                />

                {/* 커브 요약 통계 */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    { label: '1년차',  value: report.curve.find((r) => r.age === 1)?.value },
                    { label: '5년차',  value: report.curve.find((r) => r.age === 5)?.value },
                    { label: '10년차', value: report.curve.find((r) => r.age === 10)?.value },
                  ].map((item) => (
                    <div key={item.label} className="text-center px-2 py-2.5 bg-[#F2F2F7] rounded-xl">
                      <p className="text-[10px] text-[#8E8E93] mb-1">{item.label}</p>
                      <p className="text-[13px] font-bold text-[#1C1C1E]">
                        {item.value ? fmtMk(item.value) : '-'}
                      </p>
                    </div>
                  ))}
                </div>
              </ReportSection>

              {/* ── 섹션2-b: 전환 시점 비교 ──────────────────────── */}
              <ReportSection
                title="전환 시점 비교"
                subtitle="지금 렌트로 전환 vs 1년 더 현재 차 유지"
                badgeColor="#FF9500"
                badge="전환 타이밍"
              >
                <SwitchTimingCard
                  msrp={report.formData.trimData.msrp_price}
                  currentValue={report.depResult.currentValue}
                  vehicleAge={report.vehicleAge}
                  curve={report.curve}
                  annualAutoTax={Math.round(report.autoTaxResult.discountedTotal / 10000)}
                  annualInsurance={insuranceData?.annual ?? undefined}
                  monthlyFuel={monthlyFuelMk ?? undefined}
                />
              </ReportSection>

              {/* ── 섹션3+4: 자동차세 + 취등록세 ────────────────── */}
              <ReportSection
                title="세금 분석"
                subtitle="자동차세(연간) · 취등록세(신차 구매 기준)"
                badgeColor="#FF9500"
              >
                <TaxSummaryCard
                  autoTax={report.autoTaxResult}
                  acqTax={report.acqTaxResult}
                  isEV={report.isEV}
                  vehicleAge={report.vehicleAge}
                />
              </ReportSection>

              {/* ── 섹션4-b: 보험료 분석 (보험 데이터 로드 후 표시) ── */}
              {(insuranceData || accidentStats || victimStats) && (
                <ReportSection
                  title="보험료 분석"
                  subtitle="금융위원회 자동차보험 통계 기반 맞춤 추정"
                  badgeColor="#FF9500"
                  badge={report.formData.ageGroup ? `${report.formData.ageGroup} 기준` : '통계 기반'}
                >
                  {insuranceData && (
                    <InsuranceInsightCard
                      annualMk={insuranceData.annual}
                      breakdown={insuranceData.breakdown}
                      ageGroup={report.formData.ageGroup}
                      sex={report.formData.sex}
                      trend={insuranceData.trend}
                    />
                  )}
                  {victimStats && (
                    <div className={insuranceData ? 'mt-4' : ''}>
                      <VictimStatsCard stats={victimStats} />
                    </div>
                  )}
                  {accidentStats && (
                    <div className={(insuranceData || victimStats) ? 'mt-4' : ''}>
                      <AccidentStatsCard
                        carType={toInsuranceCarType(report.cc, report.isEV, report.formData.trimData.msrp_price)}
                        stats={accidentStats.stats}
                        year={accidentStats.year}
                        isAnnual={accidentStats.isAnnual}
                        trend={accidentStats.trend}
                      />
                    </div>
                  )}
                </ReportSection>
              )}

              {/* ── 섹션5: 5년 총비용 비교 ───────────────────────── */}
              <ReportSection
                title="5년 총비용 비교"
                subtitle="할부 · 리스 · 장기렌트 — 신차 기준"
                badgeColor="#5856D6"
              >
                {/* 리스 감가 패널티 카드 */}
                <div className="mb-5">
                  <LeasePenaltyCard
                    msrp={report.formData.trimData.msrp_price}
                    residual5yr={report.residual5yr}
                  />
                </div>

                {/* 타임라인 그래프 */}
                <div className="mb-5">
                  <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wide mb-3">
                    누적 비용 타임라인
                  </p>
                  <CostTimelineChart
                    msrp={report.formData.trimData.msrp_price}
                    acquisitionTax={Math.round(report.acqTaxResult.finalTax / 10000)}
                    annualAutoTax={Math.round(report.autoTaxResult.discountedTotal / 10000)}
                    residual5yr={report.residual5yr}
                    annualInsurance={insuranceData?.annual ?? undefined}
                    monthlyFuel={monthlyFuelMk ?? undefined}
                    preCalcMonthly={(() => {
                      const cmp = calculateComparison({
                        carPriceMk: report.formData.trimData.msrp_price,
                        modelName: report.formData.model,
                        vehicleAge: 0,
                        isEV: report.isEV,
                        isHEV: report.isHybrid,
                        acquisitionVehicleType: '승용',
                        cc: report.cc,
                        ownershipYears: 5,
                        annualKm: 20000,
                        insuranceAnnual: 0,
                        businessType: 'none',
                        industry: 'service',
                        revenueRange: '5k-1eok',
                        businessUseRatio: 0,
                      });
                      return {
                        installment: Math.round(cmp.installment.monthlyPayment / 10000),
                        lease:       Math.round(cmp.lease.monthlyPayment       / 10000),
                        rent:        Math.round(cmp.rent.monthlyPayment        / 10000),
                      };
                    })()}
                  />
                </div>

                <div className="border-t border-[#F2F2F7] pt-4">
                  <CostComparisonTable
                    msrp={report.formData.trimData.msrp_price}
                    acquisitionTax={Math.round(report.acqTaxResult.finalTax / 10000)}
                    annualAutoTax={Math.round(report.autoTaxResult.discountedTotal / 10000)}
                    residual5yr={report.residual5yr}
                    annualInsurance={insuranceData?.annual ?? undefined}
                    ageGroup={report.formData.ageGroup}
                    monthlyFuel={monthlyFuelMk ?? undefined}
                    preCalcMonthly={(() => {
                      const cmp = calculateComparison({
                        carPriceMk: report.formData.trimData.msrp_price,
                        modelName: report.formData.model,
                        vehicleAge: 0,
                        isEV: report.isEV,
                        isHEV: report.isHybrid,
                        acquisitionVehicleType: '승용',
                        cc: report.cc,
                        ownershipYears: 5,
                        annualKm: 20000,
                        insuranceAnnual: 0,
                        businessType: 'none',
                        industry: 'service',
                        revenueRange: '5k-1eok',
                        businessUseRatio: 0,
                      });
                      return {
                        installment: Math.round(cmp.installment.monthlyPayment / 10000),
                        lease:       Math.round(cmp.lease.monthlyPayment       / 10000),
                        rent:        Math.round(cmp.rent.monthlyPayment        / 10000),
                      };
                    })()}
                  />
                </div>
              </ReportSection>

              {/* ── 섹션6: EV 충전비 분석 (EV 차량만) ──────────── */}
              {report.isEV && evStats && (
                <ReportSection
                  title="EV 충전비 분석"
                  subtitle="월 충전비 추정 · 주유 대비 절감액 · 전국 충전 인프라"
                  badgeColor="#34C759"
                  badge="전기차 전용"
                >
                  <EvChargingCard
                    mileageGroup={report.formData.mileageGroup}
                    stats={evStats}
                  />
                </ReportSection>
              )}

              {/* ── 섹션7: 절세 효과 (사업자만) ──────────────────── */}
              {(report.formData.businessType === 'individual_business' ||
                report.formData.businessType === 'corporation') && (
                <ReportSection
                  title="절세 효과 분석"
                  subtitle="업무용 차량 비용처리 기준"
                  badgeColor="#34C759"
                  badge="사업자 전용"
                >
                  <TaxSavingCard
                    businessType={report.formData.businessType}
                    monthlyRentMk={
                      // 장기렌트 60개월 기준 월납입금을 절세 기준으로 사용
                      calcMonthly(report.formData.trimData.msrp_price, 'rent', 60, 0, 20000)
                    }
                  />
                </ReportSection>
              )}

              {/* ── 하단 CTA ───────────────────────────────────────── */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#F2F2F7] p-5 text-center diagnosis-no-print">
                <p className="text-[14px] font-bold text-[#1C1C1E] mb-1">
                  장기렌트가 유리한지 확인해 보셨나요?
                </p>
                <p className="text-[12px] text-[#8E8E93] mb-4">
                  렌테일러 전문가가 무료로 최적 조건을 비교해 드립니다
                </p>
                <Button
                  variant="primary"
                  fullWidth
                  className="!bg-[#007AFF] !rounded-2xl"
                  onClick={handleQuoteClick}
                >
                  무료 견적 받기
                </Button>
              </div>

              {/* PDF 전용 면책문구 (화면에서는 숨김) */}
              <div className="diagnosis-print-footer">
                ※ 본 진단 결과는 참고용 추정치이며, 정확한 세무·보험·금융 상담은 전문가에게 문의하시기 바랍니다.
                렌탈료·보험료·세금은 실제 계약 조건에 따라 달라질 수 있습니다. rentailor.co.kr
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
