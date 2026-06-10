'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuoteStore } from '@/store/quoteStore';
import { Button } from '@/components/ui/Button';
import { IconCarSedan } from '@/components/icons/RentailorIcons';

interface EstimateResultProps {
  onAdvance: () => void;
}

type PreviewState =
  | { status: 'loading' }
  | { status: 'ok'; min: number; max: number }
  | { status: 'none' };

const PERIOD_LABEL: Record<number, string> = { 36: '36개월', 48: '48개월', 60: '60개월' };
const KM_LABEL: Record<number, string> = { 10000: '연 1만 km', 20000: '연 2만 km', 30000: '연 3만 km' };

export function EstimateResult({ onAdvance }: EstimateResultProps) {
  const carBrand = useQuoteStore((s) => s.carBrand);
  const carModel = useQuoteStore((s) => s.carModel);
  const contractMonths = useQuoteStore((s) => s.contractMonths);
  const annualKm = useQuoteStore((s) => s.annualKm);
  const prepaymentPct = useQuoteStore((s) => s.prepaymentPct);

  const [state, setState] = useState<PreviewState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!carBrand || !carModel || !contractMonths || !annualKm) {
        setState({ status: 'none' });
        return;
      }
      try {
        const res = await fetch('/api/estimate-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand: carBrand, model: carModel, contractMonths, annualKm }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (json?.status === 'ok' && typeof json.min === 'number' && typeof json.max === 'number') {
          setState({ status: 'ok', min: json.min, max: json.max });
        } else {
          setState({ status: 'none' });
        }
      } catch {
        if (!cancelled) setState({ status: 'none' });
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [carBrand, carModel, contractMonths, annualKm]);

  const conditionLine = [
    contractMonths ? PERIOD_LABEL[contractMonths] : null,
    annualKm ? KM_LABEL[annualKm] : null,
    prepaymentPct ? `선납금 ${prepaymentPct}%` : '선납금 없음',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="px-5 pt-7 pb-4">
      {/* 선택한 차종 */}
      <div className="flex items-center justify-center gap-2 mb-1 text-text-sub text-sm">
        <IconCarSedan size={16} className="text-primary" />
        <span className="font-semibold text-text">
          {carBrand} {carModel}
        </span>
      </div>
      <p className="text-center text-xs text-text-muted mb-6">{conditionLine}</p>

      {state.status === 'loading' && (
        <div className="py-12 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-sub">예상 금액을 계산하고 있어요…</p>
        </div>
      )}

      {state.status === 'ok' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <p className="text-sm text-text-sub mb-2">월 예상 납입금</p>
          <div className="text-[40px] leading-tight font-extrabold text-text">
            {state.min === state.max ? (
              <>월 {state.min}만원</>
            ) : (
              <>
                월 {state.min}~{state.max}
                <span className="text-2xl">만원</span>
              </>
            )}
          </div>
          <p className="mt-4 text-xs text-text-muted leading-relaxed">
            AI 추정치 · 실제 견적은 상담 시 확정됩니다
          </p>
        </motion.div>
      )}

      {state.status === 'none' && (
        <div className="text-center py-6">
          <div className="text-[22px] font-bold text-text leading-snug mb-3">
            이 차종은 상담으로
            <br />
            정확한 견적을 안내해 드려요
          </div>
          <p className="text-sm text-text-sub leading-relaxed">
            선택하신 조건의 최신 시세를 상담사가
            <br />
            정확하게 확인해 드립니다.
          </p>
        </div>
      )}

      {state.status !== 'loading' && (
        <div className="mt-8">
          <Button type="button" variant="primary" size="lg" fullWidth onClick={onAdvance} className="shimmer-gold">
            상담 신청하고 정확한 견적 받기
          </Button>
        </div>
      )}
    </div>
  );
}
