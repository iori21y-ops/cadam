/**
 * 리드 점수 계산 (다차원 분석)
 *
 * 이 파일은 반드시 서버사이드(API Route)에서만 호출할 것.
 * 프론트엔드에서 직접 호출 금지. 이유: 클라이언트 조작 방지.
 */

// ─── 타입 정의 ───

export interface LeadScoreInput {
  stepCompleted: number;
  carModel: string | null;
  contractMonths: number | null;
  deposit: number | null;
  annualKm: number | null;
  contactMethod: string;
  financeSummary: string | null;
  vehicleAnswers: Record<string, { value: string; label: string }> | null;
  financeAnswers: Record<string, { value: string; label: string }> | null;
  inflowPage: string | null;
  utmSource?: string | null;
}

/** 5개 차원별 점수 */
export interface LeadDimensions {
  /** 참여도 (0~20): 진단 완료 정도, 상세모드 참여 */
  engagement: number;
  /** 구매 의향 (0~25): 사업자/예산/신용/가격대 등 응답 기반 */
  intent: number;
  /** 견적 구체성 (0~20): 차종/계약기간/주행거리/보증금 선택 여부 */
  specificity: number;
  /** 연락 수단 (0~25): 전화>이메일>카카오>건너뛰기 */
  contact: number;
  /** 유입 품질 (0~10): 유입 경로, 진단 결과 존재 여부 */
  inflow: number;
}

export interface LeadScoreResult {
  total: number;
  dimensions: LeadDimensions;
}

// ─── 차원별 레이블 (UI 표시용) ───

export const DIMENSION_LABELS: Record<keyof LeadDimensions, string> = {
  engagement: '참여도',
  intent: '구매 의향',
  specificity: '견적 구체성',
  contact: '연락 수단',
  inflow: '유입 품질',
};

export const DIMENSION_MAX: Record<keyof LeadDimensions, number> = {
  engagement: 20,
  intent: 25,
  specificity: 20,
  contact: 25,
  inflow: 10,
};

// ─── 헬퍼: 진단 응답에서 value 추출 ───

function getAnswerValue(
  answers: Record<string, { value: string; label: string }> | null,
  questionId: string,
): string | null {
  return answers?.[questionId]?.value ?? null;
}

// ─── 이용방법 진단 기본 질문 ID 목록 ───
const FINANCE_BASIC_IDS = ['business', 'ownership', 'cycle', 'budget', 'maintenance', 'mileage', 'contract_flexibility'];
const FINANCE_DETAIL_IDS = ['price_range', 'credit', 'depreciation', 'insurance', 'tax', 'cancel'];

// ─── 차종 진단 기본/상세 질문 ID 목록 ───
const VEHICLE_BASIC_IDS = ['v_purpose', 'v_budget', 'v_people', 'v_priority', 'v_fuel', 'o_budget', 'o_safety'];
const VEHICLE_DETAIL_IDS = ['v_parking', 'v_brand', 'v_drive', 'v_tech', 'v_resale', 'o_comfort', 'o_sound'];

// ────────────────────────────────────────────────────────────
// 1. 참여도 (Engagement) — 최대 20점
// ────────────────────────────────────────────────────────────

function calcEngagement(
  vehicleAnswers: Record<string, { value: string; label: string }> | null,
  financeAnswers: Record<string, { value: string; label: string }> | null,
): number {
  let score = 0;
  const vKeys = vehicleAnswers ? Object.keys(vehicleAnswers) : [];
  const fKeys = financeAnswers ? Object.keys(financeAnswers) : [];

  // 차종 진단 참여
  if (vKeys.length > 0) score += 5;                                          // 기본 참여
  if (vKeys.filter((k) => VEHICLE_DETAIL_IDS.includes(k)).length >= 2) {
    score += 3;                                                               // 상세모드 참여
  }

  // 이용방법 진단 참여
  if (fKeys.length > 0) score += 5;                                          // 기본 참여
  const basicCount = fKeys.filter((k) => FINANCE_BASIC_IDS.includes(k)).length;
  const detailCount = fKeys.filter((k) => FINANCE_DETAIL_IDS.includes(k)).length;
  if (basicCount >= 5) score += 3;                                           // 기본 질문 대부분 응답
  if (detailCount >= 3) score += 4;                                          // 상세모드 진입 + 응답

  return Math.min(score, 20);
}

// ────────────────────────────────────────────────────────────
// 2. 구매 의향 (Intent) — 최대 25점
// ────────────────────────────────────────────────────────────

