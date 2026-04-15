import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

// ═══════════════════════════════════════════
// 차량 카테고리 (6종)
// ═══════════════════════════════════════════

/** 경차 — 작고 둥근 아치형 루프 */
export function IconCarCompact({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <rect x="2" y="14.5" width="20" height="3" rx="1" />
      <path d="M4 14.5 L6.5 11 L9 9.5 H15 L17.5 11 L20 14.5" />
      <circle cx="7" cy="18.5" r="1.8" />
      <circle cx="17" cy="18.5" r="1.8" />
    </svg>
  );
}

/** 세단 — 완만한 트렁크 슬로프 */
export function IconCarSedan({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <rect x="1" y="14.5" width="22" height="3" rx="1" />
      <path d="M3 14.5 L5 11 L8 9 H16 L19 11 L21 14.5" />
      <circle cx="6.5" cy="18.5" r="1.8" />
      <circle cx="17.5" cy="18.5" r="1.8" />
      <line x1="12" y1="9.5" x2="12" y2="14" strokeWidth="1" />
    </svg>
  );
}

/** SUV — 높고 수직적인 차체 */
export function IconCarSUV({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <rect x="1" y="14.5" width="22" height="3" rx="1" />
      <path d="M3 14.5 L4.5 11.5 L6 8.5 H18 L19.5 11.5 L21 14.5" />
      <circle cx="6.5" cy="18.5" r="1.8" />
      <circle cx="17.5" cy="18.5" r="1.8" />
      <line x1="12" y1="9" x2="12" y2="14" strokeWidth="1" />
    </svg>
  );
}

/** 대형/프리미엄 — 길고 낮은 고급 프로파일 */
export function IconCarPremium({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <rect x="1" y="15" width="22" height="2.5" rx="1" />
      <path d="M2 15 L4.5 12 L7.5 10.5 H16.5 L19.5 12 L22 15" />
      <circle cx="6.5" cy="18.5" r="1.8" />
      <circle cx="17.5" cy="18.5" r="1.8" />
      <line x1="13" y1="11" x2="13" y2="14.5" strokeWidth="1" />
    </svg>
  );
}

/** 미니밴 — 넓고 높은 패밀리카 */
export function IconCarMinivan({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <rect x="1" y="14.5" width="22" height="3" rx="1" />
      <path d="M3 14.5 L4 11.5 L5.5 8 H18.5 L20 11.5 L21 14.5" />
      <circle cx="6.5" cy="18.5" r="1.8" />
      <circle cx="17.5" cy="18.5" r="1.8" />
      <line x1="14" y1="9.5" x2="14" y2="14" strokeWidth="1" />
    </svg>
  );
}

/** 전기차 — 해치백 + 번개 심볼 */
export function IconCarElectric({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <rect x="1" y="14.5" width="22" height="3" rx="1" />
      <path d="M3 14.5 L5 11 L7.5 9 H16.5 L19 11 L21 14.5" />
      <circle cx="6.5" cy="18.5" r="1.8" />
      <circle cx="17.5" cy="18.5" r="1.8" />
      <path d="M13.5 9.5 L11.5 12.5 H13.5 L11.5 14.5" strokeWidth="1.5" />
    </svg>
  );
}

// ═══════════════════════════════════════════
// 금융 상품 (4종)
// ═══════════════════════════════════════════

/** 할부 — 달력 + ₩ */
export function IconInstallment({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <path d="M8.5 13 L10 17.5 L12 14 L14 17.5 L15.5 13" strokeWidth="1.3" />
      <line x1="9" y1="16" x2="15" y2="16" strokeWidth="1" />
    </svg>
  );
}

/** 리스 — 문서 + 열쇠 */
export function IconLease({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="12" x2="14" y2="12" />
      <circle cx="9.5" cy="16.5" r="1.8" />
      <path d="M11.3 16.5 H15.5" />
      <line x1="15.5" y1="15.5" x2="15.5" y2="17.5" />
      <line x1="13.5" y1="15.5" x2="13.5" y2="16.5" />
    </svg>
  );
}

