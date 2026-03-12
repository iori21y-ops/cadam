/**
 * 이 파일은 반드시 서버사이드(API Route)에서만 호출할 것.
 * 프론트엔드에서 직접 호출 금지. 이유: 클라이언트 조작 방지.
 */

export interface LeadScoreInput {
  stepCompleted: number;
  carModel: string | null;
  contractMonths: number | null;
  deposit: number | null;
  monthlyBudget: number | null;
  inflowPage: string | null;
}

export function calculateLeadScore(input: LeadScoreInput): number {
  let score = 0;
  if (input.stepCompleted >= 6) score += 40;
  else if (input.stepCompleted >= 4) score += 20;
  else if (input.stepCompleted >= 2) score += 10;
  if (input.carModel) score += 15;
  if (input.contractMonths) score += 10;
  if (input.deposit && input.deposit > 0) score += 10;
  if (input.monthlyBudget && input.monthlyBudget >= 500000) score += 10;
  if (input.inflowPage?.startsWith('/cars/')) score += 5;
  return Math.min(score, 100);
}
