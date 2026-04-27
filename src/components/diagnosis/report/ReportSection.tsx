'use client';

interface ReportSectionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  className?: string;
}

export function ReportSection({
  title,
  subtitle,
  badge,
  badgeColor = '#007AFF',
  children,
  className = '',
}: ReportSectionProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-[#F2F2F7] overflow-hidden diagnosis-section-card ${className}`}>
      <div className="px-5 pt-5 pb-4 border-b border-[#F2F2F7]">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full shrink-0" style={{ background: badgeColor }} />
          <h3 className="text-[15px] font-bold text-[#1C1C1E]">{title}</h3>
          {badge && (
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${badgeColor}18`, color: badgeColor }}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-[12px] text-[#8E8E93] mt-1 ml-3">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
