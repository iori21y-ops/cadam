'use client';

import React from 'react';

type Variant = 'primary' | 'secondary' | 'surface' | 'outline' | 'ghost' | 'kakao' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:cursor-default';

const VARIANTS: Record<Variant, string> = {
  primary:   'bg-primary text-white hover:opacity-90 disabled:bg-[#D1D1D6] disabled:opacity-100',
  secondary: 'bg-surface-secondary border border-[#E5E5EA] text-text hover:border-primary hover:text-primary disabled:opacity-60',
  surface:   'bg-surface shadow-sm text-text-sub hover:text-text disabled:opacity-60',
  outline:   'border border-primary text-primary bg-surface-secondary hover:bg-primary/5 disabled:opacity-60',
  ghost:     'bg-transparent text-text-muted underline hover:text-primary disabled:opacity-60',
  kakao:     'bg-kakao text-[#3C1E1E] hover:opacity-90 disabled:opacity-60',
  danger:    'text-danger hover:bg-danger/10 disabled:opacity-60',
};

const SIZES: Record<Size, string> = {
  sm: 'py-2 px-3 text-xs rounded-xl',
  md: 'py-3 px-5 text-sm rounded-2xl',
  lg: 'py-3.5 px-6 text-sm rounded-2xl',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[BASE, VARIANTS[variant], SIZES[size], fullWidth ? 'w-full' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}

export interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a
      {...props}
      className={[BASE, VARIANTS[variant], SIZES[size], fullWidth ? 'w-full' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </a>
  );
}
