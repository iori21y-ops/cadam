'use client';

import React from 'react';

interface SelectCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  dimmed?: boolean;
  compact?: boolean;
  /** 선택 시 색상 (기본값: #C9A84C, accent 골드) */
  color?: string;
}

export function SelectCard({
  selected = false,
  dimmed = false,
  compact = false,
  color = '#C9A84C',
  className = '',
  children,
  style,
  ...props
}: SelectCardProps) {
  return (
    <button
      {...props}
      style={{
        '--card-accent': color,
        ...(dimmed ? { opacity: 0.4 } : {}),
        ...style,
      } as React.CSSProperties}
      className={[
        'relative w-full rounded-[20px] text-left flex items-center gap-3',
        'transition-all duration-300',
        compact ? 'p-3' : 'p-7',
        selected
          ? 'border-2 border-transparent bg-white/10 scale-[1.02] shadow-[0_6px_20px_rgba(0,0,0,0.09)]'
          : 'border-2 border-transparent bg-white shadow-[0_2px_16px_rgba(0,0,0,0.05)]',
        !selected && !props.disabled
          ? 'hover:scale-[1.015]'
          : '',
        props.disabled ? 'cursor-default' : 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
      {/* 라디오 서클 */}
      <div
        className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
        style={
          selected
            ? { background: '#FFF' }
            : { border: '2px solid #D1D1D6' }
        }
      >
        {selected && (
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M2 6l3 3 5-5"
              stroke={color}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </button>
  );
}
