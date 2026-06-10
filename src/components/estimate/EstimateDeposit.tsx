'use client';

import { useState, useCallback } from 'react';
import { useQuoteStore } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';
import { SelectCard } from '@/components/ui/SelectCard';
import { IconShield } from '@/components/icons/RentailorIcons';

interface EstimateDepositProps {
  onAdvance: () => void;
}

const TRANSITION_DELAY_MS = 300;

// 없음(0%) / 30% 두 가지만. 보증금은 견적 숫자에 영향을 주지 않고(가격표가 보증금별로
// 나뉘어 있지 않음) 상담 리드에 기록되는 메타데이터다. prepaymentPct 필드(비율)에 저장한다.
const OPTIONS = [
  { pct: 0 as const, label: '보증금 없음', sub: '초기 비용 부담이 가장 적어요' },
  { pct: 30 as const, label: '보증금 30%', sub: '월 납부금을 낮추고 싶을 때' },
];

export function EstimateDeposit({ onAdvance }: EstimateDepositProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const setPrepaymentPct = useQuoteStore((s) => s.setPrepaymentPct);
  const setDeposit = useQuoteStore((s) => s.setDeposit);

  const handleSelect = useCallback(
    (pct: 0 | 30) => {
      if (selected !== null) return;
      setSelected(pct);
      setPrepaymentPct(pct);
      setDeposit(0);
      gtag.stepComplete(4, `보증금 ${pct}%`);
      setTimeout(onAdvance, TRANSITION_DELAY_MS);
    },
    [selected, setPrepaymentPct, setDeposit, onAdvance]
  );

  return (
    <>
      <div className="pt-7 px-5 pb-2 text-center">
        <h2 className="text-[22px] font-bold text-text leading-snug">
          보증금을 선택해 주세요
        </h2>
        <p className="text-sm text-text-sub mt-2">
          나중에 상담에서 조정할 수 있어요
        </p>
      </div>

      <div className="flex flex-col gap-2.5 px-5 py-3">
        {OPTIONS.map((opt) => (
          <SelectCard
            key={opt.pct}
            selected={selected === opt.pct}
            dimmed={selected !== null && selected !== opt.pct}
            disabled={selected !== null}
            onClick={() => handleSelect(opt.pct)}
          >
            <IconShield size={24} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className={`text-base font-semibold ${selected === opt.pct ? 'text-white' : 'text-text'}`}>
                {opt.label}
              </div>
              <div className={`text-[13px] mt-0.5 ${selected === opt.pct ? 'text-white/70' : 'text-text-sub'}`}>
                {opt.sub}
              </div>
            </div>
          </SelectCard>
        ))}
      </div>

      {/* "보증금이 뭐예요?" 쉬운 설명 토글 */}
      <div className="px-5 pb-4">
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          className="w-full text-left text-sm font-semibold text-primary py-2"
        >
          보증금이 뭐예요? {showHelp ? '▲' : '▼'}
        </button>
        {showHelp && (
          <div className="mt-1 p-4 rounded-2xl bg-primary/5 border border-primary/15 text-sm text-text-sub leading-relaxed">
            <p className="mb-2">
              <b className="text-text">보증금</b>은 계약을 시작할 때 미리 맡겨두는 돈이에요.
              계약이 끝나면 <b className="text-text">돌려받습니다.</b>
            </p>
            <p>
              보증금을 더 내면 <b className="text-text">매달 내는 금액(월 납부금)이 낮아져요.</b>
              부담이 없다면 <b className="text-text">‘없음’</b>을 골라도 됩니다.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
