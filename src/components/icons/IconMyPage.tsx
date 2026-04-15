'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconMyPage({ size = 34, className = '' }: IconProps) {
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
        <radialGradient id="mypage-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mypage-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#mypage-glow)" />
      {/* 사람 머리 */}
      <circle cx="18" cy="13" r="5" stroke="url(#mypage-gold)" strokeWidth="1.8" />
      {/* 사람 몸통 */}
      <path d="M8 30C8 24.477 12.477 20 18 20C23.523 20 28 24.477 28 30" stroke="url(#mypage-gold)" strokeWidth="1.8" strokeLinecap="round" />
      {/* 왕관 별 3개 스파클 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0s" repeatCount="indefinite" />
        <line x1="18" y1="4" x2="18" y2="6.5" stroke="#FFF3C4" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="16.75" y1="5.25" x2="19.25" y2="5.25" stroke="#FFF3C4" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.6s" repeatCount="indefinite" />
        <line x1="12" y1="5" x2="12" y2="7" stroke="#FFE082" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="11" y1="6" x2="13" y2="6" stroke="#FFE082" strokeWidth="1.3" strokeLinecap="round" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1.2s" repeatCount="indefinite" />
        <line x1="24" y1="5" x2="24" y2="7" stroke="#FFE082" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="23" y1="6" x2="25" y2="6" stroke="#FFE082" strokeWidth="1.3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
