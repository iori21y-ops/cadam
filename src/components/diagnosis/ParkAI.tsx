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
  mode?: 'short' | 'report';
  variant?: 'dark' | 'light';
  /** variant="light" + 정적 텍스트일 때 API 호출 없이 바로 표시 */
  staticText?: string;
}

export function ParkAI({ ctx, cfg, mode = 'short', variant = 'dark', staticText }: ParkAIProps) {
  const config = cfg ?? DEFAULT_AI_CONFIG;
  const [comment, setComment] = useState<string | null>(staticText ?? null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(mode === 'report');
  const fetchedRef = useRef(false);

  useEffect(() => {
    // 정적 텍스트면 API 호출 불필요
    if (staticText) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const cacheKey = ctx + getConfigHash(config) + mode;

    if (cache.has(cacheKey)) {
      setComment(cache.get(cacheKey)!);
      return;
    }

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
  }, [ctx, config, mode, staticText]);

  const remaining = Math.max(0, config.maxCalls - callCount);
  const isReport = mode === 'report';
  const isDark = variant === 'dark';
  const showRemaining = !staticText;

  // ─── 색상 토큰 ───
  const colors = isDark
    ? {
        bg: 'linear-gradient(135deg, #1D1D1F, #2C2C2E)',
        border: 'none',
        iconBg: config.bgColor || '#2563EB',
        title: 'text-white',
        subtitle: 'text-white/60',
        body: 'text-white/85',
        bodyMuted: 'text-white/80',
        remaining: 'text-white/40',
        loaderDot: 'bg-white/40',
        loaderText: 'text-white/50',
        hr: 'border-white/10',
        heading: 'text-white',
        bold: 'text-white font-semibold',
        collapsed: 'text-white/70',
      }
    : {
        bg: `${config.bgColor || '#2563EB'}0D`, // 5% opacity
        border: `1px solid ${config.bgColor || '#2563EB'}1F`, // 12% opacity
        iconBg: `${config.bgColor || '#2563EB'}1A`, // 10% opacity
        title: 'text-primary',
        subtitle: 'text-text-sub',
        body: 'text-text',
        bodyMuted: 'text-text-sub',
        remaining: 'text-text-muted',
        loaderDot: 'bg-primary/40',
        loaderText: 'text-primary/50',
        hr: 'border-border',
        heading: 'text-text',
        bold: 'text-text font-semibold',
        collapsed: 'text-text-sub',
      };

  // 리포트 모드 렌더링
  const renderComment = (text: string) => {
    if (!isReport) {
      return <p className={`text-sm ${colors.body} leading-relaxed mt-1`}>{text}</p>;
    }

    const lines = text.split('\n').filter(Boolean);
    return (
      <div className="mt-2 space-y-1.5">
        {lines.map((line, i) => {
          const parts = line.split(/\*\*(.*?)\*\*/g);
          const rendered = parts.map((part, pi) =>
            pi % 2 === 1 ? (
              <strong key={pi} className={colors.bold}>{part}</strong>
            ) : (
              <span key={pi}>{part}</span>
            )
          );

          if (line.startsWith('━') || line.startsWith('---')) {
            return <hr key={i} className={`${colors.hr} my-1`} />;
          }
          if (line.startsWith('##') || line.startsWith('📋') || line.startsWith('✅') || line.startsWith('⚡') || line.startsWith('💡')) {
            return (
              <p key={i} className={`text-sm ${colors.heading} font-semibold leading-relaxed`}>
                {rendered}
              </p>
            );
          }
          return (
            <p key={i} className={`text-[13px] ${colors.bodyMuted} leading-relaxed`}>
              {rendered}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`rounded-2xl p-5 mb-4 ${isReport ? 'cursor-pointer' : ''}`}
      style={{
        background: colors.bg,
        border: colors.border,
      }}
      onClick={isReport ? () => setExpanded(!expanded) : undefined}
    >
      <div className="flex items-start gap-3">
        {/* 캐릭터 아이콘 */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: colors.iconBg }}
        >
          {config.charEmoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className={`text-sm font-bold ${colors.title}`}>{config.charTitle}</p>
              <p className={`text-xs ${colors.subtitle}`}>
                {isReport ? 'AI 맞춤 분석 리포트' : config.charSubtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isReport && comment && (
                <span className={`text-[10px] ${colors.remaining}`}>
                  {expanded ? '접기' : '펼치기'}
                </span>
              )}
              {showRemaining && (
                <span className={`text-[10px] ${colors.remaining} shrink-0`}>
                  {remaining}/{config.maxCalls}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-1.5 mt-2">
              <div className={`w-1.5 h-1.5 ${colors.loaderDot} rounded-full animate-pulse`} />
              <div className={`w-1.5 h-1.5 ${colors.loaderDot} rounded-full animate-pulse`} style={{ animationDelay: '100ms' }} />
              <div className={`w-1.5 h-1.5 ${colors.loaderDot} rounded-full animate-pulse`} style={{ animationDelay: '200ms' }} />
              <span className={`text-xs ${colors.loaderText} ml-1`}>
                {isReport ? '맞춤 리포트 생성 중...' : '분석 중...'}
              </span>
            </div>
          ) : comment ? (
            isReport && !expanded ? (
              <p className={`text-sm ${colors.collapsed} mt-1 line-clamp-2`}>{comment.split('\n')[0]}</p>
            ) : (
              renderComment(comment)
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
