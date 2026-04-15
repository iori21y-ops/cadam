'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconContract({ size = 34, className = '' }: IconProps) {
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
        <radialGradient id="contract-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="contract-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#contract-glow)" />
      {/* 문서 + 접힌 모서리 */}
      <path
        d="M8 5H24L28 9V31H8V5Z"
        stroke="url(#contract-gold)"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      {/* 접힌 모서리 */}
      <path d="M24 5L24 9H28" stroke="url(#contract-gold)" strokeWidth="1.4" strokeLinecap="round" />
      {/* 모서리 스파클 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2.5s" begin="1s" repeatCount="indefinite" />
        <line x1="25" y1="5" x2="27" y2="7" stroke="#FFF3C4" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="27" y1="5" x2="25" y2="7" stroke="#FFF3C4" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      {/* 텍스트 라인 3줄 순차 빛남 */}
      <line x1="12" y1="14" x2="24" y2="14" stroke="#FFE082" strokeWidth="1.4" strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" begin="0s" repeatCount="indefinite" />
        <animate attributeName="stroke" values="#FFE082;#FFF3C4;#FFE082" dur="1.8s" begin="0s" repeatCount="indefinite" />
      </line>
      <line x1="12" y1="18" x2="24" y2="18" stroke="#FFE082" strokeWidth="1.4" strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" begin="0.4s" repeatCount="indefinite" />
        <animate attributeName="stroke" values="#FFE082;#FFF3C4;#FFE082" dur="1.8s" begin="0.4s" repeatCount="indefinite" />
      </line>
      <line x1="12" y1="22" x2="20" y2="22" stroke="#FFE082" strokeWidth="1.4" strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" begin="0.8s" repeatCount="indefinite" />
        <animate attributeName="stroke" values="#FFE082;#FFF3C4;#FFE082" dur="1.8s" begin="0.8s" repeatCount="indefinite" />
      </line>
      {/* 도장 스파클 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2.5s" begin="0.3s" repeatCount="indefinite" />
        <circle cx="22" cy="26" r="3" stroke="#FFE082" strokeWidth="1.2" />
        <line x1="22" y1="23" x2="22" y2="25" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" />
        <line x1="19" y1="26" x2="21" y2="26" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  );
}
