'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconSearch({ size = 34, className = '' }: IconProps) {
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
        <radialGradient id="search-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="search-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#search-glow)" />
      {/* 돋보기 렌즈 */}
      <circle cx="16" cy="15" r="8" stroke="url(#search-gold)" strokeWidth="2" />
      {/* 손잡이 */}
      <line x1="22" y1="21" x2="30" y2="30" stroke="url(#search-gold)" strokeWidth="2.2" strokeLinecap="round" />
      {/* 렌즈 글린트 대각선 */}
      <line x1="11" y1="10" x2="14" y2="13" stroke="#FFF3C4" strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="0;0.9;0" dur="2.2s" repeatCount="indefinite" />
      </line>
      {/* 스파클 1 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.3s" repeatCount="indefinite" />
        <line x1="28" y1="7" x2="28" y2="10" stroke="#FFE082" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="26.5" y1="8.5" x2="29.5" y2="8.5" stroke="#FFE082" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      {/* 스파클 2 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1.1s" repeatCount="indefinite" />
        <line x1="7" y1="8" x2="7" y2="10.5" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="5.75" y1="9.25" x2="8.25" y2="9.25" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
