/**
 * 렌트 / 리스 / 할부 총비용 비교 엔진
 *
 * 설계 원칙
 * ─────────────────────────────────────────────────────────────────────
 * • 내부 단위: 모두 원(₩). calcMonthly(만원) → ×10,000 변환.
 * • 리스는 운영리스 기준 (보험·자동차세는 이용자 부담).
 * • 렌트 월납입에는 보험·정비·세금 마크업(+12%)이 포함됨 — 별도 계상 없음.
 * • 계약기간 = min(보유연수×12, 60개월).
 * • 결과는 ±오차 범위(low/mid/high)로 반환.
 */

import { calcMonthly, DEFAULT_RATES, DEFAULT_RENT_INSURANCE_RATE } from '@/lib/calc-monthly';
import {
  calculateAcquisitionTax,
  type AcquisitionVehicleType,
} from '@/lib/domain/acquisition-tax-calculator';
import { calculateAutoTax } from '@/lib/domain/auto-tax-calculator';
import { calculateDepreciation } from '@/lib/domain/depreciation-calculator';
import {
  calculateTaxSaving,
  type Industry,
  type RevenueRange,
  type MonthlyBudgetRange,
} from '@/lib/domain/tax-calculator';

// ── ±오차 기준 상수 ───────────────────────────────────────────────────

const TOLERANCE = {
  depreciation: 0.15,  // 잔존가치 ±15%
  maintenance:  0.20,  // 정비비 ±20%
  insurance:    0.10,  // 보험료 ±10%
  rent:         0.05,  // 렌트 총비용 ±5%
} as const;

// ── 공개 타입 ─────────────────────────────────────────────────────────

export interface ComparisonInputs {
  carPriceMk:             number;                 // 차량가 (만원)
  modelName:              string;                 // 모델명 (감가상각 테이블 조회용)
  vehicleAge:             number;                 // 현재 차령 (년, 신차=0)
  isEV:                   boolean;
  isHEV:                  boolean;
  acquisitionVehicleType: AcquisitionVehicleType; // 취등록세 차종
  cc:                     number;                 // 배기량 (EV=0)
  ownershipYears:         number;                 // 보유 계획 (1-7)
  annualKm:               number;                 // 연간 주행거리 (km)
  insuranceAnnual:        number;                 // 연간 보험료 (원)
  businessType:           'corporation' | 'individual' | 'none';
  industry:               Industry;
  revenueRange:           RevenueRange;
  businessUseRatio:       number;                 // 0-1
}

export interface CostBreakdownDetail {
  payments:     number;   // 납입금 합계 (원)
  initialCost:  number;   // 취등록세 (원)
  autoTax:      number;   // 자동차세 합계 (원)
  insurance:    number;   // 보험료 합계 (원)
  maintenance:  number;   // 정비비 합계 (원)
  salvageValue: number;   // 중고매각가 (원, 할부만 양수 — 화면에서 차감 표시)
}

export interface MethodResult {
  monthlyPayment:  number;            // 월납입금 (원)
  contractMonths:  number;            // 계약기간 (개월)
  totalCostMid:    number;            // 총비용 중간값 (원)
  totalCostLow:    number;            // 총비용 최소값 (원)
  totalCostHigh:   number;            // 총비용 최대값 (원)
  breakdown:       CostBreakdownDetail;
  annualTaxSaving: number;            // 연간 절세 예상 (원, 별도 표시)
}

export interface ComparisonResult {
  rent:          MethodResult;
  lease:         MethodResult;
  installment:   MethodResult;
  contractMonths: number;
  assumptions:   string[];
}

// ── 내부 헬퍼 ─────────────────────────────────────────────────────────

function toAutoTaxVehicleType(t: AcquisitionVehicleType): 'passenger' | 'van' | 'truck' {
  if (t === '승합') return 'van';
  if (t === '화물') return 'truck';
  return 'passenger';
}

/** 차령·가격 기반 월 정비비 추산 (원/월) */
function calcMaintenanceMonthly(avgAgeYears: number, carPriceMk: number): number {
  const base = avgAgeYears <= 3  ? 30_000
    : avgAgeYears <= 6  ? 70_000
    : avgAgeYears <= 10 ? 120_000
    : 180_000;
  const priceMult = Math.max(0.7, Math.min(1.8, carPriceMk / 3_000));
  return Math.round(base * priceMult);
}

