'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { calcMonthly } from '@/lib/calc-monthly';

interface Props {
  msrp:            number;   // 신차가 (만원)
  acquisitionTax:  number;   // 취득세 (만원)
  annualAutoTax:   number;   // 연간 자동차세 (만원)
  residual5yr:     number;   // 5년차 잔존가치 (만원)
  annualInsurance?: number;  // 연간 보험료 (만원)
  monthlyFuel?:    number;   // 월 유류비 (만원)
  /** comparison-engine에서 계산된 월납입 (만원). 제공 시 내부 calcMonthly 대신 사용 */
  preCalcMonthly?: { installment: number; lease: number; rent: number };
}

interface YearPoint {
  year:        number;
  label:       string;
  installment: number;
  lease:       number;
  rent:        number;
}

interface TooltipPayload {
  name:  string;
  value: number;
  color: string;
}

const COLORS = {
  installment: '#007AFF',
  lease:       '#5856D6',
  rent:        '#34C759',
};

const LABELS: Record<string, string> = {
  installment: '할부',
  lease:       '리스',
  rent:        '장기렌트',
};

function buildTimeline(
  mInstall: number,
  mLease:   number,
  mRent:    number,
  acqTax:   number,
  annualAutoTax: number,
  annualIns: number,
  annualFuel: number,
  residual5yr: number,
): YearPoint[] {
  return [1, 2, 3, 4, 5].map((n) => {
    const commonFixed = acqTax + n * annualAutoTax + n * annualIns + n * annualFuel;
    return {
      year:  n,
      label: `${n}년차`,
      installment: Math.round(n * 12 * mInstall + commonFixed - (n === 5 ? residual5yr : 0)),
      lease:       Math.round(n * 12 * mLease   + commonFixed),
      rent:        Math.round(n * 12 * mRent    + n * annualFuel),
    };
  });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => a.value - b.value);
  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#F2F2F7] px-3.5 py-3 text-[12px] min-w-[140px]">
      <p className="font-bold text-[#1C1C1E] mb-2">{label}</p>
      {sorted.map((p) => (
        <div key={p.name} className="flex justify-between gap-4 mb-1 last:mb-0">
          <span style={{ color: p.color }} className="font-medium">
            {LABELS[p.name] ?? p.name}
          </span>
          <span className="text-[#1C1C1E] font-semibold">
            {p.value.toLocaleString()}만원
          </span>
        </div>
      ))}
    </div>
  );
}

export function CostTimelineChart({
  msrp,
  acquisitionTax,
  annualAutoTax,
  residual5yr,
  annualInsurance,
  monthlyFuel,
  preCalcMonthly,
}: Props) {
  const PERIOD   = 60;
  const mInstall = preCalcMonthly?.installment ?? calcMonthly(msrp, 'installment', PERIOD, 0, 20000);
  const mLease   = preCalcMonthly?.lease       ?? calcMonthly(msrp, 'lease',       PERIOD, 0, 20000);
  const mRent    = preCalcMonthly?.rent        ?? calcMonthly(msrp, 'rent',         PERIOD, 0, 20000);

  const annualIns  = (annualInsurance ?? 0);
  const annualFuel = (monthlyFuel ?? 0) * 12;

  const data = buildTimeline(
    mInstall, mLease, mRent,
    acquisitionTax, annualAutoTax,
    annualIns, annualFuel,
    residual5yr,
  );

  const allValues = data.flatMap((d) => [d.installment, d.lease, d.rent]);
  const yMax = Math.ceil(Math.max(...allValues) / 100) * 100;

  // 최저 TCO 옵션 (5년차 기준)
  const pt5 = data[4];
  const minKey = (['rent', 'installment', 'lease'] as const).reduce((a, b) =>
    pt5[a] <= pt5[b] ? a : b,
  );

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#8E8E93' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, yMax]}
            tick={{ fontSize: 10, fill: '#8E8E93' }}
            tickFormatter={(v: number) => `${(v / 100).toFixed(0)}백만`}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => (
              <span style={{ fontSize: 11, color: '#6D6D72' }}>
                {LABELS[value] ?? value}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="installment"
            stroke={COLORS.installment}
            strokeWidth={2}
            dot={{ r: 3, fill: COLORS.installment }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="lease"
            stroke={COLORS.lease}
            strokeWidth={2}
            dot={{ r: 3, fill: COLORS.lease }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="rent"
            stroke={COLORS.rent}
            strokeWidth={2.5}
            dot={{ r: 3, fill: COLORS.rent }}
            activeDot={{ r: 5 }}
          />
          {/* 최저 TCO 강조 점 */}
          <ReferenceDot
            x="5년차"
            y={pt5[minKey]}
            r={6}
            fill={COLORS[minKey]}
            stroke="white"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 범례 아래 보조 설명 */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-[#8E8E93]">
          {residual5yr > 0 && '할부 5년차: 잔존가치 차감 포함. '}
          {(annualInsurance == null || monthlyFuel == null) && '보험료·유류비 로딩 중 일부 미포함.'}
        </p>
        <div
          className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
          style={{ color: COLORS[minKey], background: `${COLORS[minKey]}18` }}
        >
          <span>●</span>
          <span>{LABELS[minKey]} 최저</span>
        </div>
      </div>
    </div>
  );
}
