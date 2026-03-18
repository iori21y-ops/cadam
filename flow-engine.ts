import type { DiagnosisQuestion, DiagnosisAnswer, SkipCondition, FinanceScores } from '@/types/diagnosis';

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
 * Calculate finance scores from answers.
 */
export function calculateFinanceScores(
  answers: Record<string, DiagnosisAnswer>
): { totals: FinanceScores; maxPossible: number } {
  const totals: FinanceScores = { installment: 0, lease: 0, rent: 0, cash: 0 };
  let count = 0;

  Object.values(answers).forEach((answer) => {
    if ('scores' in answer) {
      count++;
      (Object.keys(answer.scores) as (keyof FinanceScores)[]).forEach((key) => {
        totals[key] += answer.scores[key];
      });
    }
  });

  return { totals, maxPossible: count * 3 };
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