function toMonthlyBudgetRange(monthlyWon: number): MonthlyBudgetRange {
  if (monthlyWon < 400_000) return 'w300k';
  if (monthlyWon < 600_000) return 'w500k';
  if (monthlyWon < 850_000) return 'w700k';
  if (monthlyWon < 1_250_000) return 'w1m';
  return 'over1p5m';
}

function calcAnnualTaxSaving(
  inputs: ComparisonInputs,
  monthlyPaymentWon: number,
): number {
  if (inputs.businessType === 'none' || inputs.businessUseRatio === 0) return 0;
  const base = calculateTaxSaving({
    businessType:  inputs.businessType as 'corporation' | 'individual',
    industry:      inputs.industry,
    revenue:       inputs.revenueRange,
    vehicleStatus: 'planning',
    monthlyBudget: toMonthlyBudgetRange(monthlyPaymentWon),
  });
  // base가 업종 기본 비율로 계산됨 → 사용자 입력 비율로 재스케일
  const scaled = base.businessUseRatio > 0
    ? Math.round(base.annualTaxSaving * inputs.businessUseRatio / base.businessUseRatio)
    : 0;
  return Math.max(0, scaled);
}

// ── 공개 계산 함수 ─────────────────────────────────────────────────────

export function calculateComparison(inputs: ComparisonInputs): ComparisonResult {
  const {
    carPriceMk, modelName, vehicleAge, isEV, isHEV,
    acquisitionVehicleType, cc, ownershipYears, annualKm, insuranceAnnual,
  } = inputs;

  const carPriceWon     = carPriceMk * 10_000;
  const ownershipMonths = ownershipYears * 12;
  const contractMonths  = Math.min(ownershipMonths, 60);
  const contractYears   = contractMonths / 12;
  const avgAge          = vehicleAge + ownershipYears / 2;

  // ① 자동차세 (연간)
  const autoTaxAnnual = calculateAutoTax({
    cc,
    vehicleType: toAutoTaxVehicleType(acquisitionVehicleType),
    ageYears:    Math.max(1, Math.round(avgAge)),
    isElectric:  isEV,
    isHybrid:    isHEV && !isEV,
  }).discountedTotal;

  // ② 정비비 (월간)
  const maintMonthly = calcMaintenanceMonthly(avgAge, carPriceMk);

  // ③ 취득세 (할부에만 적용)
  const acqTax = calculateAcquisitionTax({
    vehiclePrice: carPriceWon,
    vehicleType:  acquisitionVehicleType,
    isEV,
    isHEV:        isHEV && !isEV,
    isUsed:       vehicleAge > 0,
  }).finalTax;

  // ④ 잔존가치 (할부 보유 종료 시점)
  const depResult = calculateDepreciation(
    modelName,
    ownershipYears,
    'mid',
    'domestic_suv',
    carPriceMk,
  );
  const salvageMid  = depResult.currentValue * 10_000;
  const salvageLow  = Math.round(salvageMid * (1 - TOLERANCE.depreciation));
  const salvageHigh = Math.round(salvageMid * (1 + TOLERANCE.depreciation));

  // ═══ 렌트 ════════════════════════════════════════════════════════════
  // 보험·정비·세금이 월납입에 포함 — 별도 계상 없음
  const rentMonthly   = calcMonthly(carPriceMk, 'rent',        contractMonths, 0, annualKm) * 10_000;
  const rentPayments  = rentMonthly * contractMonths;
  const rentTaxSaving = calcAnnualTaxSaving(inputs, rentMonthly);

  // ═══ 리스 ════════════════════════════════════════════════════════════
  // 취등록세: 리스사 부담 / 보험·자동차세·정비: 이용자 부담 (운영리스 기준)
  const leaseMonthly   = calcMonthly(carPriceMk, 'lease',       contractMonths, 0, annualKm) * 10_000;
  const leasePayments  = leaseMonthly * contractMonths;
  const leaseAutoTax   = Math.round(autoTaxAnnual * contractYears);
  const leaseInsurance = Math.round(insuranceAnnual * contractYears);
  const leaseMaint     = maintMonthly * contractMonths;
  const leaseTotalMid  = leasePayments + leaseAutoTax + leaseInsurance + leaseMaint;
  const leaseVariance  = Math.round(
    leaseInsurance * TOLERANCE.insurance + leaseMaint * TOLERANCE.maintenance,
  );
  const leaseTaxSaving = calcAnnualTaxSaving(inputs, leaseMonthly);

  // ═══ 할부 ════════════════════════════════════════════════════════════
  // 전체 보유기간 기준 세금·보험·정비 / 계약종료 후 중고매각가 차감
  const installMonthly   = calcMonthly(carPriceMk, 'installment', contractMonths, 0, annualKm) * 10_000;
  const installPayments  = installMonthly * contractMonths;
  const installAutoTax   = Math.round(autoTaxAnnual * ownershipYears);
  const installInsurance = Math.round(insuranceAnnual * ownershipYears);
  const installMaint     = maintMonthly * ownershipMonths;
  const installTotalMid  = installPayments + acqTax + installAutoTax + installInsurance + installMaint - salvageMid;
  const installVariance  = Math.round(
    (salvageHigh - salvageLow) / 2 +
    installInsurance * TOLERANCE.insurance +
    installMaint * TOLERANCE.maintenance,
  );
  const installTaxSaving = calcAnnualTaxSaving(inputs, installMonthly);

  const acqTaxRate = isEV ? '비과세(EV)'
    : acquisitionVehicleType === '경차' ? '4%'
    : `${acquisitionVehicleType === '승합' || acquisitionVehicleType === '화물' ? 5 : 7}%`;

  const assumptions = [
    '리스는 운영리스 기준 (보험·자동차세는 이용자 부담)',
    `계약기간: ${contractMonths}개월 (보유 ${ownershipYears}년, 최대 60개월 cap)`,
    `렌트료에 보험·정비·세금 포함 (마크업 +${Math.round(DEFAULT_RENT_INSURANCE_RATE * 100)}%)`,
    `취등록세: 렌트·리스 면제 / 할부 ${acqTaxRate} 적용`,
    `감가상각: 엔카 시세 기준 ±${Math.round(TOLERANCE.depreciation * 100)}% 오차`,
    `보험료 ±${Math.round(TOLERANCE.insurance * 100)}% / 정비비 ±${Math.round(TOLERANCE.maintenance * 100)}% 오차 포함`,
    `기준 금리: 할부 ${DEFAULT_RATES.installment * 100}% / 리스 ${DEFAULT_RATES.lease * 100}% / 렌트 ${DEFAULT_RATES.rent * 100}%`,
    '절세 효과는 총비용에서 차감하지 않고 별도 표시',
  ];

  return {
    rent: {
      monthlyPayment: rentMonthly,
      contractMonths,
      totalCostMid:  rentPayments,
      totalCostLow:  Math.round(rentPayments * (1 - TOLERANCE.rent)),
      totalCostHigh: Math.round(rentPayments * (1 + TOLERANCE.rent)),
      breakdown: { payments: rentPayments, initialCost: 0, autoTax: 0, insurance: 0, maintenance: 0, salvageValue: 0 },
      annualTaxSaving: rentTaxSaving,
    },
    lease: {
      monthlyPayment: leaseMonthly,
      contractMonths,
      totalCostMid:  leaseTotalMid,
      totalCostLow:  Math.max(0, leaseTotalMid - leaseVariance),
      totalCostHigh: leaseTotalMid + leaseVariance,
      breakdown: { payments: leasePayments, initialCost: 0, autoTax: leaseAutoTax, insurance: leaseInsurance, maintenance: leaseMaint, salvageValue: 0 },
      annualTaxSaving: leaseTaxSaving,
    },
    installment: {
      monthlyPayment: installMonthly,
      contractMonths,
      totalCostMid:  installTotalMid,
      totalCostLow:  installTotalMid - installVariance,
      totalCostHigh: installTotalMid + installVariance,
      breakdown: { payments: installPayments, initialCost: acqTax, autoTax: installAutoTax, insurance: installInsurance, maintenance: installMaint, salvageValue: salvageMid },
      annualTaxSaving: installTaxSaving,
    },
    contractMonths,
    assumptions,
  };
}
