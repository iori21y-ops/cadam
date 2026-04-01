import type {
  DiagnosisQuestion, DiagnosisAnswer, SkipCondition,
  FinanceScores, FinanceQuestion, FinanceRankedProduct, ProductKey,
} from '@/types/diagnosis';
import { QUESTION_REASON_MAP } from '@/data/diagnosis-finance';
import { PRODUCT_KEYS } from '@/data/diagnosis-products';

/**
 * Check if a question should be skipped based on previous answers.
 */
export function shouldSkip(
  question: DiagnosisQuestion,
  answers: Record<string, DiagnosisAnswer>
): boolean {
  if (!question.skipIf || question.skipIf.length === 0) return false;
  return question.skipIf.some((cond: SkipCondition) => {
    const prev = answers[cond.qId];
    return prev && cond.values.includes(prev.value);
  });
}

/**
 * Find next question index. Branch forward only (no infinite loops).
 * Returns -1 when quiz is complete.
 */
export function findNextIndex(
  questions: DiagnosisQuestion[],
  currentIdx: number,
  selectedOption: { nextQ?: string },
  answers: Record<string, DiagnosisAnswer>
): number {
  // 1) Conditional branch
  if (selectedOption.nextQ) {
    const targetIdx = questions.findIndex((q) => q.id === selectedOption.nextQ);
    if (targetIdx > currentIdx) return targetIdx;
  }
  // 2) Sequential, skipping where needed
  for (let i = currentIdx + 1; i < questions.length; i++) {
    if (!shouldSkip(questions[i], answers)) return i;
  }
  return -1;
}

/**
 * Calculate finance scores with weight system.
 */
export function calculateFinanceScores(
  answers: Record<string, DiagnosisAnswer>,
  questions?: FinanceQuestion[]
): { totals: FinanceScores; maxPossible: number } {
  const totals: FinanceScores = { installment: 0, lease: 0, rent: 0, cash: 0 };
  let maxPossible = 0;

  Object.entries(answers).forEach(([qId, answer]) => {
    if ('scores' in answer) {
      // 해당 질문의 가중치 찾기
      const q = questions?.find((qq) => qq.id === qId);
      const weight = q?.weight ?? 1.0;

      (Object.keys(answer.scores) as (keyof FinanceScores)[]).forEach((key) => {
        totals[key] += answer.scores[key] * weight;
      });
      maxPossible += 3 * weight;
    }
  });

  return { totals, maxPossible };
}

/**
 * Rank finance products — returns top 3 with percentages and reasons.
 */
export function rankFinanceProducts(
  answers: Record<string, DiagnosisAnswer>,
  questions: FinanceQuestion[]
): FinanceRankedProduct[] {
  const { totals, maxPossible } = calculateFinanceScores(answers, questions);

  // 각 상품별 적합도 퍼센트 계산
  const ranked = PRODUCT_KEYS.map((key) => {
    const pct = maxPossible > 0 ? Math.round((totals[key] / maxPossible) * 100) : 0;

    // 추천 이유 생성: 높은 가중치 질문에서 해당 상품에 기여한 답변 추출
    const reasons: string[] = [];
    const sortedQs = [...questions]
      .filter((q) => answers[q.id])
      .sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1));

    for (const q of sortedQs) {
      const ans = answers[q.id];
      if (!ans || !('scores' in ans)) continue;

      const reasonMap = QUESTION_REASON_MAP[q.id]?.[ans.value];
      if (reasonMap?.[key]) {
        reasons.push(reasonMap[key]);
      }
      if (reasons.length >= 3) break;
    }

    return { key, score: totals[key], pct, reasons } as FinanceRankedProduct;
  });

  // 점수 높은 순 정렬
  ranked.sort((a, b) => b.score - a.score);

  return ranked.slice(0, 3);
}

/**
 * Get key factors that influenced the result.
 */
export function getKeyFactors(
  answers: Record<string, DiagnosisAnswer>,
  questions: FinanceQuestion[],
  bestKey: ProductKey
): { questionId: string; label: string; impact: string }[] {
  const factors: { questionId: string; label: string; impact: string; weight: number; score: number }[] = [];

  for (const q of questions) {
    const ans = answers[q.id];
    if (!ans || !('scores' in ans)) continue;

    const score = ans.scores[bestKey];
    const weight = q.weight ?? 1;

    if (score >= 2) {
      factors.push({
        questionId: q.id,
        label: ans.label,
        impact: score === 3 ? '매우 유리' : '유리',
        weight,
        score: score * weight,
      });
    }
  }

  return factors
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ questionId, label, impact }) => ({ questionId, label, impact }));
}

/**
 * Score vehicles by tag matching.
 */
export function scoreByTags<T extends { tags?: string[]; quizTags?: string[]; class?: string }>(
  items: T[],
  answerTags: string[],
  topN: number = 4
): (T & { score: number })[] {
  return items
    .map((item) => {
      let score = 0;
      const itemTags = item.quizTags || item.tags || [];
      answerTags.forEach((tag) => {
        if (itemTags.includes(tag)) score++;
        if (item.class === tag) score++;
      });
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
