'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHydrated } from '@/hooks/useHydrated';
import { useQuoteStore } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';
import { Button, ButtonLink } from '@/components/ui/Button';

const DEPOSIT_RATIO_LABELS: Record<number, string> = {
  0: '0%',
  1000000: '10%',
  2000000: '20%',
  3000000: '30%',
};

const PREPAYMENT_LABELS: Record<number, string> = {
  0: '0%',
  10: '10%',
  20: '20%',
  30: '30%',
};

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

export default function ResultPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const selectionPath = useQuoteStore((s) => s.selectionPath);
  const name = useQuoteStore((s) => s.name);
  const phone = useQuoteStore((s) => s.phone);
  const carBrand = useQuoteStore((s) => s.carBrand);
  const carModel = useQuoteStore((s) => s.carModel);
  const trim = useQuoteStore((s) => s.trim);
  const contractMonths = useQuoteStore((s) => s.contractMonths);
  const annualKm = useQuoteStore((s) => s.annualKm);
  const deposit = useQuoteStore((s) => s.deposit);
  const prepaymentPct = useQuoteStore((s) => s.prepaymentPct);
  const estimatedMin = useQuoteStore((s) => s.estimatedMin);
  const estimatedMax = useQuoteStore((s) => s.estimatedMax);
  const resetAll = useQuoteStore((s) => s.resetAll);

  const kakaoUrl = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL ?? '#';
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '02-0000-0000';

  const handleRetry = () => {
    gtag.resultRetry();
    resetAll();
    router.push('/quote');
  };

  // 스토어가 비어있는 경우(직접 URL 접근) → '/' 로 리다이렉트
  const isStoreEmpty =
    !selectionPath || (!name.trim() && !phone.trim());

  useEffect(() => {
    if (hydrated && isStoreEmpty) {
      router.replace('/quote');
    }
  }, [hydrated, isStoreEmpty, router]);

  if (!hydrated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-surface-secondary">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isStoreEmpty) {
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
        {/* [budget 경로] */}
        {selectionPath === 'budget' && (
          <div className="px-5 pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#34C7591A] flex items-center justify-center mx-auto mb-4 text-2xl">
              ✅
            </div>
            <h1 className="text-[22px] font-bold text-[#1D1D1F] leading-snug">
              고객님 예산에 맞는 최적의 차량을 찾고 있습니다
            </h1>
            <p className="text-sm text-[#86868B] mt-3">
              전문 상담사가 맞춤 견적을 준비하여 연락드리겠습니다
            </p>
          </div>
        )}

        {/* [car 경로] - 데이터 있을 때 */}
        {selectionPath === 'car' &&
          estimatedMin != null &&
          estimatedMax != null && (
            <>
              <div className="px-5 pt-8 pb-4 text-center">
                <div className="w-16 h-16 rounded-full bg-[#34C7591A] flex items-center justify-center mx-auto mb-4 text-2xl">
                  ✅
                </div>
                <h1 className="text-[22px] font-bold text-[#1D1D1F] leading-snug">
                  견적 요청이 완료되었습니다!
                </h1>
                <p className="text-sm text-[#86868B] mt-3">
                  전문 상담사가 빠르게 연락드리겠습니다
                </p>
              </div>
              <div className="mx-5 mb-4 p-5 rounded-2xl bg-[#007AFF] text-white text-center shadow-[0_6px_18px_rgba(0,122,255,0.22)]">
                <div className="text-[11px] opacity-90">예상 월 납부금</div>
                <div className="text-[30px] font-extrabold mt-2 tracking-tight">
                  월 {formatManwon(estimatedMin)}~{formatManwon(estimatedMax)}만원
                </div>
              </div>
              <div className="mx-5 rounded-2xl bg-white p-5 border border-[#E5E5EA]">
                <div className="text-sm font-bold text-[#1D1D1F] mb-3">
                  선택 내역
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E5EA] last:border-0">
                  <span className="text-[11px] text-[#86868B]">차종</span>
                  <span className="text-[13px] font-semibold text-[#1D1D1F]">
                    {[carBrand, carModel, trim].filter(Boolean).join(' ') || '—'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E5EA] last:border-0">
                  <span className="text-[11px] text-[#86868B]">계약 기간</span>
                  <span className="text-[13px] font-semibold text-[#1D1D1F]">
                    {contractMonths
                      ? PERIOD_LABELS[contractMonths]
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E5EA] last:border-0">
                  <span className="text-[11px] text-[#86868B]">주행거리</span>
                  <span className="text-[13px] font-semibold text-[#1D1D1F]">
                    {annualKm ? MILEAGE_LABELS[annualKm] : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E5EA] last:border-0">
                  <span className="text-[11px] text-[#86868B]">보증금</span>
                  <span className="text-[13px] font-semibold text-[#1D1D1F]">
                    {deposit != null ? DEPOSIT_RATIO_LABELS[deposit] : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[11px] text-[#86868B]">선납금</span>
                  <span className="text-[13px] font-semibold text-[#1D1D1F]">
                    {prepaymentPct != null
                      ? PREPAYMENT_LABELS[prepaymentPct]
                      : '—'}
                  </span>
                </div>
              </div>
            </>
          )}

        {/* [car 경로] - 데이터 없을 때 */}
        {selectionPath === 'car' &&
          (estimatedMin == null || estimatedMax == null) && (
            <>
              <div className="px-5 pt-8 pb-4 text-center">
                <div className="w-16 h-16 rounded-full bg-[#34C7591A] flex items-center justify-center mx-auto mb-4 text-2xl">
                  ✅
                </div>
                <h1 className="text-[22px] font-bold text-[#1D1D1F] leading-snug">
                  견적 요청이 완료되었습니다!
                </h1>
                <p className="text-sm text-[#86868B] mt-3">
                  상담사가 정확한 견적을 안내해 드립니다
                </p>
              </div>
              <div className="mx-5 rounded-2xl bg-white p-5 border border-[#E5E5EA]">
                <div className="text-sm font-bold text-[#1D1D1F] mb-3">
                  선택 내역
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E5EA] last:border-0">
                  <span className="text-[11px] text-[#86868B]">차종</span>
                  <span className="text-[13px] font-semibold text-[#1D1D1F]">
                    {[carBrand, carModel, trim].filter(Boolean).join(' ') || '—'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E5EA] last:border-0">
                  <span className="text-[11px] text-[#86868B]">계약 기간</span>
                  <span className="text-[13px] font-semibold text-[#1D1D1F]">
                    {contractMonths
                      ? PERIOD_LABELS[contractMonths]
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E5EA] last:border-0">
                  <span className="text-[11px] text-[#86868B]">주행거리</span>
                  <span className="text-[13px] font-semibold text-[#1D1D1F]">
                    {annualKm ? MILEAGE_LABELS[annualKm] : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E5EA] last:border-0">
                  <span className="text-[11px] text-[#86868B]">보증금</span>
                  <span className="text-[13px] font-semibold text-[#1D1D1F]">
                    {deposit != null ? DEPOSIT_RATIO_LABELS[deposit] : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[11px] text-[#86868B]">선납금</span>
                  <span className="text-[13px] font-semibold text-[#1D1D1F]">
                    {prepaymentPct != null
                      ? PREPAYMENT_LABELS[prepaymentPct]
                      : '—'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CTA 버튼 (하단 고정) */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-5 py-4 bg-surface-secondary flex flex-col gap-3">
        <div className="bg-white rounded-2xl p-4 border border-[#E5E5EA] shadow-[0_6px_18px_rgba(0,0,0,0.06)] flex flex-col gap-3">
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
            다른 차량도 견적 받아보기
          </Button>
        </div>
      </div>
    </div>
  );
}
