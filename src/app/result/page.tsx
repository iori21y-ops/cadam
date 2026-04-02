'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHydrated } from '@/hooks/useHydrated';
import { useQuoteStore } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SimulationCalculator } from '@/components/diagnosis/SimulationCalculator';
import { loadProgress } from '@/lib/mission-progress';
import { VEHICLES, TRIMS } from '@/data/diagnosis-vehicles';
import { DEFAULT_PRODUCTS } from '@/data/diagnosis-products';
import type { ProductKey } from '@/types/diagnosis';

const PERIOD_LABELS: Record<number, string> = {
  36: '36개월',
  48: '48개월',
  60: '60개월',
};

const MILEAGE_LABELS: Record<number, string> = {
  10000: '연 1만 km',
  20000: '연 2만 km',
  30000: '연 3만 km',
  40000: '연 4만 km+',
};

function formatManwon(value: number): string {
  return `${(value / 10000).toLocaleString()}만`;
}

function SelectionSummary({
  contractMonths, annualKm, deposit, prepaymentPct,
}: {
  contractMonths: number | null; annualKm: number | null;
  deposit: number | null; prepaymentPct: number | null;
}) {
  const DEPOSIT_LABELS: Record<number, string> = { 0: '0%', 1000000: '10%', 2000000: '20%', 3000000: '30%' };
  const PREPAY_LABELS: Record<number, string> = { 0: '0%', 10: '10%', 20: '20%', 30: '30%' };

  const rows: { label: string; value: string }[] = [
    { label: '계약 기간', value: contractMonths ? PERIOD_LABELS[contractMonths] : '—' },
    { label: '주행거리', value: annualKm ? MILEAGE_LABELS[annualKm] : '—' },
  ];
  if (deposit != null) rows.push({ label: '보증금', value: DEPOSIT_LABELS[deposit] ?? '—' });
  if (prepaymentPct != null) rows.push({ label: '선납금', value: PREPAY_LABELS[prepaymentPct] ?? '—' });

  return (
    <div className="mx-5 rounded-2xl bg-white p-5 border border-border-solid mb-4">
      <div className="text-sm font-bold text-text mb-3">상담 신청 내역</div>
      {rows.map((row, i) => (
        <div key={row.label} className={`flex justify-between py-2 ${i < rows.length - 1 ? 'border-b border-border-solid' : ''}`}>
          <span className="text-[11px] text-text-sub">{row.label}</span>
          <span className="text-[13px] font-semibold text-text">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const name = useQuoteStore((s) => s.name);
  const phone = useQuoteStore((s) => s.phone);
  const contractMonths = useQuoteStore((s) => s.contractMonths);
  const annualKm = useQuoteStore((s) => s.annualKm);
  const deposit = useQuoteStore((s) => s.deposit);
  const prepaymentPct = useQuoteStore((s) => s.prepaymentPct);
  const estimatedMin = useQuoteStore((s) => s.estimatedMin);
  const estimatedMax = useQuoteStore((s) => s.estimatedMax);
  const resetAll = useQuoteStore((s) => s.resetAll);

  // 진단 결과 연동
  const [simCarName, setSimCarName] = useState('');
  const [simCarPrice, setSimCarPrice] = useState(3500);
  const [simProduct, setSimProduct] = useState<ProductKey | undefined>(undefined);

  useEffect(() => {
    const progress = loadProgress();

    // 차종 진단 결과 → 차량명 + 가격
    if (progress.vehicle.done && progress.vehicle.summary) {
      const summary = progress.vehicle.summary; // "현대 투싼"
      const parts = summary.split(' ');
      const carName = parts[parts.length - 1]; // "투싼"
      const vehicle = VEHICLES.find((v) => v.name === carName);
      if (vehicle) {
        // 트림이 있으면 트림 가격, 없으면 차량 기본 가격
        const trims = TRIMS[carName];
        const trimPrice = trims?.[Math.floor(trims.length / 2)]?.price; // 중간 트림
        setSimCarPrice(trimPrice ?? vehicle.price);
        setSimCarName(`${vehicle.brand} ${vehicle.name}`);
      } else {
        setSimCarName(summary);
      }
    }

    // 이용방법 진단 결과 → 추천 상품
    if (progress.finance.done && progress.finance.summary) {
      const summary = progress.finance.summary; // "장기렌트 87%"
      const productName = summary.split(' ')[0];
      const found = (Object.entries(DEFAULT_PRODUCTS) as [ProductKey, { name: string }][])
        .find(([, p]) => p.name === productName);
      if (found) setSimProduct(found[0]);
    }
  }, []);

  const kakaoUrl = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL ?? '#';
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '02-0000-0000';

  const handleRetry = () => {
    gtag.resultRetry();
    resetAll();
    router.push('/quote');
  };

  const isStoreEmpty = !name.trim() && !phone.trim();

  useEffect(() => {
    if (hydrated && isStoreEmpty) {
      router.replace('/quote');
    }
  }, [hydrated, isStoreEmpty, router]);

  if (!hydrated || isStoreEmpty) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-surface-secondary">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface-secondary">
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-lg mx-auto">
          {/* 완료 헤더 */}
          <div className="px-5 pt-8 pb-4 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4 text-2xl">
              ✅
            </div>
            <h1 className="text-[22px] font-bold text-text leading-snug">
              맞춤 상담 신청이 완료되었습니다!
            </h1>
            <p className="text-sm text-text-sub mt-3">
              전문 상담사가 빠르게 연락드리겠습니다
            </p>
          </div>

          {/* 예상 월 납부금 (API에서 받은 값) */}
          {estimatedMin != null && estimatedMax != null && (
            <div className="mx-5 mb-4 p-5 rounded-2xl bg-primary text-white text-center shadow-lg shadow-primary/20">
              <div className="text-[11px] opacity-90">예상 월 납부금</div>
              <div className="text-[30px] font-extrabold mt-2 tracking-tight">
                월 {formatManwon(estimatedMin)}~{formatManwon(estimatedMax)}만원
              </div>
            </div>
          )}

          {/* 진단 결과 요약 */}
          {(simCarName || simProduct) && (
            <div className="mx-5 mb-4 rounded-2xl bg-white p-5 border border-border-solid">
              <div className="text-sm font-bold text-text mb-3">AI 진단 결과 요약</div>
              {simCarName && (
                <div className="flex justify-between py-2 border-b border-border-solid">
                  <span className="text-[11px] text-text-sub">추천 차종</span>
                  <span className="text-[13px] font-semibold text-text">{simCarName}</span>
                </div>
              )}
              {simProduct && (
                <div className="flex justify-between py-2">
                  <span className="text-[11px] text-text-sub">추천 이용방법</span>
                  <span className="text-[13px] font-semibold" style={{ color: DEFAULT_PRODUCTS[simProduct].color }}>
                    {DEFAULT_PRODUCTS[simProduct].emoji} {DEFAULT_PRODUCTS[simProduct].name}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 상담 신청 내역 */}
          <SelectionSummary {...{ contractMonths, annualKm, deposit, prepaymentPct }} />

          {/* 월 납입금 시뮬레이션 (진단 결과 연동) */}
          {simCarName && (
            <div className="mx-5 mb-4">
              <SimulationCalculator
                carPrice={simCarPrice}
                carName={simCarName}
                recommendedProduct={simProduct}
              />
            </div>
          )}
        </div>
      </div>

      {/* CTA 버튼 (하단 고정) */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-5 py-4 bg-surface-secondary flex flex-col gap-3">
        <div className="bg-white rounded-2xl p-4 border border-border-solid shadow-[0_6px_18px_rgba(0,0,0,0.06)] flex flex-col gap-3">
          <ButtonLink
            variant="kakao"
            size="lg"
            fullWidth
            href={kakaoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => gtag.resultKakaoClick()}
          >
            💬 카카오톡으로 상담하기
          </ButtonLink>
          <ButtonLink
            variant="outline"
            size="lg"
            fullWidth
            href={`tel:${phoneNumber.replace(/-/g, '')}`}
            onClick={() => gtag.resultCallClick()}
          >
            📞 전화 상담 요청
          </ButtonLink>
          <Button
            type="button"
            variant="ghost"
            onClick={handleRetry}
            className="mt-1"
          >
            다른 조건으로 다시 상담하기
          </Button>
        </div>
      </div>
    </div>
  );
}
