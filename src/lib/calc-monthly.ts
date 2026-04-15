import type { ProductKey, FinanceScores } from '@/types/diagnosis';

// ─────────────────────────────────────────────────────────────
// 기본(폴백) 금융 조건 상수
// DB 조회 실패 시 사용. 기존 하드코딩값과 동일.
// ─────────────────────────────────────────────────────────────

export const DEFAULT_RATES = {
  installment: 0.055,   // 할부 5.5%/년
  lease: 0.045,         // 리스 4.5%/년
  rent: 0.05,           // 렌트 5.0%/년
} as const;

// 하위 호환 alias — 기존 import 코드가 깨지지 않도록 유지
export const RATES = DEFAULT_RATES;

export const DEFAULT_LEASE_RESIDUAL = 0.30;        // 리스 잔존가 30%
export const DEFAULT_RENT_RESIDUAL = 0.25;         // 렌트 잔존가 25%
export const DEFAULT_RENT_INSURANCE_RATE = 0.12;   // 렌트 보험·정비·세금 +12%
export const DEFAULT_RENT_MILEAGE_SURCHARGE = 0.05; // 연 2만km 초과 시 +5%

// 하위 호환 alias
export const LEASE_RESIDUAL = DEFAULT_LEASE_RESIDUAL;
export const RENT_RESIDUAL = DEFAULT_RENT_RESIDUAL;
export const RENT_INSURANCE_RATE = DEFAULT_RENT_INSURANCE_RATE;
export const RENT_MILEAGE_SURCHARGE = DEFAULT_RENT_MILEAGE_SURCHARGE;

export const DEFAULT_PERIOD = 48;
export const DEFAULT_MILEAGE = 20000;
export const DEFAULT_DOWN_RATE = 0;

// ─────────────────────────────────────────────────────────────
// 금융 조건 타입
// ─────────────────────────────────────────────────────────────

export interface FinanceRateConfig {
  installment: {
    annualRate: number;
  };
  lease: {
    annualRate: number;
    residualRate: number;
    depositRate: number;  // 차량가 × 이 비율 = 보증금
  };
  rent: {
    annualRate: number;
    residualRate: number;
    insuranceRate: number;
    mileageSurchargeRate: number;
    mileageBaseKm: number;
  };
}

// 기존 하드코딩값을 FinanceRateConfig 형태로 변환한 기본 설정
const DEFAULT_CONFIG: FinanceRateConfig = {
  installment: {
    annualRate: DEFAULT_RATES.installment,
  },
  lease: {
    annualRate: DEFAULT_RATES.lease,
    residualRate: DEFAULT_LEASE_RESIDUAL,
    depositRate: 0.10,
  },
  rent: {
    annualRate: DEFAULT_RATES.rent,
    residualRate: DEFAULT_RENT_RESIDUAL,
    insuranceRate: DEFAULT_RENT_INSURANCE_RATE,
    mileageSurchargeRate: DEFAULT_RENT_MILEAGE_SURCHARGE,
    mileageBaseKm: DEFAULT_MILEAGE,
  },
};

// ─────────────────────────────────────────────────────────────
// DB에서 금융 조건 조회
// ─────────────────────────────────────────────────────────────

interface FinanceRateRow {
  product_type: string;
  annual_rate: number;
  residual_rate: number | null;
  deposit_rate: number | null;
  insurance_rate: number | null;
  mileage_surcharge_rate: number | null;
  mileage_base_km: number | null;
}

/**
 * Supabase finance_rates 테이블에서 현재 유효한 금융 조건을 조회한다.
 * 조회 실패 시 DEFAULT_CONFIG(하드코딩 폴백)를 반환한다.
 */
