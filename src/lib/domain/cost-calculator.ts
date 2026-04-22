// 개인 차량 유지비 진단 계산기

// ── 공개 타입 ─────────────────────────────────────────────────────────

export type CarAge = '1-3' | '4-6' | '7-10' | '10+';

export type CarPrice = 'under2k' | '2k-3k' | '3k-5k' | '5k+';

export type MonthlyKm = 'under1k' | '1k-2k' | '2k-3k' | '3k+';

export type LoanPayment = 'paid' | '200-400k' | '400-600k' | '600k+';

export type AnnualInsurance = 'under500k' | '500k-800k' | '800k-1200k' | '1200k+';

export interface CostInputs {
  carAge: CarAge;
  carPrice: CarPrice;
  monthlyKm: MonthlyKm;
  loanPayment: LoanPayment;
  annualInsurance: AnnualInsurance;
}

export interface CostBreakdown {
  loan: number;
  insurance: number;
  carTax: number;
  fuel: number;
  maintenance: number;
  depreciation: number;
  misc: number;
}

export type Verdict = 'strong-rent' | 'consider-rent' | 'similar' | 'keep-car';

export interface CostResult {
  breakdown: CostBreakdown;
  totalCost: number;
  perceivedCost: number;
  hiddenCost: number;
  rentLow: number;
  rentHigh: number;
  rentMid: number;
  rentTotal: number;
  diff: number;
  verdict: Verdict;
}

// ── 내부 상수 ─────────────────────────────────────────────────────────

const LOAN_MAP: Record<LoanPayment, number> = {
  'paid':      0,
  '200-400k':  300_000,
  '400-600k':  500_000,
  '600k+':     700_000,
};

const INSURANCE_ANNUAL_MAP: Record<AnnualInsurance, number> = {
  'under500k':   400_000,
  '500k-800k':   650_000,
  '800k-1200k':  1_000_000,
  '1200k+':      1_500_000,
};

const CAR_TAX_ANNUAL_MAP: Record<CarPrice, number> = {
  'under2k': 280_000,
  '2k-3k':   400_000,
  '3k-5k':   520_000,
  '5k+':     520_000,
};

const FUEL_EFFICIENCY_MAP: Record<CarAge, number> = {
  '1-3':  13,
  '4-6':  12,
  '7-10': 10.5,
  '10+':  9,
};

const KM_MIDPOINT_MAP: Record<MonthlyKm, number> = {
  'under1k': 750,
  '1k-2k':   1_500,
  '2k-3k':   2_500,
  '3k+':     3_500,
};

const MAINTENANCE_BASE_MAP: Record<CarAge, number> = {
  '1-3':  30_000,
  '4-6':  70_000,
  '7-10': 120_000,
  '10+':  180_000,
};

const MAINTENANCE_KM_MULT_MAP: Record<MonthlyKm, number> = {
  'under1k': 1.0,
  '1k-2k':   1.1,
  '2k-3k':   1.3,
  '3k+':     1.3,
};

const DEPRECIATION_RATE_MAP: Record<CarAge, number> = {
  '1-3':  0.15,
  '4-6':  0.10,
  '7-10': 0.06,
  '10+':  0.03,
};

// 만원 → 원
const CAR_PRICE_VALUE_MAP: Record<CarPrice, number> = {
  'under2k': 15_000_000,
  '2k-3k':   25_000_000,
  '3k-5k':   40_000_000,
  '5k+':     65_000_000,
};

const RENT_RANGE_MAP: Record<CarPrice, [number, number]> = {
  'under2k': [350_000, 450_000],
  '2k-3k':   [450_000, 600_000],
  '3k-5k':   [550_000, 800_000],
  '5k+':     [750_000, 1_100_000],
};

const FUEL_PRICE = 1_750; // 원/L

// ── 계산 함수 ─────────────────────────────────────────────────────────

export function calcCost(inputs: CostInputs): CostResult {
  const { carAge, carPrice, monthlyKm, loanPayment, annualInsurance } = inputs;

  const loan       = LOAN_MAP[loanPayment];
  const insurance  = Math.round(INSURANCE_ANNUAL_MAP[annualInsurance] / 12);
  const carTax     = Math.round(CAR_TAX_ANNUAL_MAP[carPrice] / 12);

  const km         = KM_MIDPOINT_MAP[monthlyKm];
  const efficiency = FUEL_EFFICIENCY_MAP[carAge];
  const fuel       = Math.round((km / efficiency) * FUEL_PRICE);

  const maintBase  = MAINTENANCE_BASE_MAP[carAge];
  const maintMult  = MAINTENANCE_KM_MULT_MAP[monthlyKm];
  const maintenance = Math.round(maintBase * maintMult);

  const carValue    = CAR_PRICE_VALUE_MAP[carPrice];
  const deprRate    = DEPRECIATION_RATE_MAP[carAge];
  const depreciation = Math.round((carValue * deprRate) / 12);

  const misc = 80_000;

  const breakdown: CostBreakdown = {
    loan, insurance, carTax, fuel, maintenance, depreciation, misc,
  };

  const totalCost = loan + insurance + carTax + fuel + maintenance + depreciation + misc;

  // 인식 비용: 할부 + 유류 + 보험
  const perceivedCost = loan + fuel + insurance;
  const hiddenCost    = totalCost - perceivedCost;

  const [rentLow, rentHigh] = RENT_RANGE_MAP[carPrice];
  const rentMid  = Math.round((rentLow + rentHigh) / 2);
  const rentTotal = rentMid + fuel;

  const diff = totalCost - rentTotal;

  let verdict: Verdict;
  if (diff > 200_000)       verdict = 'strong-rent';
  else if (diff > 50_000)   verdict = 'consider-rent';
  else if (diff >= -100_000) verdict = 'similar';
  else                       verdict = 'keep-car';

  return {
    breakdown,
    totalCost,
    perceivedCost,
    hiddenCost,
    rentLow,
    rentHigh,
    rentMid,
    rentTotal,
    diff,
    verdict,
  };
}
