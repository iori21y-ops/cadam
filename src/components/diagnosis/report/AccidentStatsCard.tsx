'use client';

interface CarTypeStat {
  lossRate:      number;   // 손해율 (%)
  injuredPer10k: number;   // 만 가입건당 부상자
  deathPer10k:   number;   // 만 가입건당 사망자
  totalInjured:  number;
  totalDeath:    number;
}

interface Props {
  carType:  '소형' | '중형' | '대형' | '다인승';
  stats:    Record<string, CarTypeStat>;
  year:     string;   // '2025' 등
  isAnnual: boolean;  // true = 연간 전체 데이터
  trend?:   { year: string; lossRates: Record<string, number> }[];
}

const CAR_TYPE_ORDER: Array<'소형' | '중형' | '대형' | '다인승'> = ['소형', '중형', '대형', '다인승'];

const BAR_COLORS: Record<string, string> = {
  소형:   '#007AFF',
  중형:   '#5856D6',
  대형:   '#34C759',
  다인승: '#FF9500',
};

function fmtNum(n: number): string {
  return n.toLocaleString();
}

export function AccidentStatsCard({ carType, stats, year, isAnnual, trend }: Props) {
  const availTypes = CAR_TYPE_ORDER.filter((ct) => stats[ct] != null);
  if (availTypes.length === 0) return null;

  const current = stats[carType];
  if (!current) return null;

  const lossRates   = availTypes.map((ct) => stats[ct].lossRate);
  const maxLossRate = Math.max(...lossRates, 1);
  const minLossRate = Math.min(...lossRates);
  const diffPp      = Math.round((maxLossRate - minLossRate) * 10) / 10;

  // 현재 차종의 8개년 손해율 추이
  const myTrend = trend
    ?.map((t) => ({ year: t.year, lossRate: t.lossRates[carType] ?? null }))
    .filter((t): t is { year: string; lossRate: number } => t.lossRate !== null)
    ?? [];
  const trendMax = myTrend.length > 0 ? Math.max(...myTrend.map((t) => t.lossRate)) : 100;
  const trendMin = myTrend.length > 0 ? Math.min(...myTrend.map((t) => t.lossRate)) : 0;
  const trendDiff = Math.round((trendMax - trendMin) * 10) / 10;

  const periodLabel = isAnnual ? `${year}년 연간` : `${year}년 ${/* month */''} 기준`;

  return (
    <div className="rounded-2xl border border-[#F2F2F7] overflow-hidden">

      {/* 헤더 */}
      <div className="px-4 py-3 flex items-center gap-2 bg-[#F2F2F7]">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-[#8E8E93]">
          참고
        </span>
        <p className="text-[13px] font-bold text-[#1C1C1E]">사고 통계</p>
        <span className="ml-auto text-[11px] text-[#8E8E93]">{periodLabel}</span>
      </div>

      <div className="px-4 pt-4 pb-3 space-y-4">

        {/* 손해율 비교 바 */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wide">
            차종별 손해율 비교
          </p>
          {availTypes.map((ct) => {
            const s    = stats[ct];
            const isCur = ct === carType;
            const barW = Math.max((s.lossRate / 100) * 100, 2);  // 0~100% 스케일
            return (
              <div key={ct}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 w-14 shrink-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: BAR_COLORS[ct] }}
                    />
                    <span className={`text-[11px] font-semibold ${isCur ? 'text-[#1C1C1E]' : 'text-[#6D6D72]'}`}>
                      {ct}
                    </span>
                  </div>
                  <div className="flex-1 h-2.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barW}%`, background: BAR_COLORS[ct], opacity: isCur ? 1 : 0.55 }}
                    />
                  </div>
                  <div className="w-16 text-right shrink-0 flex items-center justify-end gap-1">
                    <span className={`text-[12px] font-bold ${isCur ? 'text-[#1C1C1E]' : 'text-[#6D6D72]'}`}>
                      {s.lossRate}%
                    </span>
                    {isCur && (
                      <span className="text-[9px] font-semibold text-white bg-[#8E8E93] px-1 py-0.5 rounded-full">
                        이 차
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-[#8E8E93] mt-1">
            손해율 = 지급 보험금 ÷ 수입 보험료 · 차종 간 최대 차이{' '}
            <span className="font-semibold text-[#1C1C1E]">{diffPp}%p</span>
          </p>
        </div>

        {/* 이 차종 상세 */}
        <div className="rounded-xl bg-[#F9F9F9] border border-[#F2F2F7] px-3.5 py-3">
          <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wide mb-2">
            이 차종({carType}) {year}년 전국 집계
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-[#8E8E93]">총 부상자</p>
              <p className="text-[14px] font-bold text-[#1C1C1E]">
                {fmtNum(current.totalInjured)}명
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#8E8E93]">총 사망자</p>
              <p className="text-[14px] font-bold text-[#1C1C1E]">
                {fmtNum(current.totalDeath)}명
              </p>
            </div>
          </div>
        </div>

        {/* 8개년 손해율 추이 */}
        {myTrend.length >= 3 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wide">
              이 차종 손해율 추이 (8개년)
            </p>
            <div className="h-[48px] flex items-end gap-[3px]">
              {myTrend.map(({ year: y, lossRate }, i) => {
                const isLast = i === myTrend.length - 1;
                const barPx  = Math.min(Math.max(Math.round((lossRate / 100) * 48), 3), 48);
                return (
                  <div key={y} className="flex-1 flex flex-col items-center justify-end">
                    <div
                      className="w-full rounded-t-[2px]"
                      style={{ height: barPx, background: isLast ? BAR_COLORS[carType] : `${BAR_COLORS[carType]}44` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-[3px]">
              {myTrend.map(({ year: y, lossRate }, i) => {
                const isLast = i === myTrend.length - 1;
                return (
                  <div key={y} className="flex-1 text-center">
                    <p className="text-[8px] leading-none" style={{ color: isLast ? BAR_COLORS[carType] : '#8E8E93' }}>
                      {y.slice(2)}
                    </p>
                    <p className="text-[8px] font-semibold leading-tight" style={{ color: isLast ? BAR_COLORS[carType] : '#3C3C43' }}>
                      {lossRate}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-[#8E8E93] text-right">
              % · 8개년 변동 폭{' '}
              <span className="font-semibold text-[#1C1C1E]">{trendDiff}%p</span>
            </p>
          </div>
        )}

        {/* 솔직한 해석 */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#007AFF08] border border-[#007AFF15]">
          <span className="text-[12px] mt-0.5 shrink-0">ℹ️</span>
          <p className="text-[11px] text-[#374151] leading-relaxed">
            차종 간 손해율 차이가{' '}
            <span className="font-semibold">{diffPp}%p 수준으로 매우 작습니다.</span>{' '}
            실제 사고 위험은 차종보다 <span className="font-semibold">운전 습관·도로 환경</span>에
            더 크게 좌우됩니다.
          </p>
        </div>
      </div>

      {/* 면책 */}
      <div className="px-4 pb-4">
        <p className="text-[10px] text-[#8E8E93] leading-relaxed">
          * 금융위원회 자동차보험통계 {year}년 {isAnnual ? '연간' : '누적'} 기준.
          개인용 보험 기준. 손해상황은 보험금 지급 청구 기준이며 실제 사고 건수와 다를 수 있음.
        </p>
      </div>
    </div>
  );
}

