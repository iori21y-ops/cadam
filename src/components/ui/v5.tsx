import React from 'react';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function V5Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('min-h-screen bg-surface-secondary', className)}>{children}</div>;
}

export function V5Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cx('bg-white rounded-2xl p-5', className)}>{children}</div>;
}

export function V5SectionTitle({
  title,
  description,
  right,
  className,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex items-start justify-between gap-3 mb-3', className)}>
      <div>
        <div className="text-sm font-bold text-[#1D1D1F]">{title}</div>
        {description && <div className="text-[11px] text-[#86868B] mt-0.5">{description}</div>}
      </div>
      {right}
    </div>
  );
}

export function V5Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cx('block text-[11px] font-semibold text-[#86868B] mb-1', className)}>
      {children}
    </label>
  );
}

const fieldBase =
  'w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-[14px] py-[10px] text-sm text-[#1D1D1F] outline-none';

export function V5Input(props: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  const { className, ...rest } = props;
  return <input {...rest} className={cx(fieldBase, className)} />;
}

export function V5TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={cx(fieldBase, 'resize-y', className)} />;
}

export function V5PrimaryButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...rest}
      className={cx(
        'px-4 py-2 rounded-[10px] text-xs font-semibold bg-[#007AFF] text-white disabled:opacity-60',
        className
      )}
    >
      {children}
    </button>
  );
}

export function V5SecondaryButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...rest}
      className={cx(
        'px-4 py-2 rounded-[10px] text-xs font-semibold bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5EA] disabled:opacity-60',
        className
      )}
    >
      {children}
    </button>
  );
}

export function V5DangerButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...rest}
      className={cx('px-3 py-2 rounded-[10px] text-xs font-semibold text-[#FF3B30] hover:bg-[#FF3B300D]', className)}
    >
      {children}
    </button>
  );
}

export function V5Pill({
  active,
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; className?: string }) {
  return (
    <button
      {...rest}
      className={cx(
        'px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap',
        active ? 'bg-[#007AFF] text-white' : 'text-[#86868B] hover:text-[#007AFF] hover:bg-[#007AFF0D]',
        className
      )}
    >
      {children}
    </button>
  );
}

