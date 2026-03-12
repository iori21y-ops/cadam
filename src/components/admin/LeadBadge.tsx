'use client';

interface LeadBadgeProps {
  score: number;
}

function getGrade(score: number): { label: string; emoji: string; className: string } {
  if (score >= 80) return { label: 'HOT', emoji: '🔴', className: 'bg-red-50 text-danger' };
  if (score >= 50) return { label: 'WARM', emoji: '🟠', className: 'bg-orange-50 text-warning' };
  if (score >= 20) return { label: 'COOL', emoji: '🟡', className: 'bg-yellow-50 text-yellow-700' };
  return { label: 'COLD', emoji: '⚪', className: 'bg-gray-50 text-gray-500' };
}

export function LeadBadge({ score }: LeadBadgeProps) {
  const { label, emoji, className } = getGrade(score);
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${className}`}
    >
      {emoji} {label} {score}
    </span>
  );
}
