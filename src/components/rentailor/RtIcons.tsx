// RtIcons.tsx — 렌테일러 다이나믹(애니메이션) 아이콘 세트
// 원본: _design_ref/rt-icons.jsx (window 전역 + <head> CSS 주입 → 모듈 + globals.css 로 이식)
// keyframe/애니메이션 클래스(.rti-*)는 globals.css 로 이동(prefers-reduced-motion 포함).
// 순수 표현 컴포넌트(훅 없음) — Server/Client 양쪽 사용 가능.
import React from 'react';

const RTI_INK = 'var(--rt-ink, #0D1B2A)';
const RTI_GOLD = 'var(--rt-accent, #C9A84C)';

interface IconProps {
  size?: number;
}
interface WrapProps extends IconProps {
  label: string;
  children: React.ReactNode;
}

function RtiWrap({ size = 24, label, children }: WrapProps) {
  return (
    <span className="rti" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg viewBox="0 0 32 32" width={size} height={size}>
        {children}
      </svg>
    </span>
  );
}

// 비대면 간편 상담 — 말풍선 + 점멸 점 3개 (bob + blink)
export function RtIconConsult({ size }: IconProps) {
  return (
    <RtiWrap size={size} label="비대면 상담">
      <g className="rti-animBob">
        <rect x="3.5" y="5" width="25" height="17" rx="6.5" fill={RTI_INK} />
        <path d="M9.5 21 L9.5 27 L16 21 Z" fill={RTI_INK} />
      </g>
      <circle className="rti-animBlink rti-d1" cx="10.5" cy="13.5" r="2.1" fill="#fff" />
      <circle className="rti-animBlink rti-d2" cx="16" cy="13.5" r="2.1" fill={RTI_GOLD} />
      <circle className="rti-animBlink rti-d3" cx="21.5" cy="13.5" r="2.1" fill="#fff" />
    </RtiWrap>
  );
}

// 리스·렌트·할부 맞춤 견적 — 두 막대 비교 (번갈아 시소)
export function RtIconCompare({ size }: IconProps) {
  return (
    <RtiWrap size={size} label="맞춤 견적">
      <rect className="rti-animSee" x="6" y="8" width="8.5" height="18" rx="3" fill={RTI_GOLD} />
      <rect className="rti-animSee2" x="17.5" y="8" width="8.5" height="18" rx="3" fill={RTI_INK} />
    </RtiWrap>
  );
}

// 실시간 특가 차량 알림 — 번개 + 번쩍 글로우 (bolt flash)
export function RtIconLightning({ size }: IconProps) {
  return (
    <RtiWrap size={size} label="특가 알림">
      <circle className="rti-animGlow" cx="16" cy="16" r="13" fill={RTI_GOLD} />
      <path
        className="rti-animBolt"
        d="M18.5 2.5 L7.5 18 L14.5 18 L12.5 29.5 L25 12.5 L17.5 12.5 Z"
        fill={RTI_GOLD}
        stroke={RTI_INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </RtiWrap>
  );
}

// 약관까지 꼼꼼 비교 — 문서 + 돋보기 스캔 (scan)
export function RtIconContract({ size }: IconProps) {
  return (
    <RtiWrap size={size} label="약관 비교">
      <rect x="5.5" y="3.5" width="16" height="22" rx="3" fill={RTI_INK} />
      <rect x="8.5" y="8" width="10" height="1.9" rx=".95" fill="#fff" opacity=".85" />
      <rect x="8.5" y="12" width="10" height="1.9" rx=".95" fill="#fff" opacity=".55" />
      <rect x="8.5" y="16" width="7" height="1.9" rx=".95" fill="#fff" opacity=".4" />
      <g className="rti-animScan">
        <circle cx="20.5" cy="20" r="5.2" fill="rgba(255,255,255,.92)" stroke={RTI_GOLD} strokeWidth="2.4" />
        <line x1="24.2" y1="23.7" x2="28" y2="27.5" stroke={RTI_GOLD} strokeWidth="2.8" strokeLinecap="round" />
      </g>
    </RtiWrap>
  );
}

// 차량 (범용)
export function RtIconCar({ size }: IconProps) {
  return (
    <RtiWrap size={size} label="차량">
      <g className="rti-animFloat">
        <path
          d="M4 19 L6.5 12.5 Q7.2 11 9 11 L23 11 Q24.8 11 25.5 12.5 L28 19 L28 23 Q28 24 27 24 L25 24 Q24 24 24 23 L24 22 L8 22 L8 23 Q8 24 7 24 L5 24 Q4 24 4 23 Z"
          fill={RTI_INK}
        />
        <path d="M8 18 L24 18" stroke="#fff" strokeWidth="1.4" opacity=".5" />
      </g>
      <circle className="rti-animPop rti-d1" cx="9.5" cy="23.5" r="2.6" fill={RTI_GOLD} />
      <circle className="rti-animPop rti-d2" cx="22.5" cy="23.5" r="2.6" fill={RTI_GOLD} />
    </RtiWrap>
  );
}

// 진단/AI — 스파클 별 (pop)
export function RtIconSpark({ size }: IconProps) {
  return (
    <RtiWrap size={size} label="AI 진단">
      <path
        className="rti-animPop"
        d="M16 4 Q17.5 12.5 24 14 Q17.5 15.5 16 24 Q14.5 15.5 8 14 Q14.5 12.5 16 4 Z"
        fill={RTI_GOLD}
        stroke={RTI_INK}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle className="rti-animPop rti-d2" cx="25" cy="6" r="2" fill={RTI_INK} />
      <circle className="rti-animPop rti-d3" cx="7" cy="24" r="1.6" fill={RTI_INK} />
    </RtiWrap>
  );
}

// 금융상품 진단 — 원화 코인 + 스파클 (bob + pop)
export function RtIconMoney({ size }: IconProps) {
  return (
    <RtiWrap size={size} label="금융상품 진단">
      <g className="rti-animBob">
        <circle cx="14" cy="16" r="11" fill={RTI_INK} />
        <path
          d="M9.5 12 L14 20 L18.5 12 M10.5 15.3 H17.5 M10.5 17.6 H17.5"
          stroke={RTI_GOLD}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path
        className="rti-animPop rti-d2"
        d="M25 4.5 Q25.8 8 29 8.8 Q25.8 9.6 25 13 Q24.2 9.6 21 8.8 Q24.2 8 25 4.5 Z"
        fill={RTI_GOLD}
      />
    </RtiWrap>
  );
}

// 감가상각 분석 — 막대 차트 + 추세선 (float + scan)
export function RtIconTrend({ size }: IconProps) {
  return (
    <RtiWrap size={size} label="감가상각 분석">
      <g className="rti-animFloat">
        <rect x="5" y="16" width="4.6" height="10" rx="1.6" fill={RTI_INK} />
        <rect x="11.7" y="11" width="4.6" height="15" rx="1.6" fill={RTI_GOLD} />
        <rect x="18.4" y="7" width="4.6" height="19" rx="1.6" fill={RTI_INK} />
      </g>
      <path
        className="rti-animScan"
        d="M5 12.5 L12 9.5 L18 11.5 L27 5"
        fill="none"
        stroke={RTI_GOLD}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="rti-animPop rti-d2" cx="27" cy="5" r="2.3" fill={RTI_GOLD} stroke={RTI_INK} strokeWidth="1" />
    </RtiWrap>
  );
}
