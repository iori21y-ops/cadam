'use client';

import { calcMonthly } from '@/lib/calc-monthly';
import type { YearlyRow } from '@/lib/domain/depreciation-calculator';

interface Props {
  msrp:            number;      // 신차가 (만원)
  currentValue:    number;      // 현재 시세 (만원)
  vehicleAge:      number;      // 차령 (년)
  curve:           YearlyRow[]; // 감가상각 커브 (1~10년)
  annualAutoTax:   number;      // 연간 자동차세 (만원)
  annualInsurance?: number;     // 연간 보험료 (만원)
  monthlyFuel?:    number;      // 월 유류비 (만원)
}

function fmt(n: number) {
  return `${Math.round(n).toLocaleString()}만원`;
}

function CostRow({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[#F2F2F7] last:border-0">
      <div>
        <p className={`text-[12px] ${highlight ? 'font-bold text-[#1C1C1E]' : 'text-[#6D6D72]'}`}>
          {label}
        </p>
        {sub && <p className="text-[10px] text-[#8E8E93] mt-0.5">{sub}</p>}
      </div>
      <p className={`text-[13px] font-semibold ml-4 shrink-0 ${highlight ? 'text-[#1C1C1E]' : 'text-[#3A3A3C]'}`}>
        {value}
      </p>
    </div>
  );
}

export function SwitchTimingCard({
  msrp,
  currentValue,
  vehicleAge,
  curve,
  annualAutoTax,
  annualInsurance,
  monthlyFuel,
}: Props) {
  // 1년 후 시세 (커브에서 vehicleAge+1 조회, 없으면 15% 정률 추정)
  const nextYearRow  = curve.find((r) => r.age === vehicleAge + 1);
  const nextYearValue = nextYearRow?.value ?? Math.round(currentValue * 0.85);
  const depreciation1yr = Math.max(0, currentValue - nextYearValue);

  // 현재 차 1년 실비용 내역
  const annualIns   = annualInsurance ?? 0;
  const annualFuel  = (monthlyFuel ?? 0) * 12;
  const annualTotal = depreciation1yr + annualAutoTax + annualIns + annualFuel;
  const monthlyEquiv = annualTotal / 12;

  // 장기렌트 월납입금 (신차 기준 60개월)
  const monthlyRent = calcMonthly(msrp, 'rent', 60, 0, 20000);

  // 비교: 양수 = 렌트가 더 비쌈, 음수 = 현재 차 실비용이 더 비쌈
  const diff = Math.round(monthlyRent - monthlyEquiv);
  const rentCheaper = diff < 0;  // 음수면 렌트가 오히려 저렴

  // 권고 레벨
  const absDiff = Math.abs(diff);
  const strong  = absDiff >= 20;

  return (
    <div className="space-y-4">

      {/* 현재 차 1년 실비용 */}
      <div>
        <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wide mb-2">
          현재 차 1년 실비용
        </p>
        <div>
          <CostRow
            label="감가상각 손실"
            value={fmt(depreciation1yr)}
            sub={`${vehicleAge}년차 → ${vehicleAge + 1}년차 시세 하락`}
          />
          <CostRow
            label="자동차세"
            value={fmt(annualAutoTax)}
          />
          {annualIns > 0 && (
            <CostRow
              label="보험료 (추정)"
              value={fmt(annualIns)}
            />
          )}
          {annualFuel > 0 && (
            <CostRow
              label="유류비 (추정)"
              value={fmt(annualFuel)}
              sub={`월 ${monthlyFuel}만원 × 12`}
            />
          )}
          <CostRow
            label="연간 합계"
            value={fmt(annualTotal)}
            highlight
          />
          <div className="mt-2 px-3 py-2 bg-[#F2F2F7] rounded-xl flex justify-between items-center">
            <p className="text-[11px] text-[#8E8E93]">월 환산</p>
            <p className="text-[15px] font-bold text-[#1C1C1E]">
              ≈ {fmt(Math.round(monthlyEquiv))}/월
            </p>
          </div>
        </div>
      </div>

      {/* 비교 비율 바 */}
      <div>
        <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wide mb-2">
          장기렌트 전환 시
        </p>
        <div className="space-y-2">
          {/* 현재 차 월 환산 바 */}
          {(() => {
            const maxVal   = Math.max(monthlyEquiv, monthlyRent);
            const ownPct   = (monthlyEquiv / maxVal) * 100;
            const rentPct  = (monthlyRent  / maxVal) * 100;
            return (
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#8E8E93]">현재 차 유지 (월 환산)</span>
                    <span className="font-semibold text-[#FF9500]">{fmt(Math.round(monthlyEquiv))}</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#F2F2F7] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#FF9500]" style={{ width: `${ownPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#8E8E93]">장기렌트 월납입금 (신차)</span>
                    <span className="font-semibold text-[#34C759]">{fmt(monthlyRent)}</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#F2F2F7] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#34C759]" style={{ width: `${rentPct}%` }} />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 결론 카드 */}
      <div
        className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
        style={{
          background: rentCheaper ? '#34C75910' : '#007AFF0D',
        }}
      >
        <span className="text-2xl shrink-0">{rentCheaper ? '🔥' : '💡'}</span>
        <div>
          {rentCheaper ? (
            <>
              <p className="text-[13px] font-bold text-[#1C1C1E]">
                지금 전환이 오히려 저렴합니다
              </p>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">
                현재 차 실비용(월 {fmt(Math.round(monthlyEquiv))})이 장기렌트({fmt(monthlyRent)})보다
                월 <span className="font-semibold text-[#34C759]">{fmt(absDiff)}</span> 더 비쌉니다.
                감가상각 손실({fmt(depreciation1yr)}/년)이 주요 원인입니다.
              </p>
            </>
          ) : (
            <>
              <p className="text-[13px] font-bold text-[#1C1C1E]">
                월 {fmt(diff)} 추가로 새 차로 전환
              </p>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">
                {strong
                  ? `현재 차 유지(월 ${fmt(Math.round(monthlyEquiv))})가 더 경제적이나, 감가상각 손실(${fmt(depreciation1yr)}/년)과 신차 편의성을 감안하면 전환 검토 가치가 있습니다.`
                  : `차이가 크지 않습니다. 신차 편의성·보증·최신 안전사양을 원한다면 지금이 좋은 전환 시점입니다.`
                }
              </p>
            </>
          )}
        </div>
      </div>

      <p className="text-[10px] text-[#8E8E93]">
        ※ 장기렌트 월납입금은 신차가 기준 60개월 추정치. 현재 차 실비용의 감가는 엔카 데이터 기반 추정이며 실제 시세와 다를 수 있습니다.
        {(annualInsurance == null || monthlyFuel == null) && ' 보험료·유류비 미반영 항목 있음.'}
      </p>
    </div>
  );
}
