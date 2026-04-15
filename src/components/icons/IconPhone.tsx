'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconPhone({ size = 34, className = '' }: IconProps) {
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
        <radialGradient id="phone-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="phone-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#phone-glow)" />
      {/* 전화기 */}
      <path
        d="M26 22.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 9.36 19a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 8.08 8.08h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L11.91 15.91a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 26 22.92z"
        stroke="url(#phone-gold)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 수신 파동 웨이브 1 */}
      <path d="M28 10C29.5 11.5 30.3 13.6 30.3 16" stroke="#FFE082" strokeWidth="1.5" strokeLinecap="round" fill="none">
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0s" repeatCount="indefinite" />
      </path>
      {/* 수신 파동 웨이브 2 */}
      <path d="M31 7C33.5 9.5 35 13 35 16.5" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" fill="none">
        <animate attributeName="opacity" values="0;0.7;0" dur="2s" begin="0.5s" repeatCount="indefinite" />
      </path>
      {/* 스파클 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2.5s" begin="1s" repeatCount="indefinite" />
        <line x1="7" y1="7" x2="7" y2="9.5" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="5.75" y1="8.25" x2="8.25" y2="8.25" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
