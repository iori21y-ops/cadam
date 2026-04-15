'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconCar({ size = 34, className = '' }: IconProps) {
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
        <radialGradient id="car-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="car-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#car-glow)" />
      {/* 차체 */}
      <rect x="4" y="19" width="28" height="7" rx="2" stroke="url(#car-gold)" strokeWidth="1.8" />
      {/* 지붕 */}
      <path d="M8 19L11 13H25L28 19" stroke="url(#car-gold)" strokeWidth="1.8" strokeLinejoin="round" />
      {/* 창문 */}
      <path d="M13 19L15 14H21L23 19" stroke="url(#car-gold)" strokeWidth="1.2" />
      {/* 앞바퀴 펄스 */}
      <circle cx="10" cy="26" r="3" stroke="url(#car-gold)" strokeWidth="1.8">
        <animate attributeName="r" values="3;3.8;3" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.5;1" dur="1.8s" repeatCount="indefinite" />
      </circle>
      {/* 뒷바퀴 펄스 */}
      <circle cx="26" cy="26" r="3" stroke="url(#car-gold)" strokeWidth="1.8">
        <animate attributeName="r" values="3;3.8;3" dur="1.8s" begin="0.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.5;1" dur="1.8s" begin="0.4s" repeatCount="indefinite" />
      </circle>
      {/* 헤드라이트 빔 */}
      <line x1="4" y1="21" x2="1" y2="20" stroke="#FFE082" strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" repeatCount="indefinite" />
      </line>
      <line x1="4" y1="23" x2="1" y2="23" stroke="#FFE082" strokeWidth="1" strokeLinecap="round">
        <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.5s" begin="0.2s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}
