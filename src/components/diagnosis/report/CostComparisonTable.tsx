'use client';

import { calcMonthly } from '@/lib/calc-monthly';

interface Props {
  msrp:               number;  // 신차가 (만원)
  acquisitionTax:     number;  // 취득세 (만원)
  annualAutoTax:      number;  // 연간 자동차세 (만원)
  residual5yr:        number;  // 5년차 잔존가치 (만원)
  annualInsurance?:   number;  // 연간 보험료 (만원) — insurance-stats API
  monthlyFuel?:       number;  // 월 유류비 (만원) — fuel-prices API
  annualMaintenance?: number;  // Phase 3 예정: 연간 정비비 (만원)
}

interface CostRow {
  key:                string;
  label:              string;
  color:              string;
  monthly:            number;  // 만원
  financeAmount:      number;  // 납입금 합계 (monthly × 60)
  acqTax:             number;  // 취득세 부담 (만원)
  acqIncluded:        boolean; // 포함 배지 (장기렌트)
  autoTax5yr:         number;  // 자동차세 5년 (만원)
  taxIncluded:        boolean; // 포함 배지 (장기렌트)
  insurance5yr:       number;  // 보험료 5년 (만원)
  insuranceIncluded:  boolean; // 포함 배지 (장기렌트)
  fuel5yr:            number;  // 유류비 5년 (만원) — 3개 옵션 동일
  tco5yr:             number;  // 5년 TCO 순비용 (만원)
  residual:           number;  // 만기 잔존가치 (만원)
}

function fmt(n: number) {
  return `${n.toLocaleString()}만원`;
}

function IncludedBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#34C759] bg-[#34C75912] px-1.5 py-0.5 rounded-full">
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
        <path d="M1.5 4l2 2 3-3" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      포함
    </span>
  );
}