function calcIntent(
  financeAnswers: Record<string, { value: string; label: string }> | null,
): number {
  if (!financeAnswers) return 0;
  let score = 0;

  // 사업자 여부 (최대 5점) — 사업자는 세제 동기로 전환율 높음
  const business = getAnswerValue(financeAnswers, 'business');
  if (business === 'corp') score += 5;
  else if (business === 'sole') score += 4;

  // 초기 자금 여유 (최대 4점) — 예산이 있으면 전환 가능성 높음
  const budget = getAnswerValue(financeAnswers, 'budget');
  if (budget === 'rich') score += 4;
  else if (budget === 'moderate') score += 2;

  // 신용 상태 (최대 4점) — 양호하면 금융 승인 빠름
  const credit = getAnswerValue(financeAnswers, 'credit');
  if (credit === 'excellent') score += 4;
  else if (credit === 'average') score += 2;
  else if (credit === 'unknown') score += 1;

  // 차량 가격대 (최대 4점) — 고가일수록 객단가 높음
  const priceRange = getAnswerValue(financeAnswers, 'price_range');
  if (priceRange === 'premium') score += 4;
  else if (priceRange === 'high') score += 3;
  else if (priceRange === 'mid') score += 1;

  // 소유 의향 결정력 (최대 2점) — 확고한 선호 = 구매 의사 명확
  const ownership = getAnswerValue(financeAnswers, 'ownership');
  if (ownership === 'must_own' || ownership === 'use_only') score += 2;
  else if (ownership === 'flexible') score += 1;

  // 계약 안정성 (최대 3점) — 안정적이면 계약 이행 확률 높음
  const flexibility = getAnswerValue(financeAnswers, 'contract_flexibility');
  if (flexibility === 'stable') score += 3;
  else if (flexibility === 'moderate') score += 1;

  // 세금 처리 관심 (최대 3점) — 사업자의 절세 관심은 강한 전환 시그널
  const tax = getAnswerValue(financeAnswers, 'tax');
  if (business !== 'personal') {
    if (tax === 'priority') score += 3;
    else if (tax === 'some') score += 2;
  }

  return Math.min(score, 25);
}

// ────────────────────────────────────────────────────────────
// 3. 견적 구체성 (Specificity) — 최대 20점
// ────────────────────────────────────────────────────────────

function calcSpecificity(input: LeadScoreInput): number {
  let score = 0;

  if (input.carModel) score += 7;
  if (input.contractMonths) score += 5;
  if (input.annualKm) score += 4;
  if (input.deposit && input.deposit > 0) score += 4;

  return Math.min(score, 20);
}

// ────────────────────────────────────────────────────────────
// 4. 연락 수단 (Contact) — 최대 25점
// ────────────────────────────────────────────────────────────

function calcContact(contactMethod: string): number {
  switch (contactMethod) {
    case 'phone': return 25;
    case 'email': return 17;
    case 'kakao': return 12;
    default: return 0; // skip
  }
}

// ────────────────────────────────────────────────────────────
// 5. 유입 품질 (Inflow) — 최대 10점
// ────────────────────────────────────────────────────────────

function calcInflow(input: LeadScoreInput): number {
  let score = 0;

  if (input.inflowPage?.startsWith('/cars/')) score += 4; // 차량 상세에서 유입
  if (input.financeSummary) score += 3;                    // 이용방법 진단 결과 존재
  if (input.utmSource) score += 3;                         // 마케팅 채널 유입

  return Math.min(score, 10);
}

// ════════════════════════════════════════════════════════════
// 메인 함수
// ════════════════════════════════════════════════════════════

/**
 * 리드 점수 계산 (다차원)
 *
 * 배점 기준 (총 100점):
 * - 참여도 (20): 진단 완료 정도 + 상세모드 참여 여부
 * - 구매 의향 (25): 사업자 5 + 예산 4 + 신용 4 + 가격대 4 + 소유의향 2 + 안정성 3 + 세금 3
 * - 견적 구체성 (20): 차종 7 + 계약기간 5 + 주행거리 4 + 보증금 4
 * - 연락 수단 (25): 전화 25 / 이메일 17 / 카카오 12 / 건너뛰기 0
 * - 유입 품질 (10): /cars/ 경유 4 + 진단결과 3 + UTM 3
 */
export function calculateLeadScore(input: LeadScoreInput): LeadScoreResult {
  const dimensions: LeadDimensions = {
    engagement: calcEngagement(input.vehicleAnswers, input.financeAnswers),
    intent: calcIntent(input.financeAnswers),
    specificity: calcSpecificity(input),
    contact: calcContact(input.contactMethod),
    inflow: calcInflow(input),
  };

  const total = Math.min(
    dimensions.engagement +
    dimensions.intent +
    dimensions.specificity +
    dimensions.contact +
    dimensions.inflow,
    100,
  );

  return { total, dimensions };
}

// ─── 기존 호환용: 숫자만 반환 ───

export function calculateLeadScoreTotal(input: LeadScoreInput): number {
  return calculateLeadScore(input).total;
}
