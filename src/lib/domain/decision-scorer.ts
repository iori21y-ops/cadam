/**
 * 렌트 / 리스 / 할부 추천 점수 엔진
 *
 * 1차 hard exclude: 일반번호판 선호 시 렌트 제외
 * 2차 가중점수 (100점): 보험 25% / 세금 20% / 보유기간 20% / 초기비용 15% / 편의 10% / 자산 10%
 * 보정: 보험경력·법인·장기보유·계약종료 조건별 가산/감산
 */

import type { ComparisonResult, MethodResult } from '@/lib/domain/comparison-engine';

// ── 공개 타입 ─────────────────────────────────────────────────────────

export type InsuranceHistory = 'none' | 'under1y' | '1-3y' | '3y+normal' | '3y+good';
export type PlatePreference  = 'standard' | 'any';
export type ContractEndOption = 'return' | 'purchase' | 'renew';
export type CustomerType = 'corporation' | 'individual' | 'employee' | 'other';
export type ProductMethod = 'rent' | 'lease' | 'installment';

export interface ScorerInputs {
  customerType:      CustomerType;
  insuranceHistory:  InsuranceHistory;
  ownershipYears:    number;
  platePreference:   PlatePreference;
  contractEndOption: ContractEndOption;
  businessUseRatio:  number;   // 0-1
  comparison:        ComparisonResult;
}

export interface ScoredMethod {
  method:        ProductMethod;
  label:         string;
  score:         number;       // 0-100
  rank:          1 | 2 | 3;
  excluded:      boolean;
  excludeReason: string;
  keyReasons:    string[];     // 2-3개 핵심 이유
  result:        MethodResult;
}

export interface DecisionResult {
  ranked:        ScoredMethod[];
  topMethod:     ProductMethod;
  summary:       string;
}

// ── 내부: 기본 점수 테이블 ─────────────────────────────────────────────

type ScoreKey = 'insurance' | 'tax_corp' | 'tax_ind' | 'hold_short' | 'hold_mid' | 'hold_long' | 'initial' | 'convenience' | 'asset';

const BASE: Record<ProductMethod, Record<ScoreKey, number>> = {
  rent:        { insurance: 95, tax_corp: 90, tax_ind: 20, hold_short: 95, hold_mid: 60, hold_long: 30, initial: 90, convenience: 95, asset: 10 },
  lease:       { insurance: 50, tax_corp: 90, tax_ind: 20, hold_short: 80, hold_mid: 80, hold_long: 50, initial: 70, convenience: 60, asset: 50 },
  installment: { insurance: 50, tax_corp: 60, tax_ind: 10, hold_short: 30, hold_mid: 60, hold_long: 95, initial: 30, convenience: 40, asset: 95 },
};

const W = {
  insurance:   0.25,
  tax:         0.20,
  ownership:   0.20,
  initial:     0.15,
  convenience: 0.10,
  asset:       0.10,
};

const LABELS: Record<ProductMethod, string> = {
  rent:        '장기렌트',
  lease:       '운영리스',
  installment: '할부 구매',
};

// ── 내부 헬퍼 ─────────────────────────────────────────────────────────

function fmtMk(won: number): string {
  return `${Math.round(won / 10_000).toLocaleString()}만원`;
}

