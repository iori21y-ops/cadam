/**
 * 취득세(취등록세) 계산기
 *
 * 법적 근거
 * ─────────────────────────────────────────────────────────────────────
 * • 취득세 세율:           지방세법 제12조 제1항 (자동차 취득세)
 *   - 승용 비영업:          7%
 *   - 승합·화물 비영업:     5%
 *   - 경차(1,000cc 이하):  4%
 * • 전기차 취득세 감면:    조세특례제한법 제66조 제4항 (140만원 한도)
 * • 하이브리드 취득세 감면: 조세특례제한법 제66조 제4항 (40만원 한도)
 * • 중고차 과세표준:       지방세법 제4조 제2항 (시가표준액 또는 거래가액)
 */

// ── 공개 타입 ─────────────────────────────────────────────────────────

/** 차종 구분 */
export type AcquisitionVehicleType = '승용' | '승합' | '화물' | '경차';

export interface AcquisitionTaxInputs {
  vehiclePrice: number;            // 차량 취득가액 (원)
  vehicleType: AcquisitionVehicleType; // 차종
  isEV: boolean;                   // 순수 전기차 여부 (BEV)
  isHEV: boolean;                  // 하이브리드 여부 (HEV)
  isUsed: boolean;                 // 중고차 여부
  bondDiscountRate?: number;       // 공채 매입 할인율 (0.00~1.00, 기본값 0)
                                   // Phase 2에서 지역별 공채 연동 예정
}

export interface AcquisitionTaxResult {
  acquisitionTax: number;  // 산출 취득세 (감면 전, 원)
  taxRate: number;         // 적용 세율 (0.04~0.07)
  evDiscount: number;      // 전기차 감면액 (원, 최대 140만원)
  hevDiscount: number;     // 하이브리드 감면액 (원, 최대 40만원)
  finalTax: number;        // 최종 납부 취득세 = 산출세 − 감면액 (원)
  bondAmount: number;      // 공채 매입 할인 금액 (원, Phase 2 연동 전 0)
}

// ── 내부 상수 ─────────────────────────────────────────────────────────

/**
 * 차종별 취득세율 (지방세법 제12조 제1항)
 * 영업용은 별도 세율이 적용되나, 본 계산기는 비영업용 기준
 */
const TAX_RATES: Record<AcquisitionVehicleType, number> = {
  '승용': 0.07,  // 비영업용 승용: 7%
  '승합': 0.05,  // 비영업용 승합: 5%
  '화물': 0.05,  // 비영업용 화물: 5%
  '경차': 0.04,  // 경차(1,000cc 이하): 4%
};

/** 전기차(BEV) 취득세 감면 한도 (조세특례제한법 제66조 제4항, 원) */
const EV_DISCOUNT_LIMIT = 1_400_000;

/** 하이브리드(HEV) 취득세 감면 한도 (조세특례제한법 제66조 제4항, 원) */
const HEV_DISCOUNT_LIMIT = 400_000;

// ── 공개 계산 함수 ────────────────────────────────────────────────────

export function calculateAcquisitionTax(inputs: AcquisitionTaxInputs): AcquisitionTaxResult {
  const {
    vehiclePrice,
    vehicleType,
    isEV,
    isHEV,
    bondDiscountRate = 0,
  } = inputs;

  // ① 세율 결정
  const taxRate = TAX_RATES[vehicleType];

  // ② 산출 취득세 = 취득가액 × 세율
  const acquisitionTax = Math.round(vehiclePrice * taxRate);

  // ③ EV·HEV 감면액 산출 (조세특례제한법 제66조)
  //    EV와 HEV는 중복 적용 불가 — EV 우선
  let evDiscount = 0;
  let hevDiscount = 0;

  if (isEV) {
    evDiscount = Math.min(acquisitionTax, EV_DISCOUNT_LIMIT);
  } else if (isHEV) {
    hevDiscount = Math.min(acquisitionTax, HEV_DISCOUNT_LIMIT);
  }

  // ④ 최종 취득세 = 산출세 − 감면액 (음수 방지)
  const finalTax = Math.max(0, acquisitionTax - evDiscount - hevDiscount);

  // ⑤ 공채 할인액 (Phase 2 연동 전 0, 파라미터 보존)
  const bondAmount = Math.round(vehiclePrice * bondDiscountRate);

  return {
    acquisitionTax,
    taxRate,
    evDiscount,
    hevDiscount,
    finalTax,
    bondAmount,
  };
}
