'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconCompare({ size = 34, className = '' }: IconProps) {
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
        <radialGradient id="compare-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="compare-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#compare-glow)" />
      {/* 왼쪽 문서 */}
      <rect x="4" y="9" width="12" height="16" rx="1.5" stroke="url(#compare-gold)" strokeWidth="1.6" />
      {/* 오른쪽 문서 */}
      <rect x="20" y="9" width="12" height="16" rx="1.5" stroke="url(#compare-gold)" strokeWidth="1.6" />
      {/* 연결선 (깜빡임) */}
      <line x1="16" y1="17" x2="20" y2="17" stroke="#FFE082" strokeWidth="2" strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="stroke-width" values="1.5;2.5;1.5" dur="1.5s" repeatCount="indefinite" />
      </line>
      {/* 왼쪽 라인 순차 빛남 */}
      <line x1="7" y1="13" x2="13" y2="13" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0s" repeatCount="indefinite" />
      </line>
      <line x1="7" y1="16" x2="13" y2="16" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.4s" repeatCount="indefinite" />
      </line>
      <line x1="7" y1="19" x2="11" y2="19" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.8s" repeatCount="indefinite" />
      </line>
      {/* 오른쪽 라인 순차 빛남 */}
      <line x1="23" y1="13" x2="29" y2="13" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.2s" repeatCount="indefinite" />
      </line>
      <line x1="23" y1="16" x2="29" y2="16" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.6s" repeatCount="indefinite" />
      </line>
      <line x1="23" y1="19" x2="27" y2="19" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="1s" repeatCount="indefinite" />
      </line>
      {/* 스파클 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
        <line x1="18" y1="5" x2="18" y2="8" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="16.5" y1="6.5" x2="19.5" y2="6.5" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
