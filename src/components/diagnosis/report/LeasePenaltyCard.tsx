'use client';

/**
 * 리스 감가 패널티 카드 (Top12 ① + ②)
 *
 * ① 기회비용 모델:
 *    - 리스 5년 만기 반납 → 자산 0원
 *    - 할부 5년 후 매각 → residual5yr 회수 가능
 *    - 차이(residual5yr)가 리스의 숨은 비용
 *
 * ② 2024.6.1 시행 법개정:
 *    - 장기렌트(12개월 이상) 무사고 경력 개인 보험에 인정
 *    - 렌트의 기존 최대 단점 해소
 */

interface Props {
  msrp:        number;  // 신차가 (만원)
  residual5yr: number;  // 5년차 실제 시세 (만원) — depreciation-calculator 결과
}

function fmt(n: number) {
  return `${n.toLocaleString()}만원`;
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2.5 w-full bg-[#F2F2F7] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(pct, 2)}%`, background: color }}
      />
    </div>
  );
}

export function LeasePenaltyCard({ msrp, residual5yr }: Props) {
  const PERIOD = 60;

  // 잔존가치율 (%)
  const retentionPct   = msrp > 0 ? Math.round((residual5yr / msrp) * 100) : 0;

  // 리스의 숨은 월 기회비용
  const hiddenPerMonth = Math.round(residual5yr / PERIOD);

  // 바 비율 — 할부 기준 100%
  const installBarPct = 100;
  const leaseBarPct   = 0;

  // 리스 vs 할부 실질 차이 메시지 강도
  const severity: 'high' | 'mid' | 'low' =
    residual5yr >= 1500 ? 'high' :
    residual5yr >= 700  ? 'mid'  : 'low';

  const severityColor = severity === 'high' ? '#FF3B30' : severity === 'mid' ? '#FF9500' : '#8E8E93';
  const severityLabel = severity === 'high' ? '주의' : severity === 'mid' ? '확인' : '참고';

  return (
    <div className="rounded-2xl border border-[#F2F2F7] overflow-hidden">

      {/* ── 헤더 ──────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: `${severityColor}10` }}>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ background: severityColor }}
        >
          {severityLabel}
        </span>
        <p className="text-[13px] font-bold text-[#1C1C1E]">리스의 숨은 비용</p>
        <span className="ml-auto text-[11px] text-[#8E8E93]">5년 기준</span>
      </div>

      {/* ── 잔존가치 비교 시각화 ──────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 space-y-3.5">

        {/* 할부 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#007AFF]" />
              <span className="text-[12px] font-semibold text-[#1C1C1E]">할부 · 만기 후 매각</span>
            </div>
            <span className="text-[13px] font-bold text-[#007AFF]">+{fmt(residual5yr)}</span>
          </div>
          <Bar pct={installBarPct} color="#007AFF" />
          <p className="text-[10px] text-[#8E8E93] mt-1">
            5년 후 시세 회수 가능 (엔카 실데이터 기준 · 잔존율 {retentionPct}%)
          </p>
        </div>

        {/* 리스 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF3B30]" />
              <span className="text-[12px] font-semibold text-[#1C1C1E]">리스 · 만기 반납</span>
            </div>
            <span className="text-[13px] font-bold text-[#FF3B30]">0원</span>
          </div>
          <Bar pct={leaseBarPct} color="#FF3B30" />
          <p className="text-[10px] text-[#8E8E93] mt-1">
            만기 후 차 반납 → 잔존가치 전액 캐피탈사 귀속
          </p>
        </div>

        {/* 핵심 메시지 박스 */}
        <div className="rounded-xl px-3.5 py-3 mt-1" style={{ background: `${severityColor}10` }}>
          <p className="text-[12px] text-[#1C1C1E] leading-relaxed">
            이 차를 <span className="font-bold">리스로 5년 타면</span>{' '}
            할부 대비{' '}
            <span className="font-bold" style={{ color: severityColor }}>
              {fmt(residual5yr)}
            </span>{' '}
            의 자산을 포기하는 것과 같습니다.
          </p>
          <p className="text-[11px] text-[#8E8E93] mt-1">
            월 환산 기회비용 ≈{' '}
            <span className="font-semibold text-[#1C1C1E]">{fmt(hiddenPerMonth)}/월</span>
          </p>
        </div>
      </div>

      {/* ── 장기렌트의 장점 (법개정 포함) ───────────────────── */}
      <div className="px-4 pt-0 pb-4">
        <div className="rounded-xl bg-[#34C75912] px-3.5 py-3 space-y-2">
          <p className="text-[11px] font-bold text-[#34C759] uppercase tracking-wide">
            반면 장기렌트는
          </p>
          {[
            { icon: '✓', text: '처음부터 반납 전제 — 숨은 비용 없음' },
            { icon: '✓', text: '취득세·자동차세·보험료 월납입금에 포함' },
            {
              icon: '★',
              text: '2024.6.1~ 무사고 보험경력 인정',
              sub: '12개월 이상 장기렌트 무사고 시 개인 보험 갱신에 반영 (자동차손해배상보장법 시행규칙 개정)',
              highlight: true,
            },
          ].map(({ icon, text, sub, highlight }) => (
            <div key={text} className="flex items-start gap-2">
              <span
                className={`text-[11px] font-bold mt-0.5 shrink-0 ${highlight ? 'text-[#34C759]' : 'text-[#34C759]'}`}
              >
                {icon}
              </span>
              <div>
                <p className={`text-[12px] ${highlight ? 'font-semibold text-[#1C1C1E]' : 'text-[#1C1C1E]'}`}>
                  {text}
                </p>
                {sub && (
                  <p className="text-[10px] text-[#8E8E93] mt-0.5 leading-relaxed">{sub}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
