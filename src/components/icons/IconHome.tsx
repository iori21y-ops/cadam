'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconHome({ size = 34, className = '' }: IconProps) {
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
        <radialGradient id="home-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="home-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      {/* 배경 글로우 */}
      <circle cx="18" cy="18" r="17" fill="url(#home-glow)" />
      {/* 집 몸체 */}
      <path
        d="M6 17L18 7L30 17V30H22V22H14V30H6V17Z"
        stroke="url(#home-gold)"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 창문 빛 깜빡임 */}
      <rect x="15" y="22" width="6" height="5" rx="0.5" stroke="url(#home-gold)" strokeWidth="1.5">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite" />
      </rect>
      {/* 스파클 1 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0s" repeatCount="indefinite" />
        <line x1="28" y1="8" x2="28" y2="11" stroke="#FFE082" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="26.5" y1="9.5" x2="29.5" y2="9.5" stroke="#FFE082" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {/* 스파클 2 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" />
        <line x1="9" y1="10" x2="9" y2="12.5" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="7.75" y1="11.25" x2="10.25" y2="11.25" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
