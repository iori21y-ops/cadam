'use client';

interface TrendPoint { year: string; annual_mk: number; }

interface Props {
  annualMk:  number;
  breakdown: Record<string, number>;  // 담보별 월 보험료 (원) — insurance-stats API
  ageGroup?: string | null;
  sex?:      string | null;
  trend?:    TrendPoint[];
}

const COVERAGE_ORDER  = ['대인배상1', '대인배상2', '대물배상', '자기신체사고', '자기차량손해'] as const;
const COVERAGE_LABELS: Record<string, string> = {
  '대인배상1':   '대인Ⅰ',
  '대인배상2':   '대인Ⅱ',
  '대물배상':    '대물',
  '자기신체사고': '자기신체',
  '자기차량손해': '자차손해',
};
const COVERAGE_COLORS = ['#007AFF', '#5856D6', '#34C759', '#FF9500', '#FF3B30'];

function fmtMk(n: number) { return `${n.toLocaleString()}만원`; }

function fmtWon(won: number): string {
  const mk = won / 10000;
  if (mk >= 1) {
    const s = mk.toFixed(1);
    return (s.endsWith('.0') ? s.slice(0, -2) : s) + '만원';
  }
  return `${won.toLocaleString()}원`;
}

export function InsuranceInsightCard({ annualMk, breakdown, ageGroup, sex, trend }: Props) {
  const monthlyMk = Math.round(annualMk / 12);

  const severity: 'high' | 'mid' | 'low' =
    annualMk >= 150 ? 'high' :
    annualMk >= 80  ? 'mid'  : 'low';

  const severityColor = severity === 'high' ? '#FF9500' : severity === 'mid' ? '#5856D6' : '#8E8E93';
  const severityLabel = severity === 'high' ? '고액' : severity === 'mid' ? '중액' : '소액';

  const coverageEntries = COVERAGE_ORDER
    .filter((cov) => breakdown[cov] != null && breakdown[cov] > 0)
    .map((cov, i) => ({
      key:   cov,
      label: COVERAGE_LABELS[cov] ?? cov,
      won:   breakdown[cov],
      color: COVERAGE_COLORS[i],
    }));

  const maxWon = Math.max(...coverageEntries.map((e) => e.won), 1);

  const contextLabel = [ageGroup, sex].filter(Boolean).join(' ');

  return (
    <div className="rounded-2xl border border-[#F2F2F7] overflow-hidden">

      {/* 헤더 */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: `${severityColor}10` }}>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ background: severityColor }}
        >
          {severityLabel}
        </span>
        <p className="text-[13px] font-bold text-[#1C1C1E]">보험료 분석</p>
        <span className="ml-auto text-[11px] text-[#8E8E93]">연간 추정</span>
      </div>

      {/* 핵심 수치 */}
      <div className="px-4 pt-4 pb-3 space-y-3.5">
        <div className="flex items-end gap-3">
          <div>
            <p className="text-[11px] text-[#8E8E93] mb-0.5 flex items-center gap-1.5">
              연간 보험료 추정
              {contextLabel && (
                <span className="inline-flex items-center text-[10px] font-semibold text-[#FF9500] bg-[#FF950015] px-1.5 py-0.5 rounded-full">
                  {contextLabel} 기준
                </span>
              )}
            </p>
            <p className="text-[26px] font-bold text-[#1C1C1E] leading-tight">{fmtMk(annualMk)}</p>
          </div>
          <p className="text-[14px] text-[#8E8E93] mb-1">≈ 월 {fmtMk(monthlyMk)}</p>
        </div>

        {/* 담보별 바 차트 */}
        {coverageEntries.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wide">담보별 월 보험료</p>
            {coverageEntries.map(({ key, label, won, color }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[11px] text-[#6D6D72] w-14 shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-[#F2F2F7] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(won / maxWon) * 100}%`, background: color }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-[#1C1C1E] w-14 text-right shrink-0">
                  {fmtWon(won)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 연도별 보험료 추이 미니 차트 */}
        {trend && trend.length >= 3 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wide">연도별 보험료 추이</p>
            {/* Y축 0~70 고정 (차이가 작음을 시각적으로 표현) */}
            <div className="h-[56px] flex items-end gap-[3px]">
              {trend.map(({ year, annual_mk }, i) => {
                const isLast  = i === trend!.length - 1;
                const barPx   = Math.max(Math.round((annual_mk / 70) * 56), 3);
                return (
                  <div key={year} className="flex-1 flex flex-col items-center justify-end">
                    <div
                      className="w-full rounded-t-[2px]"
                      style={{ height: barPx, background: isLast ? '#007AFF' : '#007AFF33' }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-[3px]">
              {trend.map(({ year, annual_mk }, i) => {
                const isLast = i === trend!.length - 1;
                return (
                  <div key={year} className="flex-1 text-center">
                    <p className="text-[8px] leading-none" style={{ color: isLast ? '#007AFF' : '#8E8E93' }}>
                      {year.slice(2)}
                    </p>
                    <p className="text-[8px] font-semibold leading-tight" style={{ color: isLast ? '#007AFF' : '#3C3C43' }}>
                      {annual_mk}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-[#8E8E93] text-right">만원/년 · {trend[0].year}~{trend[trend.length-1].year}년</p>
          </div>
        )}

        {/* 장기렌트 포함 안내 */}
        <div className="rounded-xl bg-[#34C75912] px-3.5 py-3 space-y-2">
          <p className="text-[11px] font-bold text-[#34C759] uppercase tracking-wide">장기렌트는</p>
          {[
            {
              icon: '✓',
              text: (
                <>
                  <span className="font-semibold">연 {fmtMk(annualMk)}</span>이 월납입금에 자동 포함
                </>
              ),
            },
            {
              icon: '✓',
              text: '매년 갱신·납부 불필요 — 렌탈사가 관리',
            },
            {
              icon: '★',
              text: '무사고 보험경력 인정 (2024.6.1~)',
              sub:  '12개월 이상 장기렌트 무사고 시 개인 보험 갱신에 반영',
              bold: true,
            },
          ].map(({ icon, text, sub, bold }, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-[11px] font-bold text-[#34C759] mt-0.5 shrink-0">{icon}</span>
              <div>
                <p className={`text-[12px] text-[#1C1C1E] ${bold ? 'font-semibold' : ''}`}>{text}</p>
                {sub && <p className="text-[10px] text-[#8E8E93] mt-0.5 leading-relaxed">{sub}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 면책 */}
      <div className="px-4 pb-4">
        <p className="text-[10px] text-[#8E8E93] leading-relaxed">
          * 금융위원회 자동차보험 통계 기반 추정치
          {contextLabel ? ` (${contextLabel} 개인용 기준)` : ' (개인용 기준)'}.
          실제 보험료는 운전자 사고이력·차량 연식 등에 따라 다릅니다.
        </p>
      </div>
    </div>
  );
}
