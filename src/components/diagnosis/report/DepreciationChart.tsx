'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { YearlyRow } from '@/lib/domain/depreciation-calculator';

interface Props {
  curve: YearlyRow[];
  currentAge: number;    // 현재 차령 (강조 표시)
  msrp: number | null;   // 신차가 (만원)
}

interface TooltipPayload {
  value: number;
  payload: {
    age: number;
    value: number;
    retentionRate: number | null;
    year: number;
  };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#F2F2F7] px-3 py-2.5 text-[12px]">
      <p className="font-bold text-[#1C1C1E] mb-1">차령 {d.age}년 ({d.year}년식)</p>
      <p className="text-[#007AFF] font-semibold">{d.value.toLocaleString()}만원</p>
      {d.retentionRate !== null && (
        <p className="text-[#8E8E93]">잔존가치 {Math.round(d.retentionRate * 100)}%</p>
      )}
    </div>
  );
}

export function DepreciationChart({ curve, currentAge, msrp }: Props) {
  if (!curve.length) return null;

  const chartData = curve.map((row) => ({
    age:           row.age,
    year:          row.year,
    value:         row.value,
    retentionRate: row.retentionRate,
    label:         `${row.age}년`,
  }));

  // Y축 최대값: msrp가 있으면 그 값 이상, 없으면 데이터 최대값 × 1.1
  const dataMax = Math.max(...curve.map((r) => r.value));
  const yMax    = msrp && msrp > dataMax ? msrp * 1.05 : dataMax * 1.15;

  // Y축 눈금: 0 ~ yMax를 4등분
  const yTick = Math.ceil(yMax / 4 / 500) * 500;
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round(i * yTick));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#007AFF" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" vertical={false} />

        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#8E8E93' }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          ticks={yTicks}
          tickFormatter={(v: number) => v === 0 ? '0' : `${(v / 10000).toFixed(0)}억`}
          tick={{ fontSize: 10, fill: '#8E8E93' }}
          axisLine={false}
          tickLine={false}
          width={36}
          domain={[0, yMax]}
        />

        <Tooltip content={<CustomTooltip />} />

        {/* 신차가 기준선 */}
        {msrp && (
          <ReferenceLine
            y={msrp}
            stroke="#C9A84C"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{ value: '신차가', position: 'right', fontSize: 10, fill: '#C9A84C' }}
          />
        )}

        {/* 현재 차령 기준선 */}
        {currentAge >= 1 && currentAge <= 10 && (
          <ReferenceLine
            x={`${currentAge}년`}
            stroke="#007AFF"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{ value: '현재', position: 'top', fontSize: 10, fill: '#007AFF' }}
          />
        )}

        <Area
          type="monotone"
          dataKey="value"
          stroke="#007AFF"
          strokeWidth={2.5}
          fill="url(#depGrad)"
          dot={(props) => {
            const { cx = 0, cy = 0, index = 0 } = props as { cx?: number; cy?: number; index?: number };
            const isCurrent = chartData[index]?.age === currentAge;
            return (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={isCurrent ? 6 : 3.5}
                fill={isCurrent ? '#007AFF' : 'white'}
                stroke="#007AFF"
                strokeWidth={isCurrent ? 0 : 2}
              />
            );
          }}
          activeDot={{ r: 6, fill: '#007AFF', stroke: 'white', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
