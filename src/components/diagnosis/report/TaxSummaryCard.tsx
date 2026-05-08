'use client';

import type { AutoTaxResult } from '@/lib/domain/auto-tax-calculator';
import type { AcquisitionTaxResult } from '@/lib/domain/acquisition-tax-calculator';

interface Props {
  autoTax:    AutoTaxResult;
  acqTax:     AcquisitionTaxResult;
  isEV:       boolean;
  vehicleAge: number;
}

function TaxRow({
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
    <div className="flex items-start justify-between py-2.5 border-b border-[#F2F2F7] last:border-0">
      <div>
        <p className="text-[13px] font-medium text-[#1C1C1E]">{label}</p>
        {sub && <p className="text-[11px] text-[#8E8E93] mt-0.5">{sub}</p>}
      </div>
      <p
        className={`text-[14px] font-bold text-right ml-4 shrink-0 ${
          highlight ? 'text-[#007AFF]' : 'text-[#1C1C1E]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function fmtWon(n: number) {
  const mk = Math.round(n / 10000);
  return mk > 0 ? `${mk.toLocaleString()}만원` : '0원';
}

export function TaxSummaryCard({ autoTax, acqTax, isEV, vehicleAge }: Props) {
  // 5년간 누적 자동차세 (매년 1~5% 경감 반영은 복잡하므로, 현재 연도 기준 평균으로 근사)
  const autoTax5yr = Math.round(autoTax.discountedTotal * 5 / 10000);

  return (
    <div className="space-y-6">
      {/* 자동차세 */}
      <div>
        <p className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wide mb-2">
          자동차세
        </p>

        {isEV ? (
          <div className="flex items-center gap-3 py-3 px-4 bg-[#34C75910] rounded-xl">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-[14px] font-bold text-[#34C759]">전기차 — 자동차세 면제</p>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">연 100,000원 정액 (지방교육세 포함)</p>
            </div>
            <p className="ml-auto text-[14px] font-bold text-[#34C759]">13만원/년</p>
          </div>
        ) : (
          <>
            <TaxRow
              label={`${vehicleAge}년차 연간 자동차세`}
              value={fmtWon(autoTax.discountedTotal)}
              sub={`자동차세 ${fmtWon(autoTax.autoTax)} + 지방교육세 ${fmtWon(autoTax.localEduTax)} (경감률 ${Math.round(autoTax.discountRate * 100)}%)`}
              highlight
            />
            <TaxRow
              label="5년 누적 자동차세 (추정)"
              value={`약 ${autoTax5yr.toLocaleString()}만원`}
              sub="연식 경감 평균 적용"
            />
          </>
        )}
      </div>

      {/* 취등록세 */}
      <div>
        <p className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wide mb-2">
          취등록세 비교 (신차 기준)
        </p>

        <TaxRow
          label="신차 구매 시 취득세"
          value={fmtWon(acqTax.finalTax)}
          sub={`세율 ${Math.round(acqTax.taxRate * 100)}%${acqTax.evDiscount > 0 ? ` · EV 감면 ${fmtWon(acqTax.evDiscount)}` : ''}${acqTax.hevDiscount > 0 ? ` · HEV 감면 ${fmtWon(acqTax.hevDiscount)}` : ''}`}
          highlight
        />

        <div className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-[13px] font-medium text-[#1C1C1E]">장기렌트 시 취득세</p>
            <p className="text-[11px] text-[#8E8E93] mt-0.5">렌터카 회사가 명의, 고객 부담 없음</p>
          </div>
          <p className="text-[14px] font-bold text-[#34C759]">0원</p>
        </div>

        {acqTax.finalTax > 0 && (
          <div className="mt-2 flex items-center gap-2 px-4 py-3 bg-[#34C75910] rounded-xl">
            <span className="text-lg">💡</span>
            <p className="text-[12px] text-[#1C1C1E]">
              장기렌트 선택 시 취득세{' '}
              <span className="font-bold text-[#34C759]">{fmtWon(acqTax.finalTax)}</span>{' '}
              절감 가능
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
