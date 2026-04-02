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

// ─── 다차원 리드 분석 컴포넌트 ───

export interface LeadDimensionsData {
  engagement: number;
  intent: number;
  specificity: number;
  contact: number;
  inflow: number;
}

const DIMENSIONS: {
  key: keyof LeadDimensionsData;
  label: string;
  max: number;
}[] = [
  { key: 'engagement', label: '참여도', max: 20 },
  { key: 'intent', label: '구매 의향', max: 25 },
  { key: 'specificity', label: '견적 구체성', max: 20 },
  { key: 'contact', label: '연락 수단', max: 25 },
  { key: 'inflow', label: '유입 품질', max: 10 },
];

function getBarColor(pct: number): string {
  if (pct >= 80) return 'bg-red-500';
  if (pct >= 60) return 'bg-amber-500';
  if (pct >= 40) return 'bg-blue-500';
  return 'bg-gray-300';
}

function getLevel(pct: number): { text: string; color: string } {
  if (pct >= 80) return { text: '높음', color: 'text-red-600' };
  if (pct >= 60) return { text: '중상', color: 'text-amber-600' };
  if (pct >= 40) return { text: '보통', color: 'text-blue-600' };
  if (pct >= 20) return { text: '낮음', color: 'text-gray-500' };
  return { text: '미참여', color: 'text-gray-400' };
}

interface LeadDimensionsProps {
  dimensions: LeadDimensionsData;
  score: number;
}

export function LeadDimensions({ dimensions, score }: LeadDimensionsProps) {
  const { label, emoji } = getGrade(score);

  return (
    <div className="rounded-xl bg-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-gray-700">📊 리드 점수 분석</h4>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">{score}점</span>
          <LeadBadge score={score} />
        </div>
      </div>

      {/* 총점 요약 */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{emoji} {label}</span>
          <span>{score}/100</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${score >= 80 ? 'bg-red-500' : score >= 50 ? 'bg-amber-500' : score >= 20 ? 'bg-yellow-400' : 'bg-gray-400'}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* 차원별 바 */}
      <div className="space-y-2">
        {DIMENSIONS.map(({ key, label: dimLabel, max }) => {
          const val = dimensions[key];
          const pct = Math.round((val / max) * 100);
          const barColor = getBarColor(pct);
          const level = getLevel(pct);

          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16 shrink-0">{dimLabel}</span>
              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-gray-600 w-8 text-right">{val}/{max}</span>
              <span className={`text-[10px] font-bold w-8 ${level.color}`}>{level.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