function BreakdownRow({
  label,
  value,
  included = false,
}: {
  label:    string;
  value:    string;
  included?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[#6D6D72]">{label}</span>
      <span className="text-[12px] font-semibold text-[#1C1C1E]">
        {included ? (
          <span className="flex items-center gap-1.5">
            <span className="text-[#8E8E93]">0원</span>
            <IncludedBadge />
          </span>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

function Row({
  row,
  maxTco,
  isCheapest,
}: {
  row:        CostRow;
  maxTco:     number;
  isCheapest: boolean;
}) {
  const barPct = maxTco > 0 ? Math.min((row.tco5yr / maxTco) * 100, 100) : 0;

  return (
    <div className="py-4 border-b border-[#F2F2F7] last:border-0">
      {/* 상단: 라벨 + 최저TCO 배지 + 월납입금 */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: row.color }} />
          <span className="text-[15px] font-bold text-[#1C1C1E]">{row.label}</span>
          {isCheapest && (
            <span className="text-[10px] font-bold text-[#34C759] bg-[#34C75918] px-2 py-0.5 rounded-full">
              최저 TCO
            </span>
          )}
        </div>
        <span className="text-[14px] font-bold" style={{ color: row.color }}>
          월 {fmt(row.monthly)}
        </span>
      </div>

      {/* TCO 비율 바 */}
      <div className="h-2 w-full bg-[#F2F2F7] rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full"
          style={{ width: `${barPct}%`, background: row.color }}
        />
      </div>

      {/* 비용 내역 */}
      <div className="space-y-1.5 mb-3">
        <BreakdownRow
          label="월납입금 × 60개월"
          value={fmt(row.financeAmount)}
        />
        <BreakdownRow
          label="취등록세"
          value={row.acqTax > 0 ? fmt(row.acqTax) : '0원'}
          included={row.acqIncluded}
        />
        <BreakdownRow
          label="자동차세 × 5년"
          value={fmt(row.autoTax5yr)}
          included={row.taxIncluded}
        />
        {(row.insurance5yr > 0 || row.insuranceIncluded) && (
          <BreakdownRow
            label="보험료 × 5년"
            value={row.insurance5yr > 0 ? fmt(row.insurance5yr) : '0원'}
            included={row.insuranceIncluded}
          />
        )}
        {row.fuel5yr > 0 && (
          <BreakdownRow
            label="유류비 × 5년"
            value={fmt(row.fuel5yr)}
          />
        )}
      </div>

      {/* 합계 영역: 5년 TCO + 잔존가치 */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl"
        style={{ background: `${row.color}12` }}
      >
        <div>
          <p className="text-[10px] text-[#8E8E93]">5년 TCO (순비용)</p>
          <p className="text-[16px] font-bold" style={{ color: row.color }}>
            {fmt(row.tco5yr)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#8E8E93]">만기 잔존가치</p>
          <p className="text-[13px] font-semibold text-[#34C759]">
            {row.residual > 0 ? `+${fmt(row.residual)}` : '-'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CostComparisonTable({
  msrp,
  acquisitionTax,
  annualAutoTax,
  residual5yr,
  annualInsurance,
  monthlyFuel,
  annualMaintenance: _maint, // Phase 3 예정
}: Props) {
  const PERIOD       = 60;
  const autoTax5yr   = annualAutoTax * 5;
  const insurance5yr = annualInsurance != null ? Math.round(annualInsurance * 5) : 0;
  const fuel5yr      = monthlyFuel    != null ? monthlyFuel * PERIOD : 0;

  const mInstall = calcMonthly(msrp, 'installment', PERIOD, 0, 20000);
  const mLease   = calcMonthly(msrp, 'lease',       PERIOD, 0, 20000);
  const mRent    = calcMonthly(msrp, 'rent',         PERIOD, 0, 20000);

  const rows: CostRow[] = [
    {
      key:               'installment',
      label:             '할부',
      color:             '#007AFF',
      monthly:           mInstall,
      financeAmount:     mInstall * PERIOD,
      acqTax:            acquisitionTax,
      acqIncluded:       false,
      autoTax5yr,
      taxIncluded:       false,
      insurance5yr,
      insuranceIncluded: false,
      fuel5yr,
      // TCO = 납입금 + 취득세 + 자동차세 + 보험료 + 유류비 − 잔존가치
      tco5yr: mInstall * PERIOD + acquisitionTax + autoTax5yr + insurance5yr + fuel5yr - residual5yr,
      residual: residual5yr,
    },
    {
      key:               'lease',
      label:             '리스',
      color:             '#5856D6',
      monthly:           mLease,
      financeAmount:     mLease * PERIOD,
      acqTax:            acquisitionTax,
      acqIncluded:       false,
      autoTax5yr,
      taxIncluded:       false,
      insurance5yr,
      insuranceIncluded: false,
      fuel5yr,
      // TCO = 납입금 + 취득세 + 자동차세 + 보험료 + 유류비 (만기 후 차 반환)
      tco5yr: mLease * PERIOD + acquisitionTax + autoTax5yr + insurance5yr + fuel5yr,
      residual: 0,
    },
    {
      key:               'rent',
      label:             '장기렌트',
      color:             '#34C759',
      monthly:           mRent,
      financeAmount:     mRent * PERIOD,
      acqTax:            0,
      acqIncluded:       true,
      autoTax5yr:        0,
      taxIncluded:       true,
      insurance5yr:      0,
      insuranceIncluded: annualInsurance != null,
      fuel5yr,
      // TCO = 납입금 + 유류비 (취득세·세금·보험료는 월납입금에 포함)
      tco5yr: mRent * PERIOD + fuel5yr,
      residual: 0,
    },
  ];

  const tcoValues = rows.map((r) => r.tco5yr);
  const minTco    = Math.min(...tcoValues);
  const maxTco    = Math.max(...tcoValues);

  return (
    <div>
      <p className="text-[11px] text-[#8E8E93] mb-3">
        신차가 {msrp.toLocaleString()}만원 기준 · 60개월 · 연 2만km · 선납금 없음
        {annualInsurance != null && ` · 보험료 연 ${annualInsurance.toLocaleString()}만원`}
        {monthlyFuel != null && ` · 유류비 월 ${monthlyFuel.toLocaleString()}만원`}
      </p>

      {rows.map((row) => (
        <Row
          key={row.key}
          row={row}
          maxTco={maxTco}
          isCheapest={row.tco5yr === minTco}
        />
      ))}

      <p className="text-[10px] text-[#8E8E93] mt-3 leading-relaxed">
        * TCO = 납입금 합계 + 취득세 + 자동차세 5년
        {annualInsurance != null ? ' + 보험료 5년' : ''}
        {monthlyFuel != null ? ' + 유류비 5년' : ''}
        {' − 만기 잔존가치.'}
        {annualInsurance != null && ' 보험료는 금융감독원 통계 기반 추정치. 장기렌트는 월납입금에 포함.'}
        {monthlyFuel != null && ' 유류비는 오피넷 전국 평균가 기준 추정치.'}
        {annualInsurance == null && monthlyFuel == null && ' 보험료·유류비·정비비 미포함.'}
        {' '}자동차세는 연식 경감 미반영. 유류비는 3개 옵션 동일 적용.
      </p>
    </div>
  );
}
