'use client';

import { useState, useEffect, useRef } from 'react';
import { DEFAULT_AI_CONFIG, getConfigHash } from '@/data/diagnosis-ai';
import type { AIConfig } from '@/types/diagnosis';

// 세션 단위 호출 카운트 & 캐시 (모듈 스코프)
let callCount = 0;
const cache = new Map<string, string>();

interface ParkAIProps {
  ctx: string;
  cfg?: AIConfig;
}

export function ParkAI({ ctx, cfg }: ParkAIProps) {
  const config = cfg ?? DEFAULT_AI_CONFIG;
  const [comment, setComment] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const cacheKey = ctx + getConfigHash(config);

    // 캐시 히트
    if (cache.has(cacheKey)) {
      setComment(cache.get(cacheKey)!);
      return;
    }

    // 한도 초과
    if (callCount >= config.maxCalls) {
      const fallback = config.fallbacks[callCount % config.fallbacks.length];
      setComment(fallback);
      return;
    }

    setLoading(true);
    callCount++;

    fetch('/api/ai-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: ctx, config }),
    })
      .then((r) => r.json())
      .then((data) => {
        const text: string = data.comment || config.fallbacks[0];
        cache.set(cacheKey, text);
        setComment(text);
      })
      .catch(() => {
        const fallback = config.fallbacks[Math.floor(Math.random() * config.fallbacks.length)];
        setComment(fallback);
      })
      .finally(() => setLoading(false));
  }, [ctx, config]);

  const remaining = Math.max(0, config.maxCalls - callCount);

  return (
    <div
      className="rounded-2xl p-5 mb-4 text-white"
      style={{ background: 'linear-gradient(135deg, #1D1D1F, #2C2C2E)' }}
    >
      <div className="flex items-start gap-3">
        {/* 캐릭터 아이콘 */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: config.bgColor }}
        >
          {config.charEmoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-sm font-bold text-white">{config.charTitle}</p>
              <p className="text-xs text-white/60">{config.charSubtitle}</p>
            </div>
            <span className="text-[10px] text-white/40 shrink-0 ml-2">
              {remaining}/{config.maxCalls}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse delay-100" />
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse delay-200" />
              <span className="text-xs text-white/50 ml-1">분석 중...</span>
            </div>
          ) : (
            <p className="text-sm text-white/85 leading-relaxed mt-1">{comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}
