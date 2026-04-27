'use client';

import type { MileageGroup } from '@/lib/domain/depreciation-calculator';

// 환경부 고시 충전단가 (원/kWh)
const SLOW_PRICE_KWH  = 324.4;

// EV 전비 (km/kWh) — 국내 승용 평균
const EV_KM_PER_KWH = 6.0;

// 휘발유 기준 (리터당 가격, 연비)
const GAS_PRICE_PER_L    = 1_700;  // 원
const GAS_KM_PER_L       = 13.0;   // km/L

// mileageGroup → 월 주행거리 (km)
const MONTHLY_KM: Record<MileageGroup, number> = {
  low:  Math.round(10_000 / 12),   // ~833 km
  mid:  Math.round(15_000 / 12),   // ~1,250 km
  high: Math.round(20_000 / 12),   // ~1,667 km
};

export interface EvChargingStats {
  total_count:    number;
  fast_count:     number;
  slow_count:     number;
  fast_ratio:     number;
  avg_price_kwh:  number;
  fast_price_kwh: number;
  slow_price_kwh: number;
}

interface Props {
  mileageGroup: MileageGroup;
  stats:        EvChargingStats;
}

function fmtWon(n: number) {
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만원`;
  return `${Math.round(n).toLocaleString()}원`;
}

function fmtCount(n: number) {
  return n >= 10_000
    ? `${(n / 10_000).toFixed(1)}만개`
    : n.toLocaleString() + '개';
}

export function EvChargingCard({ mileageGroup, stats }: Props) {
  const monthlyKm = MONTHLY_KM[mileageGroup];

  // 월 충전비 (완속 기준)
  const monthlyChargingWon = Math.round((monthlyKm / EV_KM_PER_KWH) * SLOW_PRICE_KWH);

  // 동일 주행거리 휘발유 비용
  const monthlyGasWon = Math.round((monthlyKm / GAS_KM_PER_L) * GAS_PRICE_PER_L);

  // 월 절감액
  const monthlySavingWon = monthlyGasWon - monthlyChargingWon;

  // 연간 절감액
  const annualSavingWon = monthlySavingWon * 12;

  const mileageLabel = { low: '저주행 (연 1만km)', mid: '일반 (연 1.5만km)', high: '고주행 (연 2만km)' }[mileageGroup];

  return (
    <div className="space-y-4">
      {/* 월 충전비 vs 주유비 비교 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="px-4 py-3.5 bg-[#34C75910] rounded-xl">
          <p className="text-[11px] text-[#34C759] font-semibold mb-1">월 충전비 (완속)</p>
          <p className="text-[22px] font-bold text-[#1C1C1E] leading-tight">
            {fmtWon(monthlyChargingWon)}
          </p>
          <p className="text-[10px] text-[#8E8E93] mt-0.5">{stats.slow_price_kwh}원/kWh</p>
        </div>
        <div className="px-4 py-3.5 bg-[#F2F2F7] rounded-xl">
          <p className="text-[11px] text-[#8E8E93] font-semibold mb-1">동일 거리 주유비</p>
          <p className="text-[22px] font-bold text-[#8E8E93] leading-tight line-through">
            {fmtWon(monthlyGasWon)}
          </p>
          <p className="text-[10px] text-[#8E8E93] mt-0.5">{GAS_PRICE_PER_L.toLocaleString()}원/L 기준</p>
        </div>
      </div>

      {/* 절감 하이라이트 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#007AFF0D] rounded-xl">
        <span className="text-2xl">⚡</span>
        <div className="flex-1">
          <p className="text-[13px] font-bold text-[#1C1C1E]">
            매달{' '}
            <span className="text-[#34C759]">{fmtWon(monthlySavingWon)}</span>{' '}
            절감
          </p>
          <p className="text-[11px] text-[#8E8E93] mt-0.5">
            연간 {fmtWon(annualSavingWon)} 절감 · {mileageLabel}
          </p>
        </div>
      </div>

      {/* 전국 충전 인프라 */}
      <div>
        <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wide mb-2">
          전국 공개 충전 인프라
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '전체 충전기', value: fmtCount(stats.total_count), color: '#007AFF' },
            { label: '급속',        value: fmtCount(stats.fast_count),  color: '#FF9500' },
            { label: '완속',        value: fmtCount(stats.slow_count),  color: '#34C759' },
          ].map((item) => (
            <div key={item.label} className="text-center px-2 py-2.5 bg-[#F2F2F7] rounded-xl">
              <p className="text-[10px] text-[#8E8E93] mb-1">{item.label}</p>
              <p className="text-[13px] font-bold" style={{ color: item.color }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#8E8E93] mt-2 text-right">
          환경부 등록 기준 · 2026년 4월
        </p>
      </div>

      {/* 충전단가 비교 */}
      <div className="pt-2 border-t border-[#F2F2F7]">
        <div className="flex justify-between items-center py-1.5">
          <div>
            <p className="text-[12px] font-medium text-[#1C1C1E]">급속 충전단가</p>
            <p className="text-[10px] text-[#8E8E93]">DC콤보·차데모 기준</p>
          </div>
          <p className="text-[13px] font-bold text-[#FF9500]">
            {stats.fast_price_kwh}원/kWh
          </p>
        </div>
        <div className="flex justify-between items-center py-1.5 border-t border-[#F2F2F7]">
          <div>
            <p className="text-[12px] font-medium text-[#1C1C1E]">완속 충전단가</p>
            <p className="text-[10px] text-[#8E8E93]">AC완속 기준</p>
          </div>
          <p className="text-[13px] font-bold text-[#34C759]">
            {stats.slow_price_kwh}원/kWh
          </p>
        </div>
      </div>

      <p className="text-[10px] text-[#8E8E93]">
        ※ 충전비는 완속 기준 추정값이며, 급속·이용 요금제에 따라 달라질 수 있습니다.
        주유비는 전국 평균 기준이며 지역·유종에 따라 다릅니다.
      </p>
    </div>
  );
}