function buildReasons(
  method: ProductMethod,
  inputs: ScorerInputs,
): string[] {
  const cmp = inputs.comparison;
  const r   = cmp[method];
  const reasons: string[] = [];

  if (method === 'rent') {
    if (inputs.insuranceHistory === 'none' || inputs.insuranceHistory === 'under1y')
      reasons.push('보험 경력 없어도 자가보험 포함 → 보험료 부담 없음');
    if (inputs.ownershipYears <= 3)
      reasons.push(`${inputs.ownershipYears}년 단기 보유에 최적`);
    reasons.push(`보험·정비·세금 포함 정액 월 ${fmtMk(r.monthlyPayment)}`);
  } else if (method === 'lease') {
    if (inputs.contractEndOption === 'purchase')
      reasons.push('계약 종료 후 인수 시 자산화 가능');
    if (inputs.customerType === 'corporation' || inputs.customerType === 'individual')
      reasons.push('법인·사업자 비용처리 최대 활용');
    reasons.push(`초기 자금 부담 중간, 월 ${fmtMk(r.monthlyPayment)}`);
  } else {
    if (inputs.ownershipYears >= 5)
      reasons.push(`${inputs.ownershipYears}년 장기 보유 시 총비용 최저`);
    if (inputs.contractEndOption === 'purchase' || inputs.contractEndOption === 'renew')
      reasons.push('차량 자산 100% 소유, 처분 자유도 높음');
    if (cmp.installment.breakdown.salvageValue > 0)
      reasons.push(`보유 종료 후 ${fmtMk(cmp.installment.breakdown.salvageValue)} 중고 매각 예상`);
  }

  if (r.annualTaxSaving > 100_000)
    reasons.push(`연간 절세 효과 약 ${fmtMk(r.annualTaxSaving)}`);

  return reasons.slice(0, 3);
}

// ── 공개 계산 함수 ─────────────────────────────────────────────────────

export function scoreDecision(inputs: ScorerInputs): DecisionResult {
  const { customerType, insuranceHistory, ownershipYears, platePreference, contractEndOption, businessUseRatio } = inputs;
  const isBusiness = customerType === 'corporation' || customerType === 'individual';

  const holdKey: ScoreKey = ownershipYears <= 2 ? 'hold_short'
    : ownershipYears <= 4 ? 'hold_mid'
    : 'hold_long';

  const taxKey: ScoreKey = isBusiness ? 'tax_corp' : 'tax_ind';

  const methods: ProductMethod[] = ['rent', 'lease', 'installment'];
  const exclusions: Partial<Record<ProductMethod, string>> = {};

  // 1차 hard exclude
  if (platePreference === 'standard')
    exclusions.rent = '일반번호판 선호 시 렌트 불가 (영업용 번호판)';

  // 2차 가중 점수
  const scores: Record<ProductMethod, number> = { rent: 0, lease: 0, installment: 0 };

  for (const m of methods) {
    if (exclusions[m]) { scores[m] = 0; continue; }
    const b = BASE[m];
    let bonus = 0;

    if ((insuranceHistory === 'none' || insuranceHistory === 'under1y') && m === 'rent') bonus += 10;
    if (isBusiness && businessUseRatio > 0.5 && (m === 'rent' || m === 'lease')) bonus += 8;
    if (ownershipYears >= 5 && m === 'installment') bonus += 12;
    if (ownershipYears <= 2 && m === 'installment') bonus -= 25;
    if (contractEndOption === 'purchase' && m === 'lease')        bonus += 8;
    if (contractEndOption === 'purchase' && m === 'installment')  bonus += 5;
    if (contractEndOption === 'return'   && m === 'rent')         bonus += 6;

    scores[m] = Math.min(100, Math.max(0, Math.round(
      b.insurance   * W.insurance   +
      b[taxKey]     * W.tax         +
      b[holdKey]    * W.ownership   +
      b.initial     * W.initial     +
      b.convenience * W.convenience +
      b.asset       * W.asset       +
      bonus,
    )));
  }

  const sorted = methods
    .map((m) => ({ method: m, score: scores[m], excluded: !!exclusions[m], excludeReason: exclusions[m] ?? '' }))
    .sort((a, b) => b.score - a.score);

  const ranked: ScoredMethod[] = sorted.map((s, idx) => ({
    ...s,
    label:      LABELS[s.method],
    rank:       (idx + 1) as 1 | 2 | 3,
    result:     inputs.comparison[s.method],
    keyReasons: buildReasons(s.method, inputs),
  }));

  const topMethod = ranked.find((r) => !r.excluded)?.method ?? 'rent';
  const top = inputs.comparison[topMethod];

  return {
    ranked,
    topMethod,
    summary: `${LABELS[topMethod]}가 가장 유리합니다 — 월 ${fmtMk(top.monthlyPayment)} / 총 ${fmtMk(top.totalCostMid)}`,
  };
}
