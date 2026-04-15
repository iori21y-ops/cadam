'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconLightning({ size = 34, className = '' }: IconProps) {
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
        <radialGradient id="lightning-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lightning-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF3C4" />
          <stop offset="50%" stopColor="#FFE082" />
          <stop offset="100%" stopColor="#C9A84C" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#lightning-glow)" />
      {/* 번개 외곽 (초밝은 #FFF3C4) */}
      <polygon
        points="20 5 10 20 17 20 16 31 26 16 19 16 20 5"
        stroke="#FFF3C4"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      >
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1.2s" repeatCount="indefinite" />
      </polygon>
      {/* 번개 fill (#FFE082 플래시) */}
      <polygon
        points="20 5 10 20 17 20 16 31 26 16 19 16 20 5"
        fill="#FFE082"
        opacity="0.7"
      >
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="fill" values="#FFE082;#FFF3C4;#FFE082" dur="1.2s" repeatCount="indefinite" />
      </polygon>
      {/* 번개 inner core (#FFF3C4) */}
      <polygon
        points="20 9 13 20 17.5 20 16.5 27 23 16 19.5 16 20 9"
        fill="#FFF3C4"
        opacity="0"
      >
        <animate attributeName="opacity" values="0;0.8;0" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
      </polygon>
      {/* 스파클 4개 */}
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="0s" repeatCount="indefinite" />
        <line x1="7" y1="8" x2="7" y2="11" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="5.5" y1="9.5" x2="8.5" y2="9.5" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
        <line x1="29" y1="8" x2="29" y2="11" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="27.5" y1="9.5" x2="30.5" y2="9.5" stroke="#FFF3C4" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
        <line x1="7" y1="26" x2="7" y2="29" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="5.5" y1="27.5" x2="8.5" y2="27.5" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      <g>
        <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="0.9s" repeatCount="indefinite" />
        <line x1="29" y1="26" x2="29" y2="29" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="27.5" y1="27.5" x2="30.5" y2="27.5" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
