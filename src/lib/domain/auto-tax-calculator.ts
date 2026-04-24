/**
 * 자동차세 계산기
 *
 * 법적 근거
 * ─────────────────────────────────────────────────────────────────────
 * • 자동차세 세율 (비영업용):  지방세법 제127조 제1항 제1호
 * • 연식 경감률:               지방세법 제127조 제3항
 * • 지방교육세:                지방세법 제151조 제1항 (자동차세액의 30%)
 * • 전기자동차 정액세:         지방세특례제한법 제67조의2 (연 100,000원)
 */

// ── 공개 타입 ─────────────────────────────────────────────────────────

/** 차종 구분 */
export type VehicleType = 'passenger' | 'van' | 'truck';

export interface AutoTaxInputs {
  cc: number;              // 배기량 (cc) — 전기차는 모터 출력 무관, 0 입력 가능
  vehicleType: VehicleType; // 차종: 승용(passenger) / 승합(van) / 화물(truck)
  ageYears: number;        // 차령 — 최초 등록연도 기준 경과 년수 (1년차 = 1)
  isElectric: boolean;     // 순수 전기차 여부 (BEV)
  isHybrid: boolean;       // 하이브리드 여부 (HEV) — 현행법상 일반 세율 적용
}

export interface AutoTaxResult {
  autoTax: number;         // 자동차세 (원)
  localEduTax: number;     // 지방교육세 = 자동차세 × 30% (원)
  total: number;           // 세전 합계 = 자동차세 + 지방교육세 (원)
  discountRate: number;    // 연식 경감률 (0.00 ~ 0.50)
  discountedTotal: number; // 경감 후 최종 납부액 (원)
}

// ── 내부 상수 ─────────────────────────────────────────────────────────

/**
 * 승용 비영업용 cc당 세율 (지방세법 제127조 제1항 제1호)
 * • 1,000cc 이하:  cc당  80원
 * • 1,600cc 이하:  cc당 140원
 * • 1,600cc 초과:  cc당 200원
 */
const PASSENGER_RATE_PER_CC: { limit: number; rate: number }[] = [
  { limit: 1_000, rate:  80 },
  { limit: 1_600, rate: 140 },
  { limit: Infinity, rate: 200 },
];

/** 전기차 정액세 (지방세특례제한법 제67조의2, 원/년) */
const EV_FLAT_TAX = 100_000;

/** 지방교육세율 = 자동차세액의 30% (지방세법 제151조) */
const LOCAL_EDU_TAX_RATE = 0.30;

/** 연식 경감 시작 차령 (3년차부터 적용) */
const DISCOUNT_START_YEAR = 3;

/** 차령 1년당 경감률 증가폭 (5%) */
const DISCOUNT_STEP = 0.05;

/** 최대 경감률 50% (12년차 이후 동결) */
const DISCOUNT_MAX = 0.50;

// ── 내부 헬퍼 ─────────────────────────────────────────────────────────

/** 배기량(cc)으로 승용 비영업용 자동차세를 계산한다 */
function calcPassengerTax(cc: number): number {
  const bracket = PASSENGER_RATE_PER_CC.find((b) => cc <= b.limit);
  return (bracket?.rate ?? 200) * cc;
}

/**
 * 차령에 따른 연식 경감률을 반환한다 (지방세법 제127조 제3항).
 * • 1~2년차: 0%
 * • 3년차:   5%
 * • 4년차:  10%
 * •  …
 * • 12년차 이후: 50% (상한)
 */
function getDiscountRate(ageYears: number): number {
  if (ageYears < DISCOUNT_START_YEAR) return 0;
  return Math.min((ageYears - 2) * DISCOUNT_STEP, DISCOUNT_MAX);
}

// ── 공개 계산 함수 ────────────────────────────────────────────────────

export function calculateAutoTax(inputs: AutoTaxInputs): AutoTaxResult {
  const { cc, vehicleType, ageYears, isElectric } = inputs;

  // ① 기본 자동차세 산출
  //    전기차: 차종 무관 정액 / HEV: 일반 세율 동일 / 승합·화물: 승용 기준 cc 세율로 근사
  //    ※ 승합(8인 이상)·화물은 지방세법상 승차정원·최대적재량 기준 정액이 원칙이나,
  //      cc 단일 입력 구조에서는 승용 세율로 근사한다.
  let autoTax: number;
  if (isElectric) {
    autoTax = EV_FLAT_TAX;
  } else {
    switch (vehicleType) {
      case 'passenger':
        autoTax = calcPassengerTax(cc);
        break;
      case 'van':
      case 'truck':
        autoTax = calcPassengerTax(cc);
        break;
    }
  }

  // ② 지방교육세 = 자동차세 × 30%
  const localEduTax = Math.round(autoTax * LOCAL_EDU_TAX_RATE);

  // ③ 세전 합계
  const total = autoTax + localEduTax;

  // ④ 연식 경감 적용 (전기차 정액세에는 경감률 미적용 — 이미 감면 세율)
  const discountRate = isElectric ? 0 : getDiscountRate(ageYears);
  const discountedTotal = Math.round(total * (1 - discountRate));

  return {
    autoTax,
    localEduTax,
    total,
    discountRate,
    discountedTotal,
  };
}
