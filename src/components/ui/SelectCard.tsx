'use client';

import React from 'react';

interface SelectCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  dimmed?: boolean;
  compact?: boolean;
  /** 선택 시 색상 (기본값: #007AFF) */
  color?: string;
}

export function SelectCard({
  selected = false,
  dimmed = false,
  compact = false,
  color = '#007AFF',
  className = '',
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: SelectCardProps) {
  const selectedShadow = `0 4px 24px ${color}40`;

  return (
    <button
      {...props}
      style={{
        ...(selected
          ? { background: color, borderColor: color, boxShadow: selectedShadow }
          : {}),
        ...(dimmed ? { opacity: 0.4 } : {}),
        ...style,
      }}
      className={[
        'relative w-full rounded-[20px] text-left flex items-center gap-3',
        'border-2 transition-all duration-300',
        compact ? 'p-3' : 'p-7',
        !selected
          ? 'bg-white border-transparent shadow-[0_2px_16px_rgba(0,0,0,0.05)]'
          : '',
        props.disabled ? 'cursor-default' : 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseEnter={(e) => {
        if (!selected && !props.disabled) {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.transform = 'scale(1.015)';
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!selected && !props.disabled) {
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.transform = 'scale(1)';
        }
        onMouseLeave?.(e);
      }}
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
