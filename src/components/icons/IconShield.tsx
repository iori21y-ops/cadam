'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconShield({ size = 34, className = '' }: IconProps) {
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
        <radialGradient id="shield-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="shield-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#shield-glow)" />
      {/* 방패 */}
      <path
        d="M18 5L7 9.5V18C7 23.8 12 29 18 31C24 29 29 23.8 29 18V9.5L18 5Z"
        stroke="url(#shield-gold)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* 체크 (밝기 펄스) */}
      <polyline points="12 18 16 22 24 14" stroke="#FFE082" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="stroke" values="#FFE082;#FFF3C4;#FFE082" dur="2s" repeatCount="indefinite" />
      </polyline>
      {/* 스파클 1 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2.5s" begin="0.4s" repeatCount="indefinite" />
        <line x1="7" y1="5" x2="7" y2="8" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="5.5" y1="6.5" x2="8.5" y2="6.5" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      {/* 스파클 2 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2.5s" begin="1.4s" repeatCount="indefinite" />
        <line x1="29" y1="5" x2="29" y2="8" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="27.5" y1="6.5" x2="30.5" y2="6.5" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
