/**
 * 사업자용 업무용승용차 절세 진단 계산기
 *
 * 법적 근거
 * ─────────────────────────────────────────────────────────────────────
 * • 업무용승용차 비용처리 연 한도 1,500만원 (운행일지 미작성 시)
 *   - 법인:  법인세법 시행령 §50의2
 *   - 개인:  소득세법 시행령 §78의3
 * • 감가상각 연 800만원 / 유지비 연 700만원 구분 (합계 1,500만원)
 * • 업무전용보험 의무: 복식부기의무자가 2대 이상 보유 시
 * • 개인 종합소득세 세율: 소득세법 §55
 * • 법인세 세율:         법인세법 §55
 */

// ── 공개 타입 ─────────────────────────────────────────────────────────

export type BusinessType = 'corporation' | 'individual';

export type Industry = 'construction' | 'retail' | 'food' | 'service' | 'freelance';

/** 연 매출 구간 */
export type RevenueRange =
  | 'under5k'      // 5,000만원 미만
  | '5k-1eok'      // 5,000만 ~ 1억
  | '1eok-3eok'    // 1억 ~ 3억
  | '3eok-10eok'   // 3억 ~ 10억
  | 'over10eok';   // 10억 이상

export type VehicleStatus = 'none' | 'owned' | 'planning';

/** 월 차량 관련 예산 구간 */
export type MonthlyBudgetRange =
  | 'w300k'      // 30만원
  | 'w500k'      // 50만원
  | 'w700k'      // 70만원
  | 'w1m'        // 100만원
  | 'over1p5m';  // 150만원 이상

export interface DiagnosisInputs {
  businessType:  BusinessType;
  industry:      Industry;
  revenue:       RevenueRange;
  vehicleStatus: VehicleStatus;
  monthlyBudget: MonthlyBudgetRange;
}

export interface DiagnosisResult {
  annualCarExpense:     number;   // 연간 실제 차량 비용
  deductibleExpense:    number;   // 비용처리 가능 금액 (한도·비율 적용 후)
  marginalTaxRate:      number;   // 한계세율 (0.06 ~ 0.45)
  annualTaxSaving:      number;   // 연간 절세 예상액
  businessUseRatio:     number;   // 업무사용비율 (0.60 ~ 0.90)
  expenseLimitApplied:  boolean;  // 연 1,500만원 한도 적용 여부
}

// ── 내부 상수 ─────────────────────────────────────────────────────────

/** 업종별 추정 업무사용비율 */
const BUSINESS_USE_RATIOS: Record<Industry, number> = {
  construction: 0.90,  // 건설업
  retail:       0.85,  // 도소매업
  food:         0.70,  // 음식업
  service:      0.60,  // 서비스업
  freelance:    0.65,  // 프리랜서·1인기업
};

/**
 * 운행일지 미작성 시 업무용승용차 연 비용처리 한도
 * (감가상각 800만원 + 유지비 700만원)
 * 법인세법 시행령 §50의2 / 소득세법 시행령 §78의3
 */
const ANNUAL_EXPENSE_LIMIT = 15_000_000;

/** 연 매출 구간별 대표 소득 (한계세율 산정용) */
const REVENUE_REPRESENTATIVE: Record<RevenueRange, number> = {
  'under5k':    35_000_000,
  '5k-1eok':    75_000_000,
  '1eok-3eok':  200_000_000,
  '3eok-10eok': 650_000_000,
  'over10eok':  1_500_000_000,
};

/** 월 예산 구간별 대표값 (원) */
const MONTHLY_BUDGET_VALUES: Record<MonthlyBudgetRange, number> = {
  w300k:    300_000,
  w500k:    500_000,
  w700k:    700_000,
  w1m:    1_000_000,
  over1p5m: 1_800_000,
};

interface TaxBracket { limit: number; rate: number; }

/**
 * 개인 종합소득세 누진 세율 구간 — 소득세법 §55
 * 6%(~1,400만) / 15%(~5,000만) / 24%(~8,800만) / 35%(~1.5억)
 * 38%(~3억) / 40%(~5억) / 42%(~10억) / 45%(10억~)
 */
const INDIVIDUAL_BRACKETS: TaxBracket[] = [
  { limit: 14_000_000,      rate: 0.06 },
  { limit: 50_000_000,      rate: 0.15 },
  { limit: 88_000_000,      rate: 0.24 },
  { limit: 150_000_000,     rate: 0.35 },
  { limit: 300_000_000,     rate: 0.38 },
  { limit: 500_000_000,     rate: 0.40 },
  { limit: 1_000_000_000,   rate: 0.42 },
  { limit: Infinity,        rate: 0.45 },
];

/**
 * 법인세 세율 구간 — 법인세법 §55
 * 9%(~2억) / 19%(~200억) / 21%(200억~)
 */
const CORPORATE_BRACKETS: TaxBracket[] = [
  { limit: 200_000_000,     rate: 0.09 },
  { limit: 20_000_000_000,  rate: 0.19 },
  { limit: Infinity,        rate: 0.21 },
];

function getMarginalRate(income: number, brackets: TaxBracket[]): number {
  for (const b of brackets) {
    if (income <= b.limit) return b.rate;
  }
  return brackets[brackets.length - 1].rate;
}

// ── 공개 계산 함수 ────────────────────────────────────────────────────

export function calculateTaxSaving(inputs: DiagnosisInputs): DiagnosisResult {
  const monthlyBudget      = MONTHLY_BUDGET_VALUES[inputs.monthlyBudget];
  const annualCarExpense   = monthlyBudget * 12;
  const businessUseRatio   = BUSINESS_USE_RATIOS[inputs.industry];
  const expenseLimitApplied = annualCarExpense > ANNUAL_EXPENSE_LIMIT;

  // 비용처리 가능 금액 = min(연 차량비용, 1,500만원 한도) × 업무사용비율
  const cappedExpense    = Math.min(annualCarExpense, ANNUAL_EXPENSE_LIMIT);
  const deductibleExpense = Math.round(cappedExpense * businessUseRatio);

  const income     = REVENUE_REPRESENTATIVE[inputs.revenue];
  const brackets   = inputs.businessType === 'corporation' ? CORPORATE_BRACKETS : INDIVIDUAL_BRACKETS;
  const marginalTaxRate = getMarginalRate(income, brackets);

  const annualTaxSaving = Math.round(deductibleExpense * marginalTaxRate);

  return {
    annualCarExpense,
    deductibleExpense,
    marginalTaxRate,
    annualTaxSaving,
    businessUseRatio,
    expenseLimitApplied,
  };
}
