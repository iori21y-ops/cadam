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
  mode?: 'short' | 'report'; // report: 상세 분석 리포트
}

export function ParkAI({ ctx, cfg, mode = 'short' }: ParkAIProps) {
  const config = cfg ?? DEFAULT_AI_CONFIG;
  const [comment, setComment] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(mode === 'report');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const cacheKey = ctx + getConfigHash(config) + mode;

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
      body: JSON.stringify({ context: ctx, config, mode }),
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
  }, [ctx, config, mode]);

  const remaining = Math.max(0, config.maxCalls - callCount);
  const isReport = mode === 'report';

  // 리포트 모드: 줄바꿈으로 구조화된 텍스트를 파싱
  const renderComment = (text: string) => {
    if (!isReport) {
      return <p className="text-sm text-white/85 leading-relaxed mt-1">{text}</p>;
    }

    const lines = text.split('\n').filter(Boolean);
    return (
      <div className="mt-2 space-y-1.5">
        {lines.map((line, i) => {
          // 볼드 마커 처리 (**text**)
          const parts = line.split(/\*\*(.*?)\*\*/g);
          const rendered = parts.map((part, pi) =>
            pi % 2 === 1 ? (
              <strong key={pi} className="text-white font-semibold">{part}</strong>
            ) : (
              <span key={pi}>{part}</span>
            )
          );

          if (line.startsWith('━') || line.startsWith('---')) {
            return <hr key={i} className="border-white/10 my-1" />;
          }
          if (line.startsWith('##') || line.startsWith('📋') || line.startsWith('✅') || line.startsWith('⚡') || line.startsWith('💡')) {
            return (
              <p key={i} className="text-sm text-white font-semibold leading-relaxed">
                {rendered}
              </p>
            );
          }
          return (
            <p key={i} className="text-[13px] text-white/80 leading-relaxed">
              {rendered}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`rounded-2xl p-5 mb-4 text-white ${isReport ? 'cursor-pointer' : ''}`}
      style={{ background: 'linear-gradient(135deg, #1D1D1F, #2C2C2E)' }}
      onClick={isReport ? () => setExpanded(!expanded) : undefined}
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
              <p className="text-xs text-white/60">
                {isReport ? 'AI 맞춤 분석 리포트' : config.charSubtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isReport && comment && (
                <span className="text-[10px] text-white/40">
                  {expanded ? '접기' : '펼치기'}
                </span>
              )}
              <span className="text-[10px] text-white/40 shrink-0">
                {remaining}/{config.maxCalls}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
              <span className="text-xs text-white/50 ml-1">
                {isReport ? '맞춤 리포트 생성 중...' : '분석 중...'}
              </span>
            </div>
          ) : comment ? (
            isReport && !expanded ? (
              <p className="text-sm text-white/70 mt-1 line-clamp-2">{comment.split('\n')[0]}</p>
            ) : (
              renderComment(comment)
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
