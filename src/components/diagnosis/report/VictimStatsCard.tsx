'use client';

interface SeverityBucket {
  count: number;
  pct:   number;
}

export interface VictimStats {
  total_persons: number;
  severity: {
    minor:    SeverityBucket;  // 경상 12-14등급
    moderate: SeverityBucket;  // 중상 6-11등급
    severe:   SeverityBucket;  // 중증 1-5등급
    death:    SeverityBucket;  // 사망
  };
  period: { from: string; to: string };
}

interface Props {
  stats: VictimStats;
}

const BARS: { key: keyof VictimStats['severity']; label: string; color: string }[] = [
  { key: 'minor',    label: '경상',  color: '#34C759' },
  { key: 'moderate', label: '중상',  color: '#FF9500' },
  { key: 'severe',   label: '중증',  color: '#FF3B30' },
  { key: 'death',    label: '사망',  color: '#8E8E93' },
];

function fmtYm(ym: string): string {
  return `${ym.slice(0, 4)}.${ym.slice(4)}`;
}

export function VictimStatsCard({ stats }: Props) {
  const { severity, period } = stats;
  const minorPct = severity.minor.pct;
  const nonCriticalPct = Math.round((severity.minor.pct + severity.moderate.pct) * 10) / 10;

  return (
    <div className="rounded-2xl border border-[#F2F2F7] overflow-hidden">

      {/* 헤더 */}
      <div className="px-4 py-3 flex items-center gap-2 bg-[#34C75908]">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-[#34C759]">
          부상 통계
        </span>
        <p className="text-[13px] font-bold text-[#1C1C1E]">교통사고 부상 경중 분포</p>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-3.5">
        {/* 핵심 수치 */}
        <div className="flex items-end gap-3">
          <div>
            <p className="text-[11px] text-[#8E8E93] mb-0.5">경상(가벼운 부상) 비율</p>
            <p className="text-[28px] font-bold text-[#34C759] leading-tight">{minorPct}%</p>
          </div>
          <p className="text-[13px] text-[#8E8E93] mb-1.5">
            경상+중상 합계 {nonCriticalPct}%
          </p>
        </div>

        {/* 스택형 가로 바 */}
        <div>
          <div className="h-5 w-full flex rounded-lg overflow-hidden">
            {BARS.map(({ key, color }) => {
              const pct = severity[key].pct;
              if (pct < 0.1) return null;
              return (
                <div
                  key={key}
                  style={{ width: `${pct}%`, background: color }}
                  title={`${pct}%`}
                />
              );
            })}
          </div>
          {/* 범례 */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {BARS.map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
                <span className="text-[10px] text-[#6D6D72]">{label}</span>
                <span className="text-[10px] font-semibold text-[#1C1C1E]">
                  {severity[key].pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 장기렌트 연계 안내 */}
        <div className="rounded-xl bg-[#34C75912] px-3.5 py-3">
          <p className="text-[11px] font-bold text-[#34C759] mb-1.5">장기렌트 포함 보험</p>
          <div className="space-y-1.5">
            {[
              { icon: '✓', text: '경상·중상·중증 전 구간 처리 — 매년 갱신·납부 없이 자동' },
              { icon: '✓', text: '렌탈사가 보험 관리 → 사고 시 창구 단일화' },
            ].map(({ icon, text }, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[11px] font-bold text-[#34C759] shrink-0">{icon}</span>
                <p className="text-[12px] text-[#1C1C1E]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 면책 */}
        <p className="text-[10px] text-[#8E8E93] leading-relaxed">
          * 금융위원회 자동차보험 피해자 통계.
          {' '}{fmtYm(period.from)}~{fmtYm(period.to)} 누적 데이터 기준.
          실제 사고 결과는 개별 상황에 따라 다릅니다.
        </p>
      </div>
    </div>
  );
}
