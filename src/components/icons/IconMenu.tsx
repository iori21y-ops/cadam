'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconMenu({ size = 34, className = '' }: IconProps) {
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
        <radialGradient id="menu-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="menu-gold" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#menu-glow)" />
      {/* 햄버거 3줄 (#FFE082, 두께 2.4) */}
      <line x1="8" y1="12" x2="28" y2="12" stroke="#FFE082" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="8" y1="18" x2="28" y2="18" stroke="#FFE082" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="8" y1="24" x2="28" y2="24" stroke="#FFE082" strokeWidth="2.4" strokeLinecap="round" />
      {/* 끝점 스파클 3개 순차 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2.4s" begin="0s" repeatCount="indefinite" />
        <line x1="30" y1="10" x2="30" y2="14" stroke="#FFF3C4" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="28.5" y1="12" x2="31.5" y2="12" stroke="#FFF3C4" strokeWidth="1.3" strokeLinecap="round" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2.4s" begin="0.8s" repeatCount="indefinite" />
        <line x1="30" y1="16" x2="30" y2="20" stroke="#FFF3C4" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="28.5" y1="18" x2="31.5" y2="18" stroke="#FFF3C4" strokeWidth="1.3" strokeLinecap="round" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2.4s" begin="1.6s" repeatCount="indefinite" />
        <line x1="30" y1="22" x2="30" y2="26" stroke="#FFF3C4" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="28.5" y1="24" x2="31.5" y2="24" stroke="#FFF3C4" strokeWidth="1.3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
