import type { ProductKey, FinanceScores } from '@/types/diagnosis';

// ─── 통일된 금리 상수 ───
export const RATES = {
  installment: 0.055,   // 할부 5.5%/년
  lease: 0.045,         // 리스 4.5%/년
  rent: 0.05,           // 렌트 5.0%/년
} as const;

export const RENT_INSURANCE_RATE = 0.12;  // 렌트 보험·정비·세금 +12%
export const LEASE_RESIDUAL = 0.30;       // 리스 잔존가 30%
export const RENT_RESIDUAL = 0.25;        // 렌트 잔존가 25%
export const RENT_MILEAGE_SURCHARGE = 0.05; // 연 2만km 초과 시 +5%

// ─── 기본 조건 (진단 결과 표시용) ───
export const DEFAULT_PERIOD = 48;
export const DEFAULT_MILEAGE = 20000;
export const DEFAULT_DOWN_RATE = 0;

/**
 * 월 납입금 계산 (만원 단위)
 */
export function calcMonthly(
  carPrice: number,     // 만원 단위
  product: ProductKey,
  period: number = DEFAULT_PERIOD,
  downRate: number = DEFAULT_DOWN_RATE,
  mileage: number = DEFAULT_MILEAGE,
): number {
  if (product === 'cash') return 0;

  const principal = carPrice * (1 - downRate / 100);

  switch (product) {
    case 'installment': {
      const r = RATES.installment / 12;
      if (r === 0) return Math.round(principal / period);
      return Math.round(
        principal * (r * Math.pow(1 + r, period)) / (Math.pow(1 + r, period) - 1)
      );
    }
    case 'lease': {
      const residual = carPrice * LEASE_RESIDUAL;
      const leaseBase = principal - residual;
      const r = RATES.lease / 12;
      return Math.round(
        leaseBase * (r * Math.pow(1 + r, period)) / (Math.pow(1 + r, period) - 1) + residual * r
      );
    }
    case 'rent': {
      const residual = carPrice * RENT_RESIDUAL;
      const rentBase = principal - residual;
      const r = RATES.rent / 12;
      const base = rentBase * (r * Math.pow(1 + r, period)) / (Math.pow(1 + r, period) - 1) + residual * r;
      const mileageFactor = mileage > 20000 ? 1 + RENT_MILEAGE_SURCHARGE : 1.0;
      return Math.round(base * (1 + RENT_INSURANCE_RATE) * mileageFactor);
    }
  }
}

/**
 * 4개 상품 월 납입금을 한번에 계산 (진단 결과·계산기 공용)
 */
export function calcAllMonthly(
  carPrice: number,
  period: number = DEFAULT_PERIOD,
  downRate: number = DEFAULT_DOWN_RATE,
  mileage: number = DEFAULT_MILEAGE,
): FinanceScores {
  return {
    installment: calcMonthly(carPrice, 'installment', period, downRate, mileage),
    lease: calcMonthly(carPrice, 'lease', period, downRate, mileage),
    rent: calcMonthly(carPrice, 'rent', period, downRate, mileage),
    cash: 0,
  };
}

/**
 * 기준 조건 텍스트 (표시용)
 */
export function conditionLabel(
  period: number = DEFAULT_PERIOD,
  mileage: number = DEFAULT_MILEAGE,
  downRate: number = DEFAULT_DOWN_RATE,
): string {
  const parts = [`${period}개월`];
  parts.push(`연 ${mileage / 10000}만km`);
  if (downRate > 0) parts.push(`선납금 ${downRate}%`);
  return parts.join(' · ') + ' 기준';
}