/** 장기렌트 — 차 + 시계 */
export function IconLongRent({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <rect x="1" y="13" width="13" height="2.5" rx="1" />
      <path d="M2 13 L3.5 10.5 L5.5 9 H10 L12 10.5 L14 13" />
      <circle cx="4.5" cy="16.5" r="1.5" />
      <circle cx="11.5" cy="16.5" r="1.5" />
      <circle cx="19" cy="12" r="4.5" />
      <polyline points="19 9.5 19 12 21 12" />
    </svg>
  );
}

/** 현금구매 — 지갑 */
export function IconCash({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M21 8H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h17a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1z" />
      <path d="M4 8V6a2 2 0 0 1 2-2h14" />
      <circle cx="17" cy="14" r="2" />
    </svg>
  );
}

// ═══════════════════════════════════════════
// 기능 / UI (15종)
// ═══════════════════════════════════════════

/** 진단/분석 — 막대그래프 + 돋보기 */
export function IconDiagnosis({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <line x1="4" y1="19" x2="4" y2="13" />
      <line x1="9" y1="19" x2="9" y2="9" />
      <line x1="14" y1="19" x2="14" y2="6" />
      <line x1="2" y1="19" x2="18" y2="19" />
      <circle cx="19" cy="10" r="3.5" />
      <line x1="21.5" y1="12.5" x2="23" y2="14" />
    </svg>
  );
}

/** 추천/맞춤 — 과녁 */
export function IconTarget({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

/** 일정/기간 — 달력 */
export function IconCalendar({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="14" x2="8" y2="14" strokeWidth="2.5" />
      <line x1="12" y1="14" x2="12" y2="14" strokeWidth="2.5" />
      <line x1="16" y1="14" x2="16" y2="14" strokeWidth="2.5" />
      <line x1="8" y1="18" x2="8" y2="18" strokeWidth="2.5" />
      <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2.5" />
    </svg>
  );
}

/** 주행거리 — 도로 */
export function IconRoad({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M5 21 L12 4 L19 21" />
      <line x1="7.5" y1="15.5" x2="16.5" y2="15.5" />
      <line x1="9.5" y1="21" x2="14.5" y2="21" />
      <line x1="12" y1="8" x2="12" y2="11" strokeDasharray="1.5 2" />
      <line x1="12" y1="13" x2="12" y2="15" strokeDasharray="1.5 2" />
    </svg>
  );
}

/** 전화 */
export function IconPhone({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.08 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

/** 카카오톡 — 말풍선 */
export function IconKakao({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="9" y1="10" x2="9" y2="10" strokeWidth="2.5" />
      <line x1="12" y1="10" x2="12" y2="10" strokeWidth="2.5" />
      <line x1="15" y1="10" x2="15" y2="10" strokeWidth="2.5" />
    </svg>
  );
}

/** 링크/공유 */
export function IconLink({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/** 보안/개인정보 — 방패 */
export function IconShield({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/** 빠른/번개 */
export function IconBolt({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

/** 결과/1등 — 트로피 */
export function IconTrophy({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <path d="M7 4H4v3a5 5 0 0 0 3 4.58" />
      <path d="M17 4h3v3a5 5 0 0 1-3 4.58" />
      <path d="M7 4h10v9a5 5 0 0 1-10 0z" />
    </svg>
  );
}

/** 완료/체크 */
export function IconCheck({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

/** 주의/경고 — 삼각형 느낌표 */
export function IconWarning({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
    </svg>
  );
}

/** 팁/아이디어 — 전구 */
export function IconTip({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="10" y1="22" x2="14" y2="22" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}

/** 예산/보증금 — 원화 동전 */
export function IconBudget({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M8.5 9.5 L10 14.5 L12 11 L14 14.5 L15.5 9.5" strokeWidth="1.3" />
      <line x1="9" y1="13" x2="15" y2="13" strokeWidth="1" />
      <line x1="9" y1="15" x2="15" y2="15" strokeWidth="1" />
    </svg>
  );
}

/** 메모/문서 */
export function IconMemo({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="16" y2="16" />
      <line x1="8" y1="8" x2="10" y2="8" />
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
