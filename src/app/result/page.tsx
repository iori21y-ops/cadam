'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useHydrated } from '@/hooks/useHydrated';
import { useQuoteStore } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SimulationCalculator } from '@/components/diagnosis/SimulationCalculator';
import { loadProgress } from '@/lib/mission-progress';
import type { MissionProgress } from '@/lib/mission-progress';
import { VEHICLES, TRIMS } from '@/data/diagnosis-vehicles';
import { DEFAULT_PRODUCTS, PRODUCT_KEYS } from '@/data/diagnosis-products';
import { BRAND } from '@/constants/brand';
import type { ProductKey } from '@/types/diagnosis';
import { Footer } from '@/components/Footer';

const PERIOD_LABELS: Record<number, string> = { 36: '36개월', 48: '48개월', 60: '60개월' };
const MILEAGE_LABELS: Record<number, string> = { 10000: '연 1만km', 20000: '연 2만km', 30000: '연 3만km', 40000: '연 4만km+' };

function formatManwon(value: number): string {
  return `${(value / 10000).toLocaleString()}만`;
}

// 차종 진단 결과에서 차량/트림 정보 추출
function extractVehicleInfo(progress: MissionProgress) {
  if (!progress.vehicle.done || !progress.vehicle.summary) return null;
  const parts = progress.vehicle.summary.split(' ');
  const carName = parts[parts.length - 1];
  const vehicle = VEHICLES.find((v) => v.name === carName);
  if (!vehicle) return { name: progress.vehicle.summary, brand: '', price: 3500, trim: null, trimPrice: null };

  const trims = TRIMS[carName];
  const bestTrim = trims?.[Math.floor(trims.length / 2)] ?? null;

  return {
    name: `${vehicle.brand} ${vehicle.name}`,
    brand: vehicle.brand,
    price: vehicle.price,
    class: vehicle.class,
    monthly: vehicle.monthly,
    trim: bestTrim,
    trimPrice: bestTrim?.price ?? vehicle.price,
  };
}

