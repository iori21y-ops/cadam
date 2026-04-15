'use client';
import React from 'react';

export function IconAIDiag({ size = 34, className = '' }: { size?: number; className?: string }) {
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
        <radialGradient id="aidiag-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="aidiag-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#aidiag-glow)" />
      {/* 외부 원 */}
      <circle cx="18" cy="18" r="13" stroke="url(#aidiag-gold)" strokeWidth="1.6" />
      {/* 스캔 파동 링 */}
      <circle cx="18" cy="18" r="13" stroke="#FFE082" strokeWidth="1" fill="none" opacity="0">
        <animate attributeName="r" values="13;18;13" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0;0.7" dur="2.5s" repeatCount="indefinite" />
      </circle>
      {/* 심전도 파형 (stroke-dashoffset 드로잉) */}
      <path
        d="M5 18H10L12 12L15 24L17 16L19 20L21 14L23 22L25 18H31"
        stroke="#FFE082"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="60"
        strokeDashoffset="60"
      >
        <animate attributeName="stroke-dashoffset" values="60;0;60" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="stroke" values="#FFE082;#FFF3C4;#FFE082" dur="2.5s" repeatCount="indefinite" />
      </path>
      {/* 스파클 1 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
        <line x1="7" y1="7" x2="7" y2="10" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="5.5" y1="8.5" x2="8.5" y2="8.5" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      {/* 스파클 2 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="2.5s" begin="1.5s" repeatCount="indefinite" />
        <line x1="29" y1="7" x2="29" y2="10" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="27.5" y1="8.5" x2="30.5" y2="8.5" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
