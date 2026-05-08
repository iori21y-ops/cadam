'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';

interface FeedbackWidgetProps {
  type: 'finance' | 'vehicle' | 'option';
  mode: 'basic' | 'detail';
  result: Record<string, unknown>; // 진단 결과 요약
  answers: Record<string, { value: string; label: string }>;
}

type Rating = 1 | 2 | 3 | 4 | 5;

const RATING_LABELS: Record<Rating, string> = {
  1: '별로예요',
  2: '아쉬워요',
  3: '보통이에요',
  4: '도움됐어요',
  5: '정확해요!',
};

const RATING_EMOJIS: Record<Rating, string> = {
  1: '😕',
  2: '🤔',
  3: '😐',
  4: '😊',
  5: '🎯',
};

export function FeedbackWidget({ type, mode, result, answers }: FeedbackWidgetProps) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRating = async (r: Rating) => {
    if (submitted || submitting) return;
    setRating(r);
    setSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();

      // IP 해싱 (프라이버시 보호)
      const ipHash = await getIpHash();

      await supabase.from('diagnosis_logs').insert({
        type,
        mode,
        answers: sanitizeAnswers(answers),
        result,
        satisfaction: r,
        ip_hash: ipHash,
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Feedback submit error:', err);
      // 실패해도 UI는 성공으로 처리 (UX)
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 rounded-2xl bg-surface shadow-sm text-center">
        <p className="text-sm text-text">
          {RATING_EMOJIS[rating!]} 피드백 감사합니다!
        </p>
        <p className="text-xs text-text-muted mt-1">
          더 나은 진단 서비스를 위해 활용됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-surface shadow-sm">
      <p className="text-sm font-bold text-text text-center mb-1">진단 결과가 도움이 되셨나요?</p>
      <p className="text-xs text-text-muted text-center mb-4">피드백은 더 정확한 추천에 사용됩니다</p>
      <div className="flex justify-center gap-2">
        {([1, 2, 3, 4, 5] as Rating[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => handleRating(r)}
            disabled={submitting}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
              rating === r
                ? 'bg-primary/10 ring-2 ring-primary scale-105'
                : 'bg-surface-secondary hover:bg-surface-secondary/80'
            }`}
          >
            <span className="text-lg">{RATING_EMOJIS[r]}</span>
            <span className="text-[10px] text-text-sub font-medium">{RATING_LABELS[r]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * 브라우저에서 IP 해시 생성 (실제 IP 미전송)
 */
async function getIpHash(): Promise<string> {
  try {
    // 간단한 fingerprint 기반 해시 (IP 대신)
    const raw = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().toISOString().slice(0, 10), // 날짜별 그루핑
    ].join('|');

    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const arr = Array.from(new Uint8Array(hash));
    return arr.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  } catch {
    return 'unknown';
  }
}

/**
 * 답변에서 민감정보 제거 (value와 label만 저장)
 */
function sanitizeAnswers(
  answers: Record<string, { value: string; label: string }>
): Record<string, { value: string; label: string }> {
  const result: Record<string, { value: string; label: string }> = {};
  for (const [key, ans] of Object.entries(answers)) {
    result[key] = { value: ans.value, label: ans.label };
  }
  return result;
}
