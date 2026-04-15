'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconConsult({ size = 34, className = '' }: IconProps) {
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
        <radialGradient id="consult-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="consult-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#consult-glow)" />
      {/* 말풍선 */}
      <path
        d="M6 8H30C31.1 8 32 8.9 32 10V22C32 23.1 31.1 24 30 24H14L8 30V24H6C4.9 24 4 23.1 4 22V10C4 8.9 4.9 8 6 8Z"
        stroke="url(#consult-gold)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* 점 3개 순차 깜빡임 (0.3s 간격) */}
      <circle cx="13" cy="16" r="2" fill="#FFE082">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0s" repeatCount="indefinite" />
        <animate attributeName="r" values="1.5;2.5;1.5" dur="1.2s" begin="0s" repeatCount="indefinite" />
      </circle>
      <circle cx="18" cy="16" r="2" fill="#FFE082">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
        <animate attributeName="r" values="1.5;2.5;1.5" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
      </circle>
      <circle cx="23" cy="16" r="2" fill="#FFE082">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
        <animate attributeName="r" values="1.5;2.5;1.5" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
      </circle>
      {/* 스파클 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
        <line x1="30" y1="5" x2="30" y2="8" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="28.5" y1="6.5" x2="31.5" y2="6.5" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
