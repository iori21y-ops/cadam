'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconPrice({ size = 34, className = '' }: IconProps) {
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
        <radialGradient id="price-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="price-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#price-glow)" />
      {/* 메인 원 */}
      <circle cx="18" cy="18" r="10" stroke="url(#price-gold)" strokeWidth="1.8" />
      {/* ₩ 심볼 */}
      <text x="18" y="23" textAnchor="middle" fill="#FFE082" fontSize="11" fontWeight="bold" fontFamily="sans-serif">₩</text>
      {/* 파동 링 1 확장 */}
      <circle cx="18" cy="18" r="10" stroke="#FFE082" strokeWidth="1" fill="none" opacity="0">
        <animate attributeName="r" values="10;17;10" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0;0.8" dur="2.5s" repeatCount="indefinite" />
      </circle>
      {/* 파동 링 2 확장 (지연) */}
      <circle cx="18" cy="18" r="10" stroke="#C9A84C" strokeWidth="0.8" fill="none" opacity="0">
        <animate attributeName="r" values="10;17;10" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
      </circle>
      {/* 스파클 1 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2.2s" begin="0.3s" repeatCount="indefinite" />
        <line x1="8" y1="7" x2="8" y2="10" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="6.5" y1="8.5" x2="9.5" y2="8.5" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      {/* 스파클 2 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2.2s" begin="1.3s" repeatCount="indefinite" />
        <line x1="29" y1="7" x2="29" y2="10" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="27.5" y1="8.5" x2="30.5" y2="8.5" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
