'use client';

import type { BusinessType } from './DiagnosisForm';

interface Props {
  businessType:   BusinessType;
  monthlyRentMk:  number;  // 장기렌트 월납입금 (만원)
}

type MonthlyBudgetRange =
  | 'w300k'
  | 'w500k'
  | 'w700k'
  | 'w1m'
  | 'over1p5m';

interface RevenueRange {
  label:       string;
  income:      number;  // 원
  taxRate:     number;  // 한계세율
}

// 대표 사업 규모별 한계세율 (개인: 종합소득세, 법인: 법인세)
const INDIVIDUAL_RATES: RevenueRange[] = [
  { label: '5천만원 이하',  income: 35_000_000,   taxRate: 0.15 },
  { label: '1억원 이하',    income: 75_000_000,   taxRate: 0.24 },
  { label: '3억원 이하',    income: 200_000_000,  taxRate: 0.35 },
  { label: '10억원 이하',   income: 650_000_000,  taxRate: 0.40 },
];

const CORPORATE_RATES: RevenueRange[] = [
  { label: '2억원 이하',    income: 100_000_000,  taxRate: 0.09 },
  { label: '200억원 이하',  income: 2_000_000_000, taxRate: 0.19 },
];

const BUSINESS_USE_RATIO = 0.70;     // 업무사용비율 기본값 70% (서비스업 기준)
const EXPENSE_LIMIT_WON = 15_000_000; // 연 1,500만원 한도

function toMonthlyBudgetRange(monthlyMk: number): MonthlyBudgetRange {
  const won = monthlyMk * 10000;
  if (won <= 350_000) return 'w300k';
  if (won <= 600_000) return 'w500k';
  if (won <= 850_000) return 'w700k';
  if (won <= 1_250_000) return 'w1m';
  return 'over1p5m';
}

function calcTaxSaving(
  monthlyMk: number,
  businessType: BusinessType,
): {
  annualExpense: number;      // 원
  deductible: number;         // 원
  taxRate: number;
  annualSaving: number;       // 원
  saving5yr: number;          // 원
  limitApplied: boolean;
} {
  const annualExpense = monthlyMk * 10000 * 12;
  const cappedExpense = Math.min(annualExpense, EXPENSE_LIMIT_WON);
  const deductible = Math.round(cappedExpense * BUSINESS_USE_RATIO);
  const limitApplied = annualExpense > EXPENSE_LIMIT_WON;

  const rateTable = businessType === 'corporation' ? CORPORATE_RATES : INDIVIDUAL_RATES;
  // 기본값: 중간 구간 사용
  const bracket = rateTable[Math.floor(rateTable.length / 2)];
  const taxRate = bracket.taxRate;

  const annualSaving = Math.round(deductible * taxRate);
  return { annualExpense, deductible, taxRate, annualSaving, saving5yr: annualSaving * 5, limitApplied };
}

function fmtWon(n: number) {
  const mk = Math.round(n / 10000);
  return `${mk.toLocaleString()}만원`;
}

export function TaxSavingCard({ businessType, monthlyRentMk }: Props) {
  const label = businessType === 'corporation' ? '법인' : '개인사업자';
  const result = calcTaxSaving(monthlyRentMk, businessType);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#34C75910] rounded-xl">
        <span className="text-xl">🧾</span>
        <div>
          <p className="text-[13px] font-bold text-[#1C1C1E]">
            {label} 차량 비용처리 연간 절세 예상액
          </p>
          <p className="text-[11px] text-[#8E8E93] mt-0.5">
            업무사용비율 70% · 운행일지 미작성 기준
          </p>
        </div>
        <p className="ml-auto text-[18px] font-bold text-[#34C759] shrink-0">
          {fmtWon(result.annualSaving)}
        </p>
      </div>

      <div className="space-y-0">
        {[
          {
            label: '연간 차량 비용',
            value: `${fmtWon(result.annualExpense)} / 년`,
            sub: `월 ${monthlyRentMk.toLocaleString()}만원 × 12`,
          },
          {
            label: '비용처리 가능 금액',
            value: fmtWon(result.deductible),
            sub: result.limitApplied
              ? '연 1,500만원 한도 적용 후 × 업무사용비율 70%'
              : '연간 비용 × 업무사용비율 70%',
          },
          {
            label: `적용 세율 (${label})`,
            value: `${Math.round(result.taxRate * 100)}%`,
            sub: '추정 한계세율 — 실제 세율은 세무사 확인 권장',
          },
          {
            label: '5년 누적 절세액',
            value: fmtWon(result.saving5yr),
            sub: '단순 × 5배 (세율·한도 변동 미반영)',
            highlight: true,
          },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between py-2.5 border-b border-[#F2F2F7] last:border-0"
          >
            <div>
              <p className="text-[13px] font-medium text-[#1C1C1E]">{row.label}</p>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">{row.sub}</p>
            </div>
            <p
              className={`text-[14px] font-bold ml-4 shrink-0 ${
                row.highlight ? 'text-[#34C759]' : 'text-[#1C1C1E]'
              }`}
            >
              {row.value}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-[#8E8E93] leading-relaxed">
        * 업무용승용차 비용처리 한도: 연 1,500만원 (운행일지 미작성 시). 법인세법 시행령 §50의2.
        실제 절세액은 업종·소득 규모에 따라 달라지므로 세무사 상담을 권장합니다.
      </p>
    </div>
  );
}
