/**
 * 이 파일은 반드시 서버사이드(API Route)에서만 호출할 것.
 * 프론트엔드에서 직접 호출 금지. 이유: 클라이언트 조작 방지.
 */

export interface LeadScoreInput {
  stepCompleted: number;
  carModel: string | null;
  contractMonths: number | null;
  deposit: number | null;
  annualKm: number | null;
  contactMethod: string;
  financeSummary: string | null;
  vehicleAnswers: Record<string, unknown> | null;
  financeAnswers: Record<string, unknown> | null;
  inflowPage: string | null;
}

/**
 * 리드 점수 계산 (0~100)
 *
 * 배점 기준:
 * - 진단 완료 (30): 차종 진단 15 + 이용방법 진단 15
 * - 견적 조건 (30): 차종 선택 10 + 계약기간 10 + 보증금/주행거리 10
 * - 연락처 (30): 전화 30 / 이메일 20 / 카카오 15 / 건너뛰기 0
 * - 유입 경로 (10): /cars/ 경유 5 + 기타 보너스 5
 */
export function calculateLeadScore(input: LeadScoreInput): number {
  let score = 0;

  // ─── 진단 완료 (최대 30점) ───
  if (input.vehicleAnswers && Object.keys(input.vehicleAnswers).length > 0) {
    score += 15; // 차종 진단 완료
  }
  if (input.financeAnswers && Object.keys(input.financeAnswers).length > 0) {
    score += 15; // 이용방법 진단 완료
  }

  // ─── 견적 조건 (최대 30점) ───
  if (input.carModel) score += 10;
  if (input.contractMonths) score += 10;
  if ((input.deposit && input.deposit > 0) || input.annualKm) score += 10;

  // ─── 연락처 방식 (최대 30점) ───
  if (input.contactMethod === 'phone') score += 30;
  else if (input.contactMethod === 'email') score += 20;
  else if (input.contactMethod === 'kakao') score += 15;
  // skip: 0점

  // ─── 유입 경로 보너스 (최대 10점) ───
  if (input.inflowPage?.startsWith('/cars/')) score += 5;
  if (input.financeSummary) score += 5; // 이용방법 결과가 있으면

  return Math.min(score, 100);
}
