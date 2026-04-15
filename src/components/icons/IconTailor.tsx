'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconTailor({ size = 34, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      className={className}
      style={{ animation: 'goldPulse 4s ease-in-out infinite' }}
    >
      <defs>
        <radialGradient id="tailor-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tailor-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#tailor-glow)" />
      {/* 다이아몬드 원 (확대축소 애니메이션) */}
      <circle cx="18" cy="16" r="7" stroke="url(#tailor-gold)" strokeWidth="1.6">
        <animate attributeName="r" values="7;8.5;7" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.6;1" dur="2.5s" repeatCount="indefinite" />
      </circle>
      {/* 다이아몬드 상단 */}
      <path d="M13 14L18 9L23 14L18 22Z" stroke="url(#tailor-gold)" strokeWidth="1.6" strokeLinejoin="round" />
      <line x1="13" y1="14" x2="23" y2="14" stroke="url(#tailor-gold)" strokeWidth="1.2" />
      {/* 펜 */}
      <path d="M24 25L28 29L30 27L26 23L24 25Z" stroke="url(#tailor-gold)" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="24" y1="25" x2="22" y2="31" stroke="url(#tailor-gold)" strokeWidth="1.4" strokeLinecap="round" />
      {/* 스파클 1 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0s" repeatCount="indefinite" />
        <line x1="8" y1="7" x2="8" y2="10" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="6.5" y1="8.5" x2="9.5" y2="8.5" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      {/* 스파클 2 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" />
        <line x1="29" y1="8" x2="29" y2="11" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="27.5" y1="9.5" x2="30.5" y2="9.5" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
