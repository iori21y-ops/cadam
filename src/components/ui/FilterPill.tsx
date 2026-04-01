'use client';

import React from 'react';

interface FilterPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  size?: 'sm' | 'md';
}

const BASE =
  'shrink-0 rounded-full font-semibold border transition-all whitespace-nowrap';

const SIZES = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
};

export function FilterPill({
  active = false,
  size = 'sm',
  className = '',
  children,
  ...props
}: FilterPillProps) {
  return (
    <button
      {...props}
      className={[
        BASE,
        SIZES[size],
        active
          ? 'bg-primary text-white border-primary'
          : 'bg-white text-text-sub border-border-solid hover:border-primary hover:text-primary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}