export async function getFinanceRates(): Promise<FinanceRateConfig> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return DEFAULT_CONFIG;

    const today = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams({
      select: 'product_type,annual_rate,residual_rate,deposit_rate,insurance_rate,mileage_surcharge_rate,mileage_base_km',
      is_active: 'eq.true',
      effective_from: `lte.${today}`,
      or: `(effective_to.is.null,effective_to.gte.${today})`,
    });

    const res = await fetch(`${supabaseUrl}/rest/v1/finance_rates?${params}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      // Next.js 캐시: 1시간마다 갱신
      next: { revalidate: 3600 },
    });

    if (!res.ok) return DEFAULT_CONFIG;

    const rows: FinanceRateRow[] = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return DEFAULT_CONFIG;

    // 기본값에서 시작해 DB 값으로 덮어쓰기
    const config: FinanceRateConfig = {
      installment: { ...DEFAULT_CONFIG.installment },
      lease: { ...DEFAULT_CONFIG.lease },
      rent: { ...DEFAULT_CONFIG.rent },
    };

    for (const row of rows) {
      if (row.product_type === 'installment') {
        config.installment = {
          annualRate: row.annual_rate,
        };
      } else if (row.product_type === 'lease') {
        config.lease = {
          annualRate: row.annual_rate,
          residualRate: row.residual_rate ?? DEFAULT_LEASE_RESIDUAL,
          depositRate: row.deposit_rate ?? 0.10,
        };
      } else if (row.product_type === 'rent') {
        config.rent = {
          annualRate: row.annual_rate,
          residualRate: row.residual_rate ?? DEFAULT_RENT_RESIDUAL,
          insuranceRate: row.insurance_rate ?? DEFAULT_RENT_INSURANCE_RATE,
          mileageSurchargeRate: row.mileage_surcharge_rate ?? DEFAULT_RENT_MILEAGE_SURCHARGE,
          mileageBaseKm: row.mileage_base_km ?? DEFAULT_MILEAGE,
        };
      }
    }

    return config;
  } catch {
    return DEFAULT_CONFIG;
  }
}

// ─────────────────────────────────────────────────────────────
// 월 납입금 계산 (만원 단위)
// ─────────────────────────────────────────────────────────────

/**
 * 단일 상품 월 납입금 계산.
 *
 * @param carPrice  차량가 (만원 단위)
 * @param product   상품 종류
 * @param period    계약 기간 (개월)
 * @param downRate  선납금/보증금 비율 (%, 예: 10 → 10%)
 * @param mileage   연간 주행거리 (km)
 * @param config    금융 조건. 생략 시 DEFAULT_CONFIG(하드코딩 폴백) 사용.
 *                  기존 호출부는 config를 전달하지 않아도 동일하게 동작한다.
 */
export function calcMonthly(
  carPrice: number,
  product: ProductKey,
  period: number = DEFAULT_PERIOD,
  downRate: number = DEFAULT_DOWN_RATE,
  mileage: number = DEFAULT_MILEAGE,
  config: FinanceRateConfig = DEFAULT_CONFIG,
): number {
  if (product === 'cash') return 0;

  // 보증금/선납금을 차량가 × 비율로 계산 (기존: downRate% 적용)
  const principal = carPrice * (1 - downRate / 100);

  switch (product) {
    case 'installment': {
      const r = config.installment.annualRate / 12;
      if (r === 0) return Math.round(principal / period);
      return Math.round(
        (principal * (r * Math.pow(1 + r, period))) / (Math.pow(1 + r, period) - 1)
      );
    }
    case 'lease': {
      const residual = carPrice * config.lease.residualRate;
      const leaseBase = principal - residual;
      const r = config.lease.annualRate / 12;
      return Math.round(
        (leaseBase * (r * Math.pow(1 + r, period))) / (Math.pow(1 + r, period) - 1) +
          residual * r
      );
    }
    case 'rent': {
      const residual = carPrice * config.rent.residualRate;
      const rentBase = principal - residual;
      const r = config.rent.annualRate / 12;
      const base =
        (rentBase * (r * Math.pow(1 + r, period))) / (Math.pow(1 + r, period) - 1) +
        residual * r;
      const mileageFactor =
        mileage > config.rent.mileageBaseKm
          ? 1 + config.rent.mileageSurchargeRate
          : 1.0;
      return Math.round(base * (1 + config.rent.insuranceRate) * mileageFactor);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 4개 상품 월 납입금 일괄 계산
// ─────────────────────────────────────────────────────────────

/**
 * 4개 상품(할부·리스·렌트·현금) 월 납입금을 한 번에 계산한다.
 * 기존 호출부는 config 없이 호출해도 동일하게 동작한다.
 */
export function calcAllMonthly(
  carPrice: number,
  period: number = DEFAULT_PERIOD,
  downRate: number = DEFAULT_DOWN_RATE,
  mileage: number = DEFAULT_MILEAGE,
  config: FinanceRateConfig = DEFAULT_CONFIG,
): FinanceScores {
  return {
    installment: calcMonthly(carPrice, 'installment', period, downRate, mileage, config),
    lease: calcMonthly(carPrice, 'lease', period, downRate, mileage, config),
    rent: calcMonthly(carPrice, 'rent', period, downRate, mileage, config),
    cash: 0,
  };
}

/**
 * DB에서 금융 조건을 읽어 4개 상품 월 납입금을 계산한다 (async).
 * DB 조회 실패 시 DEFAULT_CONFIG 폴백으로 동작한다.
 */
export async function calcAllMonthlyFromDB(
  carPrice: number,
  period: number = DEFAULT_PERIOD,
  downRate: number = DEFAULT_DOWN_RATE,
  mileage: number = DEFAULT_MILEAGE,
): Promise<FinanceScores> {
  const config = await getFinanceRates();
  return calcAllMonthly(carPrice, period, downRate, mileage, config);
}

// ─────────────────────────────────────────────────────────────
// 기준 조건 텍스트 (표시용)
// ─────────────────────────────────────────────────────────────

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
