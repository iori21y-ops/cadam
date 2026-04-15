'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

// ═══════════════════════════════════════════════════════
// 공통 헬퍼 — 각 아이콘에 고유 ID prefix 부여
// ═══════════════════════════════════════════════════════

/** 골드 linearGradient defs (각 아이콘 내부 — 자급자족) */
function GoldLinear({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#8B6914">
        <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
      </stop>
      <stop offset="50%" stopColor="#D4AF37" />
      <stop offset="100%" stopColor="#C9A84C">
        <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
      </stop>
    </linearGradient>
  );
}

/** 골드 radialGradient 후광 defs */
function GoldGlow({ id }: { id: string }) {
  return (
    <radialGradient id={id} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#F0D060" stopOpacity="0.07" />
      <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
    </radialGradient>
  );
}

// ═══════════════════════════════════════════
// 차량 카테고리 (6종)
// ═══════════════════════════════════════════

/** 경차 — 작고 둥근 루프 + 바퀴 글로우 */
export function IconCarCompact({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="cc-lg" />
        <GoldGlow id="cc-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#cc-rg)" />
      {/* 차체 */}
      <rect x="2" y="14.5" width="20" height="3" rx="1" stroke="url(#cc-lg)" strokeWidth="1.5" />
      <path d="M4 14.5 L6.5 11 L9 9.5 H15 L17.5 11 L20 14.5" stroke="url(#cc-lg)" strokeWidth="1.5" />
      {/* 바퀴 글로우 */}
      <circle cx="7" cy="18.5" r="2.8" fill="url(#cc-rg)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="17" cy="18.5" r="2.8" fill="url(#cc-rg)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
      </circle>
      {/* 바퀴 */}
      <circle cx="7" cy="18.5" r="1.8" stroke="url(#cc-lg)" strokeWidth="1.5" />
      <circle cx="17" cy="18.5" r="1.8" stroke="url(#cc-lg)" strokeWidth="1.5" />
    </svg>
  );
}

/** 세단 — 완만한 트렁크 슬로프 + 바퀴 글로우 + 헤드라이트 */
export function IconCarSedan({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="cse-lg" />
        <GoldGlow id="cse-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#cse-rg)" />
      {/* 차체 */}
      <rect x="1" y="14.5" width="22" height="3" rx="1" stroke="url(#cse-lg)" strokeWidth="1.5" />
      <path d="M3 14.5 L5 11 L8 9 H16 L19 11 L21 14.5" stroke="url(#cse-lg)" strokeWidth="1.5" />
      {/* 창문 분리선 */}
      <line x1="12" y1="9.5" x2="12" y2="14" stroke="url(#cse-lg)" strokeWidth="1" />
      {/* 바퀴 글로우 */}
      <circle cx="6.5" cy="18.5" r="2.8" fill="url(#cse-rg)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="17.5" cy="18.5" r="2.8" fill="url(#cse-rg)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" begin="0.4s" repeatCount="indefinite" />
      </circle>
      {/* 바퀴 */}
      <circle cx="6.5" cy="18.5" r="1.8" stroke="url(#cse-lg)" strokeWidth="1.5" />
      <circle cx="17.5" cy="18.5" r="1.8" stroke="url(#cse-lg)" strokeWidth="1.5" />
      {/* 헤드라이트 빛 */}
      <line x1="21" y1="15" x2="23" y2="14.5" stroke="#FFE082" strokeWidth="1.2">
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
      </line>
      <line x1="21.5" y1="16" x2="23" y2="16" stroke="#FFE082" strokeWidth="1">
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.3s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

/** SUV — 높고 수직적인 차체 + 바퀴 글로우 */
export function IconCarSUV({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="csu-lg" />
        <GoldGlow id="csu-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#csu-rg)" />
      {/* 차체 */}
      <rect x="1" y="14.5" width="22" height="3" rx="1" stroke="url(#csu-lg)" strokeWidth="1.5" />
      <path d="M3 14.5 L4.5 11.5 L6 8.5 H18 L19.5 11.5 L21 14.5" stroke="url(#csu-lg)" strokeWidth="1.5" />
      <line x1="12" y1="9" x2="12" y2="14" stroke="url(#csu-lg)" strokeWidth="1" />
      {/* 바퀴 글로우 */}
      <circle cx="6.5" cy="18.5" r="2.8" fill="url(#csu-rg)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="17.5" cy="18.5" r="2.8" fill="url(#csu-rg)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.8s" begin="0.6s" repeatCount="indefinite" />
      </circle>
      {/* 바퀴 */}
      <circle cx="6.5" cy="18.5" r="1.8" stroke="url(#csu-lg)" strokeWidth="1.5" />
      <circle cx="17.5" cy="18.5" r="1.8" stroke="url(#csu-lg)" strokeWidth="1.5" />
    </svg>
  );
}

/** 대형/프리미엄 — 길고 낮은 프로파일 + 별 스파클 3개 */
export function IconCarPremium({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="cp-lg" />
        <GoldGlow id="cp-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#cp-rg)" />
      {/* 차체 */}
      <rect x="1" y="15" width="22" height="2.5" rx="1" stroke="url(#cp-lg)" strokeWidth="1.5" />
      <path d="M2 15 L4.5 12 L7.5 10.5 H16.5 L19.5 12 L22 15" stroke="url(#cp-lg)" strokeWidth="1.5" />
      <line x1="13" y1="11" x2="13" y2="14.5" stroke="url(#cp-lg)" strokeWidth="1" />
      {/* 바퀴 */}
      <circle cx="6.5" cy="18.5" r="2.8" fill="url(#cp-rg)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="17.5" cy="18.5" r="2.8" fill="url(#cp-rg)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" begin="0.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="6.5" cy="18.5" r="1.8" stroke="url(#cp-lg)" strokeWidth="1.5" />
      <circle cx="17.5" cy="18.5" r="1.8" stroke="url(#cp-lg)" strokeWidth="1.5" />
      {/* 프리미엄 스파클 3개 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="0s" repeatCount="indefinite" />
        <line x1="4" y1="7" x2="4" y2="9.5" stroke="#FFE082" strokeWidth="1.3" />
        <line x1="2.75" y1="8.25" x2="5.25" y2="8.25" stroke="#FFE082" strokeWidth="1.3" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
        <line x1="12" y1="4.5" x2="12" y2="7" stroke="#FFE082" strokeWidth="1.3" />
        <line x1="10.75" y1="5.75" x2="13.25" y2="5.75" stroke="#FFE082" strokeWidth="1.3" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="1.2s" repeatCount="indefinite" />
        <line x1="20" y1="7" x2="20" y2="9.5" stroke="#FFE082" strokeWidth="1.3" />
        <line x1="18.75" y1="8.25" x2="21.25" y2="8.25" stroke="#FFE082" strokeWidth="1.3" />
      </g>
    </svg>
  );
}

/** 미니밴 — 넓고 높은 패밀리카 + 창문 3개 + 바퀴 글로우 */
export function IconCarMinivan({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="cmv-lg" />
        <GoldGlow id="cmv-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#cmv-rg)" />
      {/* 차체 */}
      <rect x="1" y="14.5" width="22" height="3" rx="1" stroke="url(#cmv-lg)" strokeWidth="1.5" />
      <path d="M3 14.5 L4 11.5 L5.5 8 H18.5 L20 11.5 L21 14.5" stroke="url(#cmv-lg)" strokeWidth="1.5" />
      {/* 창문 3개 */}
      <rect x="5.5" y="9" width="3" height="4" rx="0.5" stroke="url(#cmv-lg)" strokeWidth="1">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" begin="0s" repeatCount="indefinite" />
      </rect>
      <rect x="10.5" y="9" width="3" height="4" rx="0.5" stroke="url(#cmv-lg)" strokeWidth="1">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" begin="0.5s" repeatCount="indefinite" />
      </rect>
      <rect x="15.5" y="9" width="3" height="4" rx="0.5" stroke="url(#cmv-lg)" strokeWidth="1">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" begin="1s" repeatCount="indefinite" />
      </rect>
      {/* 바퀴 */}
      <circle cx="6.5" cy="18.5" r="2.8" fill="url(#cmv-rg)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="17.5" cy="18.5" r="2.8" fill="url(#cmv-rg)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" begin="0.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="6.5" cy="18.5" r="1.8" stroke="url(#cmv-lg)" strokeWidth="1.5" />
      <circle cx="17.5" cy="18.5" r="1.8" stroke="url(#cmv-lg)" strokeWidth="1.5" />
    </svg>
  );
}

/** 전기차 — 해치백 + 번개 심볼 플래시 */
export function IconCarElectric({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="ce-lg" />
        <GoldGlow id="ce-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#ce-rg)" />
      {/* 차체 */}
      <rect x="1" y="14.5" width="22" height="3" rx="1" stroke="url(#ce-lg)" strokeWidth="1.5" />
      <path d="M3 14.5 L5 11 L7.5 9 H16.5 L19 11 L21 14.5" stroke="url(#ce-lg)" strokeWidth="1.5" />
      {/* 바퀴 */}
      <circle cx="6.5" cy="18.5" r="2.8" fill="url(#ce-rg)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="17.5" cy="18.5" r="2.8" fill="url(#ce-rg)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" begin="0.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="6.5" cy="18.5" r="1.8" stroke="url(#ce-lg)" strokeWidth="1.5" />
      <circle cx="17.5" cy="18.5" r="1.8" stroke="url(#ce-lg)" strokeWidth="1.5" />
      {/* 번개 심볼 플래시 */}
      <path d="M13.5 9.5 L11.5 12.5 H13.5 L11.5 14.5" stroke="#FFE082" strokeWidth="1.5">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

// ═══════════════════════════════════════════
// 금융 상품 (4종)
// ═══════════════════════════════════════════

/** 할부 — 달력 + ₩ + 글로우 */
export function IconInstallment({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="ins-lg" />
        <GoldGlow id="ins-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#ins-rg)" />
      {/* 달력 */}
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="url(#ins-lg)" strokeWidth="1.5" />
      <line x1="3" y1="9" x2="21" y2="9" stroke="url(#ins-lg)" strokeWidth="1.5" />
      <line x1="8" y1="2" x2="8" y2="6" stroke="url(#ins-lg)" strokeWidth="1.5" />
      <line x1="16" y1="2" x2="16" y2="6" stroke="url(#ins-lg)" strokeWidth="1.5" />
      {/* ₩ 심볼 글로우 */}
      <g>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
        <path d="M8.5 13 L10 17.5 L12 14 L14 17.5 L15.5 13" stroke="url(#ins-lg)" strokeWidth="1.3" />
        <line x1="9" y1="16" x2="15" y2="16" stroke="url(#ins-lg)" strokeWidth="1" />
      </g>
    </svg>
  );
}

/** 리스 — 문서 + 키 + 라인 순차 빛남 */
export function IconLease({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="ls-lg" />
        <GoldGlow id="ls-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#ls-rg)" />
      {/* 문서 */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="url(#ls-lg)" strokeWidth="1.5" />
      <polyline points="14 2 14 8 20 8" stroke="url(#ls-lg)" strokeWidth="1.5" />
      {/* 라인 순차 빛남 */}
      <line x1="8" y1="12" x2="14" y2="12" stroke="url(#ls-lg)" strokeWidth="1.3">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" begin="0s" repeatCount="indefinite" />
      </line>
      {/* 키 */}
      <circle cx="9.5" cy="16.5" r="1.8" stroke="url(#ls-lg)" strokeWidth="1.3">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.2s" begin="0.4s" repeatCount="indefinite" />
      </circle>
      <path d="M11.3 16.5 H15.5" stroke="url(#ls-lg)" strokeWidth="1.3">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
      </path>
      <line x1="15.5" y1="15.5" x2="15.5" y2="17.5" stroke="url(#ls-lg)" strokeWidth="1.3" />
      <line x1="13.5" y1="15.5" x2="13.5" y2="16.5" stroke="url(#ls-lg)" strokeWidth="1.3" />
    </svg>
  );
}

/** 장기렌트 — 차 + 시계 + 시침 빛남 */
export function IconLongRent({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="lr-lg" />
        <GoldGlow id="lr-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#lr-rg)" />
      {/* 차 */}
      <rect x="1" y="13" width="13" height="2.5" rx="1" stroke="url(#lr-lg)" strokeWidth="1.5" />
      <path d="M2 13 L3.5 10.5 L5.5 9 H10 L12 10.5 L14 13" stroke="url(#lr-lg)" strokeWidth="1.5" />
      <circle cx="4.5" cy="16.5" r="1.5" stroke="url(#lr-lg)" strokeWidth="1.5" />
      <circle cx="11.5" cy="16.5" r="1.5" stroke="url(#lr-lg)" strokeWidth="1.5" />
      {/* 시계 */}
      <circle cx="19" cy="12" r="4.5" stroke="url(#lr-lg)" strokeWidth="1.5" />
      {/* 시침 빛남 */}
      <polyline points="19 9.5 19 12 21 12" stroke="url(#lr-lg)" strokeWidth="1.5">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </polyline>
    </svg>
  );
}

/** 현금구매 — 지갑 + 원화 파동 */
export function IconCash({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="csh-lg" />
        <GoldGlow id="csh-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#csh-rg)" />
      {/* 지갑 */}
      <path d="M21 8H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h17a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1z" stroke="url(#csh-lg)" strokeWidth="1.5" />
      <path d="M4 8V6a2 2 0 0 1 2-2h14" stroke="url(#csh-lg)" strokeWidth="1.5" />
      {/* 원화 동전 + 파동 */}
      <circle cx="17" cy="14" r="2" stroke="url(#csh-lg)" strokeWidth="1.3">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="17" cy="14" r="3.5" stroke="url(#csh-lg)" strokeWidth="0.7" strokeDasharray="1.5 2">
        <animate attributeName="opacity" values="0;0.8;0" dur="2s" begin="0.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ═══════════════════════════════════════════
// 기능 / UI (15종)
// ═══════════════════════════════════════════

/** 진단/분석 — 막대그래프 + 돋보기 + 스캔 파동 */
export function IconDiagnosis({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="dg-lg" />
        <GoldGlow id="dg-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#dg-rg)" />
      {/* 막대그래프 순차 빛남 */}
      <line x1="4" y1="19" x2="4" y2="13" stroke="url(#dg-lg)" strokeWidth="1.5">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0s" repeatCount="indefinite" />
      </line>
      <line x1="9" y1="19" x2="9" y2="9" stroke="url(#dg-lg)" strokeWidth="1.5">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.4s" repeatCount="indefinite" />
      </line>
      <line x1="14" y1="19" x2="14" y2="6" stroke="url(#dg-lg)" strokeWidth="1.5">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.8s" repeatCount="indefinite" />
      </line>
      <line x1="2" y1="19" x2="18" y2="19" stroke="url(#dg-lg)" strokeWidth="1.5" />
      {/* 돋보기 */}
      <circle cx="19" cy="10" r="3.5" stroke="url(#dg-lg)" strokeWidth="1.5" />
      <line x1="21.5" y1="12.5" x2="23" y2="14" stroke="url(#dg-lg)" strokeWidth="1.5" />
      {/* 스캔 파동 */}
      <circle cx="19" cy="10" r="5.5" stroke="url(#dg-lg)" strokeWidth="0.7" strokeDasharray="2 2">
        <animate attributeName="opacity" values="0;0.7;0" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/** 추천/맞춤 — 과녁 + 중심 펄스 + 파동 링 */
export function IconTarget({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="tg-lg" />
        <GoldGlow id="tg-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#tg-rg)" />
      {/* 과녁 링 */}
      <circle cx="12" cy="12" r="10" stroke="url(#tg-lg)" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6" stroke="url(#tg-lg)" strokeWidth="1.5" />
      {/* 중심 펄스 */}
      <circle cx="12" cy="12" r="2" stroke="url(#tg-lg)" strokeWidth="1.5">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
      </circle>
      {/* 파동 링 */}
      <circle cx="12" cy="12" r="13" stroke="url(#tg-lg)" strokeWidth="0.7" strokeDasharray="2 3">
        <animate attributeName="opacity" values="0;0.6;0" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/** 일정/기간 — 달력 + 날짜 빛남 */
export function IconCalendar({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="cal-lg" />
        <GoldGlow id="cal-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#cal-rg)" />
      {/* 달력 */}
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="url(#cal-lg)" strokeWidth="1.5" />
      <line x1="3" y1="9" x2="21" y2="9" stroke="url(#cal-lg)" strokeWidth="1.5" />
      <line x1="8" y1="2" x2="8" y2="6" stroke="url(#cal-lg)" strokeWidth="1.5" />
      <line x1="16" y1="2" x2="16" y2="6" stroke="url(#cal-lg)" strokeWidth="1.5" />
      {/* 날짜 점 순차 빛남 */}
      <line x1="8" y1="14" x2="8" y2="14" stroke="url(#cal-lg)" strokeWidth="2.5">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0s" repeatCount="indefinite" />
      </line>
      <line x1="12" y1="14" x2="12" y2="14" stroke="url(#cal-lg)" strokeWidth="2.5">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.3s" repeatCount="indefinite" />
      </line>
      <line x1="16" y1="14" x2="16" y2="14" stroke="url(#cal-lg)" strokeWidth="2.5">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.6s" repeatCount="indefinite" />
      </line>
      <line x1="8" y1="18" x2="8" y2="18" stroke="url(#cal-lg)" strokeWidth="2.5">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.9s" repeatCount="indefinite" />
      </line>
      <line x1="12" y1="18" x2="12" y2="18" stroke="url(#cal-lg)" strokeWidth="2.5">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="1.2s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

/** 주행거리 — 도로 + 점선 순차 이동 */
export function IconRoad({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="rd-lg" />
        <GoldGlow id="rd-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#rd-rg)" />
      {/* 도로 외곽 */}
      <path d="M5 21 L12 4 L19 21" stroke="url(#rd-lg)" strokeWidth="1.5" />
      <line x1="7.5" y1="15.5" x2="16.5" y2="15.5" stroke="url(#rd-lg)" strokeWidth="1.5" />
      <line x1="9.5" y1="21" x2="14.5" y2="21" stroke="url(#rd-lg)" strokeWidth="1.5" />
      {/* 중앙 점선 순차 빛남 */}
      <line x1="12" y1="8" x2="12" y2="11" stroke="url(#rd-lg)" strokeWidth="1.3" strokeDasharray="1.5 2">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" begin="0s" repeatCount="indefinite" />
      </line>
      <line x1="12" y1="13" x2="12" y2="15" stroke="url(#rd-lg)" strokeWidth="1.3" strokeDasharray="1.5 2">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

/** 전화 + 수신 파동 */
export function IconPhone({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="ph-lg" />
        <GoldGlow id="ph-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#ph-rg)" />
      {/* 전화기 */}
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.08 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="url(#ph-lg)" strokeWidth="1.5" />
      {/* 수신 파동 */}
      <path d="M17 1.5 C19.5 3 21 5.5 21 8" stroke="url(#ph-lg)" strokeWidth="1.2" fill="none">
        <animate attributeName="opacity" values="0;0.8;0" dur="2s" begin="0s" repeatCount="indefinite" />
      </path>
      <path d="M19.5 0 C23 2 25 5.5 25 9" stroke="url(#ph-lg)" strokeWidth="0.9" fill="none">
        <animate attributeName="opacity" values="0;0.6;0" dur="2s" begin="0.4s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

/** 카카오톡 — 말풍선 + 점 순차 깜빡 */
export function IconKakao({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="kk-lg" />
        <GoldGlow id="kk-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#kk-rg)" />
      {/* 말풍선 */}
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="url(#kk-lg)" strokeWidth="1.5" />
      {/* 점 순차 깜빡 */}
      <line x1="9" y1="10" x2="9" y2="10" stroke="url(#kk-lg)" strokeWidth="2.5">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" begin="0s" repeatCount="indefinite" />
      </line>
      <line x1="12" y1="10" x2="12" y2="10" stroke="url(#kk-lg)" strokeWidth="2.5">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" begin="0.4s" repeatCount="indefinite" />
      </line>
      <line x1="15" y1="10" x2="15" y2="10" stroke="url(#kk-lg)" strokeWidth="2.5">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" begin="0.8s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

/** 링크/공유 — 체인 링크 + 양끝 스파클 */
export function IconLink({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="lk-lg" />
        <GoldGlow id="lk-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#lk-rg)" />
      {/* 체인 링크 */}
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="url(#lk-lg)" strokeWidth="1.5" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="url(#lk-lg)" strokeWidth="1.5" />
      {/* 양끝 스파클 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0s" repeatCount="indefinite" />
        <line x1="20" y1="3" x2="20" y2="5.5" stroke="#FFE082" strokeWidth="1.2" />
        <line x1="18.75" y1="4.25" x2="21.25" y2="4.25" stroke="#FFE082" strokeWidth="1.2" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" />
        <line x1="4" y1="18.5" x2="4" y2="21" stroke="#FFE082" strokeWidth="1.2" />
        <line x1="2.75" y1="19.75" x2="5.25" y2="19.75" stroke="#FFE082" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

/** 보안/개인정보 — 방패 + 체크 밝기 펄스 */
export function IconShield({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="sh-lg" />
        <GoldGlow id="sh-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#sh-rg)" />
      {/* 방패 */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#sh-lg)" strokeWidth="1.5" />
      {/* 체크 밝기 펄스 */}
      <polyline points="9 12 11 14 15 10" stroke="url(#sh-lg)" strokeWidth="1.8">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </polyline>
    </svg>
  );
}

/** 빠른/번개 + 내부 플래시 + 스파클 4개 */
export function IconBolt({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="bt-lg" />
        <GoldGlow id="bt-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#bt-rg)" />
      {/* 번개 */}
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="url(#bt-lg)" strokeWidth="1.5" />
      {/* 내부 플래시 */}
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#F0D060" fillOpacity="0.15">
        <animate attributeName="fill-opacity" values="0;0.25;0" dur="1.8s" repeatCount="indefinite" />
      </polygon>
      {/* 스파클 4개 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0s" repeatCount="indefinite" />
        <line x1="22" y1="3" x2="22" y2="5.5" stroke="#FFE082" strokeWidth="1.1" />
        <line x1="20.75" y1="4.25" x2="23.25" y2="4.25" stroke="#FFE082" strokeWidth="1.1" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.4s" repeatCount="indefinite" />
        <line x1="2" y1="5" x2="2" y2="7" stroke="#FFE082" strokeWidth="1.1" />
        <line x1="1" y1="6" x2="3" y2="6" stroke="#FFE082" strokeWidth="1.1" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.8s" repeatCount="indefinite" />
        <line x1="23" y1="16" x2="23" y2="18" stroke="#FFE082" strokeWidth="1.1" />
        <line x1="22" y1="17" x2="24" y2="17" stroke="#FFE082" strokeWidth="1.1" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="1.2s" repeatCount="indefinite" />
        <line x1="1" y1="19" x2="1" y2="21" stroke="#FFE082" strokeWidth="1.1" />
        <line x1="0" y1="20" x2="2" y2="20" stroke="#FFE082" strokeWidth="1.1" />
      </g>
    </svg>
  );
}

/** 결과/1등 — 트로피 + 상단 별 스파클 3개 */
export function IconTrophy({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="tr-lg" />
        <GoldGlow id="tr-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#tr-rg)" />
      {/* 트로피 */}
      <line x1="8" y1="21" x2="16" y2="21" stroke="url(#tr-lg)" strokeWidth="1.5" />
      <line x1="12" y1="17" x2="12" y2="21" stroke="url(#tr-lg)" strokeWidth="1.5" />
      <path d="M7 4H4v3a5 5 0 0 0 3 4.58" stroke="url(#tr-lg)" strokeWidth="1.5" />
      <path d="M17 4h3v3a5 5 0 0 1-3 4.58" stroke="url(#tr-lg)" strokeWidth="1.5" />
      <path d="M7 4h10v9a5 5 0 0 1-10 0z" stroke="url(#tr-lg)" strokeWidth="1.5" />
      {/* 별 스파클 3개 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="0s" repeatCount="indefinite" />
        <line x1="8" y1="0.5" x2="8" y2="3" stroke="#FFE082" strokeWidth="1.3" />
        <line x1="6.75" y1="1.75" x2="9.25" y2="1.75" stroke="#FFE082" strokeWidth="1.3" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
        <line x1="12" y1="0" x2="12" y2="2.5" stroke="#FFE082" strokeWidth="1.3" />
        <line x1="10.75" y1="1.25" x2="13.25" y2="1.25" stroke="#FFE082" strokeWidth="1.3" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="1.2s" repeatCount="indefinite" />
        <line x1="16" y1="0.5" x2="16" y2="3" stroke="#FFE082" strokeWidth="1.3" />
        <line x1="14.75" y1="1.75" x2="17.25" y2="1.75" stroke="#FFE082" strokeWidth="1.3" />
      </g>
    </svg>
  );
}

/** 완료/체크 + 밝기 펄스 */
export function IconCheck({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="chk-lg" />
        <GoldGlow id="chk-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#chk-rg)" />
      {/* 원형 */}
      <circle cx="12" cy="12" r="10" stroke="url(#chk-lg)" strokeWidth="1.5" />
      {/* 체크 밝기 펄스 */}
      <polyline points="9 12 11 14 15 10" stroke="url(#chk-lg)" strokeWidth="2">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </polyline>
    </svg>
  );
}

/** 주의/경고 — 삼각형 + 느낌표 펄스 */
export function IconWarning({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="wn-lg" />
        <GoldGlow id="wn-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#wn-rg)" />
      {/* 삼각형 */}
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="url(#wn-lg)" strokeWidth="1.5" />
      {/* 느낌표 펄스 */}
      <line x1="12" y1="9" x2="12" y2="13" stroke="url(#wn-lg)" strokeWidth="1.5">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
      </line>
      <line x1="12" y1="17" x2="12.01" y2="17" stroke="url(#wn-lg)" strokeWidth="2.5">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin="0.2s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

/** 팁/아이디어 — 전구 + 빛 글로우 */
export function IconTip({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="tp-lg" />
        <GoldGlow id="tp-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#tp-rg)" />
      {/* 전구 */}
      <line x1="9" y1="18" x2="15" y2="18" stroke="url(#tp-lg)" strokeWidth="1.5" />
      <line x1="10" y1="22" x2="14" y2="22" stroke="url(#tp-lg)" strokeWidth="1.5" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" stroke="url(#tp-lg)" strokeWidth="1.5" />
      {/* 빛 글로우 */}
      <circle cx="12" cy="8" r="4" fill="url(#tp-rg)">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* 빛 파동 */}
      <line x1="12" y1="0.5" x2="12" y2="2.5" stroke="#FFE082" strokeWidth="1.2">
        <animate attributeName="opacity" values="0;0.8;0" dur="2s" begin="0s" repeatCount="indefinite" />
      </line>
      <line x1="16.5" y1="2" x2="15.2" y2="3.3" stroke="#FFE082" strokeWidth="1.2">
        <animate attributeName="opacity" values="0;0.8;0" dur="2s" begin="0.3s" repeatCount="indefinite" />
      </line>
      <line x1="7.5" y1="2" x2="8.8" y2="3.3" stroke="#FFE082" strokeWidth="1.2">
        <animate attributeName="opacity" values="0;0.8;0" dur="2s" begin="0.6s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

/** 예산/보증금 — 원화 동전 + 파동 링 */
export function IconBudget({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="bg-lg" />
        <GoldGlow id="bg-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#bg-rg)" />
      {/* 동전 */}
      <circle cx="12" cy="12" r="9.5" stroke="url(#bg-lg)" strokeWidth="1.5" />
      {/* ₩ 심볼 */}
      <path d="M8.5 9.5 L10 14.5 L12 11 L14 14.5 L15.5 9.5" stroke="url(#bg-lg)" strokeWidth="1.3" />
      <line x1="9" y1="13" x2="15" y2="13" stroke="url(#bg-lg)" strokeWidth="1" />
      <line x1="9" y1="15" x2="15" y2="15" stroke="url(#bg-lg)" strokeWidth="1" />
      {/* 파동 링 */}
      <circle cx="12" cy="12" r="11.5" stroke="url(#bg-lg)" strokeWidth="0.6" strokeDasharray="2 3">
        <animate attributeName="opacity" values="0;0.7;0" dur="2.5s" begin="0s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/** 메모/문서 — 책 + 텍스트라인 순차 빛남 */
export function IconMemo({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="mm-lg" />
        <GoldGlow id="mm-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#mm-rg)" />
      {/* 문서 */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="url(#mm-lg)" strokeWidth="1.5" />
      <polyline points="14 2 14 8 20 8" stroke="url(#mm-lg)" strokeWidth="1.5" />
      {/* 텍스트 라인 순차 빛남 */}
      <line x1="8" y1="12" x2="16" y2="12" stroke="url(#mm-lg)" strokeWidth="1.3">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0s" repeatCount="indefinite" />
      </line>
      <line x1="8" y1="16" x2="16" y2="16" stroke="url(#mm-lg)" strokeWidth="1.3">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.5s" repeatCount="indefinite" />
      </line>
      <line x1="8" y1="8" x2="10" y2="8" stroke="url(#mm-lg)" strokeWidth="1.3">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="1s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

// ═══════════════════════════════════════════
// 추가 아이콘 (진단/기능 확장 — ICON_MAP용)
// ═══════════════════════════════════════════

/** 진단 바차트 — 막대 순차 빛남 */
export function IconDiagnosisChart({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
      <defs>
        <GoldLinear id="dgc-lg" />
        <GoldGlow id="dgc-rg" />
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#dgc-rg)" />
      <line x1="3" y1="20" x2="21" y2="20" stroke="url(#dgc-lg)" strokeWidth="1.5" />
      <rect x="3" y="14" width="3.5" height="6" rx="0.5" stroke="url(#dgc-lg)" strokeWidth="1.3">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0s" repeatCount="indefinite" />
      </rect>
      <rect x="8.5" y="9" width="3.5" height="11" rx="0.5" stroke="url(#dgc-lg)" strokeWidth="1.3">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.4s" repeatCount="indefinite" />
      </rect>
      <rect x="14" y="5" width="3.5" height="15" rx="0.5" stroke="url(#dgc-lg)" strokeWidth="1.3">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.8s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

// ═══════════════════════════════════════════
// 레지스트리 — 문자열로 아이콘 렌더링
// ═══════════════════════════════════════════

export const ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
  IconCarCompact,
  IconCarSedan,
  IconCarSUV,
  IconCarPremium,
  IconCarMinivan,
  IconCarElectric,
  IconInstallment,
  IconLease,
  IconLongRent,
  IconCash,
  IconDiagnosis,
  IconDiagnosisChart,
  IconTarget,
  IconCalendar,
  IconRoad,
  IconPhone,
  IconKakao,
  IconLink,
  IconShield,
  IconBolt,
  IconTrophy,
  IconCheck,
  IconWarning,
  IconTip,
  IconBudget,
  IconMemo,
};

/** 아이콘 이름 문자열로 컴포넌트 렌더링 */
export function RenderIcon({
  name,
  size = 24,
  className = '',
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}
