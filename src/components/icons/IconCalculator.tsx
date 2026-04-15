'use client';
import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconCalculator({ size = 34, className = '' }: IconProps) {
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
        <radialGradient id="calc-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="calc-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate attributeName="stop-color" values="#8B6914;#F0D060;#C9A84C;#8B6914" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate attributeName="stop-color" values="#C9A84C;#8B6914;#F0D060;#C9A84C" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#calc-glow)" />
      {/* 계산기 외곽 */}
      <rect x="8" y="5" width="20" height="26" rx="2.5" stroke="url(#calc-gold)" strokeWidth="1.8" />
      {/* 디스플레이 글로우 */}
      <rect x="11" y="8" width="14" height="6" rx="1" stroke="url(#calc-gold)" strokeWidth="1.4">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </rect>
      {/* 버튼 6개 — 순차 깜빡임 (0.3s 간격) */}
      {[
        { x: 11, y: 18, delay: '0s' },
        { x: 16.5, y: 18, delay: '0.3s' },
        { x: 22, y: 18, delay: '0.6s' },
        { x: 11, y: 23, delay: '0.9s' },
        { x: 16.5, y: 23, delay: '1.2s' },
        { x: 22, y: 23, delay: '1.5s' },
      ].map((btn, i) => (
        <rect key={i} x={btn.x} y={btn.y} width="3" height="3" rx="0.6" stroke="#FFE082" strokeWidth="1.2">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" begin={btn.delay} repeatCount="indefinite" />
          <animate attributeName="fill" values="transparent;rgba(240,208,96,0.3);transparent" dur="1.8s" begin={btn.delay} repeatCount="indefinite" />
        </rect>
      ))}
    </svg>
  );
}