// 이용방법 진단 결과에서 금융상품 정보 추출
function extractFinanceInfo(progress: MissionProgress) {
  if (!progress.finance.done || !progress.finance.summary) return null;
  const summary = progress.finance.summary;
  const productName = summary.split(' ')[0];
  const pctMatch = summary.match(/(\d+)%/);
  const pct = pctMatch ? parseInt(pctMatch[1]) : 0;

  const found = (Object.entries(DEFAULT_PRODUCTS) as [ProductKey, { name: string }][])
    .find(([, p]) => p.name === productName);

  return found ? { key: found[0], product: DEFAULT_PRODUCTS[found[0]], pct } : null;
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

  const [vehicleInfo, setVehicleInfo] = useState<ReturnType<typeof extractVehicleInfo>>(null);
  const [financeInfo, setFinanceInfo] = useState<ReturnType<typeof extractFinanceInfo>>(null);

  useEffect(() => {
    const progress = loadProgress();
    setVehicleInfo(extractVehicleInfo(progress));
    setFinanceInfo(extractFinanceInfo(progress));
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

  const DEPOSIT_LABELS: Record<number, string> = { 0: '0%', 1000000: '10%', 2000000: '20%', 3000000: '30%' };
  const PREPAY_LABELS: Record<number, string> = { 0: '0%', 10: '10%', 20: '20%', 30: '30%' };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface-secondary">
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-lg mx-auto">

          {/* ━━━ 헤더 ━━━ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="px-5 pt-8 pb-6 text-center"
          >
            <span className="text-4xl block mb-3">🏆</span>
            <h1 className="text-[22px] font-bold text-text leading-snug mb-2">
              맞춤 상담 신청 완료!
            </h1>
            <p className="text-sm text-text-sub">
              AI 진단 결과를 바탕으로 전문 상담사가 연락드리겠습니다
            </p>
          </motion.div>

          {/* ━━━ 예상 월 납부금 (API 응답) ━━━ */}
          {estimatedMin != null && estimatedMax != null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4, ease: 'easeOut' }}
              className="mx-5 mb-4 p-5 rounded-2xl bg-primary text-white text-center shadow-lg shadow-primary/20"
            >
              <div className="text-[11px] opacity-90">예상 월 납부금</div>
              <div className="text-[30px] font-extrabold mt-2 tracking-tight">
                월 {formatManwon(estimatedMin)}~{formatManwon(estimatedMax)}만원
              </div>
            </motion.div>
          )}

          {/* ━━━ 종합 진단 결과 ━━━ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
            className="mx-5 mb-4 rounded-2xl bg-white border border-border-solid overflow-hidden"
          >
            <div className="px-5 pt-5 pb-3">
              <p className="text-sm font-bold text-text">AI 종합 진단 결과</p>
              <p className="text-[11px] text-text-muted mt-0.5">차종 진단 + 이용방법 진단 결과를 종합했습니다</p>
            </div>

            {/* 추천 차종 */}
            {vehicleInfo && (
              <div className="px-5 py-4 border-t border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}>
                    <span className="text-white text-sm">🚗</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-text-muted">추천 차종</p>
                    <p className="text-[15px] font-bold text-text">{vehicleInfo.name}</p>
                  </div>
                  <button
                    onClick={() => router.push('/diagnosis/vehicle?restore=1')}
                    className="text-[11px] text-primary font-semibold"
                  >
                    상세 →
                  </button>
                </div>
                {vehicleInfo.trim && (
                  <div className="p-3 rounded-xl bg-surface-secondary">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-text">추천 트림: {vehicleInfo.trim.name}</p>
                      <p className="text-xs font-bold text-text">{vehicleInfo.trim.price.toLocaleString()}만원</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {vehicleInfo.trim.feats.map((f) => (
                        <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white text-text-sub">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* 상품별 월 비용 */}
                {vehicleInfo.monthly && (
                  <div className="grid grid-cols-4 gap-1.5 mt-3">
                    {PRODUCT_KEYS.map((key) => {
                      const isRecommended = key === financeInfo?.key;
                      return (
                        <div key={key} className={`text-center py-2 rounded-xl ${isRecommended ? 'ring-2 ring-primary' : ''}`}
                          style={{ backgroundColor: DEFAULT_PRODUCTS[key].lightBg }}>
                          <p className="text-[9px] text-text-muted">{DEFAULT_PRODUCTS[key].name}</p>
                          <p className="text-xs font-bold" style={{ color: DEFAULT_PRODUCTS[key].color }}>
                            {key === 'cash' ? '일시불' : `${vehicleInfo.monthly![key]}만`}
                          </p>
                          {isRecommended && <p className="text-[8px] text-primary font-bold">추천</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 추천 이용방법 */}
            {financeInfo && (
              <div className="px-5 py-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #60A5FA)' }}>
                    <span className="text-white text-sm">🎯</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-text-muted">추천 이용방법</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{financeInfo.product.emoji}</span>
                      <p className="text-[15px] font-bold" style={{ color: financeInfo.product.color }}>
                        {financeInfo.product.name}
                      </p>
                      <span className="text-xs text-text-muted">적합도 {financeInfo.pct}%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/diagnosis/finance?restore=1')}
                    className="text-[11px] text-primary font-semibold"
                  >
                    상세 →
                  </button>
                </div>
                <p className="text-xs text-text-sub mt-2 ml-[52px]">{financeInfo.product.tagline}</p>
              </div>
            )}
          </motion.div>

          {/* ━━━ 상담 조건 ━━━ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: 'easeOut' }}
            className="mx-5 mb-4 rounded-2xl bg-white p-5 border border-border-solid"
          >
            <p className="text-sm font-bold text-text mb-3">상담 조건</p>
            {[
              { label: '계약 기간', value: contractMonths ? PERIOD_LABELS[contractMonths] : '—' },
              { label: '연간 주행거리', value: annualKm ? MILEAGE_LABELS[annualKm] : '—' },
              ...(deposit != null ? [{ label: '보증금', value: DEPOSIT_LABELS[deposit] ?? '—' }] : []),
              ...(prepaymentPct != null ? [{ label: '선납금', value: PREPAY_LABELS[prepaymentPct] ?? '—' }] : []),
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex justify-between py-2 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}>
                <span className="text-[11px] text-text-sub">{row.label}</span>
                <span className="text-[13px] font-semibold text-text">{row.value}</span>
              </div>
            ))}
          </motion.div>

          {/* ━━━ 월 납입금 시뮬레이션 ━━━ */}
          {vehicleInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4, ease: 'easeOut' }}
              className="mx-5 mb-4"
            >
              <SimulationCalculator
                carPrice={vehicleInfo.trimPrice ?? vehicleInfo.price}
                carName={vehicleInfo.name + (vehicleInfo.trim ? ` ${vehicleInfo.trim.name}` : '')}
                recommendedProduct={financeInfo?.key}
                initialPeriod={contractMonths ?? undefined}
                initialMileage={annualKm ?? undefined}
                initialDownRate={
                  deposit != null
                    ? ({ 0: 0, 1000000: 10, 2000000: 20, 3000000: 30 } as Record<number, number>)[deposit] ?? 10
                    : prepaymentPct ?? undefined
                }
              />
            </motion.div>
          )}

          {/* ━━━ 다시 진단 ━━━ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="mx-5 mb-4 flex gap-2"
          >
            <Button variant="surface" className="flex-1 text-xs" onClick={() => router.push('/diagnosis/vehicle')}>
              차종 다시 진단
            </Button>
            <Button variant="surface" className="flex-1 text-xs" onClick={() => router.push('/diagnosis/finance')}>
              이용방법 다시 진단
            </Button>
          </motion.div>

        </div>
      </div>

      {/* ━━━ CTA 하단 고정 ━━━ */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-5 py-4 bg-surface-secondary">
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
          <Button type="button" variant="ghost" onClick={handleRetry} className="mt-1">
            다른 조건으로 다시 상담하기
          </Button>
        </div>
      </div>
    </div>
  );
}
