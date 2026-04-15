'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconClock24({ size = 34, className = '' }: IconProps) {
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
        <radialGradient id="clock24-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="clock24-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#clock24-glow)" />
      {/* 시계 외곽 */}
      <circle cx="18" cy="18" r="12" stroke="url(#clock24-gold)" strokeWidth="1.8" />
      {/* 시침 (색상 변화) */}
      <line x1="18" y1="18" x2="18" y2="9" strokeLinecap="round" strokeWidth="2">
        <animate attributeName="stroke" values="#F0D060;#FFF3C4;#F0D060" dur="2s" repeatCount="indefinite" />
      </line>
      {/* 분침 */}
      <line x1="18" y1="18" x2="24" y2="18" stroke="#FFE082" strokeWidth="1.6" strokeLinecap="round" />
      {/* 4방향 마크 순차 펄스 */}
      <line x1="18" y1="7" x2="18" y2="9" stroke="#FFE082" strokeWidth="2" strokeLinecap="round">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin="0s" repeatCount="indefinite" />
      </line>
      <line x1="27" y1="18" x2="29" y2="18" stroke="#FFE082" strokeWidth="2" strokeLinecap="round">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin="0.5s" repeatCount="indefinite" />
      </line>
      <line x1="18" y1="27" x2="18" y2="29" stroke="#FFE082" strokeWidth="2" strokeLinecap="round">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin="1s" repeatCount="indefinite" />
      </line>
      <line x1="7" y1="18" x2="9" y2="18" stroke="#FFE082" strokeWidth="2" strokeLinecap="round">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin="1.5s" repeatCount="indefinite" />
      </line>
      {/* 24H 텍스트 */}
      <text x="18" y="22" textAnchor="middle" fill="#FFE082" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif">24H</text>
    </svg>
  );
}
