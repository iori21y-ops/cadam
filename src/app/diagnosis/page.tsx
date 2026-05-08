'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { SelectCard } from '@/components/ui/SelectCard';
import { ConsultationSheet } from '@/components/ui/ConsultationSheet';
import {
  IconDiagnosis, IconCarSedan, IconShield, IconBolt,
  IconTarget, IconDiagnosisChart, IconInstallment, type IconProps,
} from '@/components/icons/RentailorIcons';
import type React from 'react';

const HERO_SERVICE = {
  href: '/diagnosis/compare',
  accent: '#C9A84C',
  Icon: IconInstallment,
  title: '결제방식 비교',
  description: '할부·리스·렌트 3가지 총비용 비교. 엔카 시세·법적 세율 기반으로 계산합니다.',
  badge: 'NEW',
};

const SERVICES = [
  {
    href: '/diagnosis/finance',
    accent: '#C9A84C',
    Icon: IconDiagnosis,
    title: '금융상품 진단',
    description: '나에게 맞는 금융 방식을 1분 만에 진단합니다.',
    color: 'text-finance',
  },
  {
    href: '/diagnosis/vehicle',
    accent: '#5856D6',
    Icon: IconCarSedan,
    title: '차종 추천',
    description: '라이프스타일과 예산에 맞는 차종을 추천합니다.',
    color: 'text-vehicle',
  },
  {
    href: '/diagnosis/report',
    accent: '#007AFF',
    Icon: IconDiagnosisChart,
    title: '감가상각 분석',
    description: '내 차 시세와 전환 최적 시점을 분석합니다.',
    color: 'text-[#007AFF]',
  },
];

const BADGES: { Icon: React.ComponentType<IconProps>; text: string }[] = [
  { Icon: IconShield, text: '개인정보 미수집' },
  { Icon: IconBolt, text: '1분 소요' },
  { Icon: IconTarget, text: 'AI 맞춤 추천' },
];

const ACCENT = '#C9A84C';

export default function DiagnosisPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [clickedHref, setClickedHref] = useState<string | null>(null);
  const clickedRef = useRef<string | null>(null);

  // 클라이언트 마운트 확인 (시트는 마운트 후에만 DOM에 추가 → hydration 불일치 방지)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleCardClick = (href: string) => {
    if (clickedRef.current) return;
    clickedRef.current = href;
    setClickedHref(href);
    router.push(href);
  };

  return (
    <>
      <div className="min-h-screen bg-white pb-24">

        {/* 상단: 진단 현황 + 상담 CTA */}
        <section className="px-5 pt-6 pb-0 max-w-lg mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-surface">
            <span className="text-sm text-text-sub">아직 진단 내역이 없습니다</span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white text-text-sub shadow-sm">
              진단 0건
            </span>
          </div>

          <button
            onClick={() => setIsSheetOpen(true)}
            className="w-full py-3.5 rounded-2xl font-semibold text-[15px] text-white transition-all active:scale-[0.98] shadow-sm"
            style={{ backgroundColor: ACCENT }}
          >
            즉시 상담 신청
          </button>
        </section>

        {/* 서비스 카드 — 1열 세로 나열 */}
        <section className="px-5 mt-5 max-w-lg mx-auto flex flex-col gap-4">

          {/* 결제방식 비교 */}
          {(() => {
            const isActive = clickedHref === HERO_SERVICE.href || pathname?.startsWith(HERO_SERVICE.href);
            const isDimmed = clickedHref !== null && !isActive;
            return (
              <SelectCard
                selected={isActive}
                dimmed={isDimmed}
                disabled={!!clickedHref && !isActive}
                color={ACCENT}
                onClick={() => handleCardClick(HERO_SERVICE.href)}
              >
                <span className="w-14 h-14 flex items-center justify-center rounded-2xl shrink-0 bg-primary/5">
                  <HERO_SERVICE.Icon size={28} className={isActive ? 'text-white' : 'text-finance'} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-[16px] font-semibold transition-colors ${isActive ? 'text-white' : 'text-text'}`}>
                      {HERO_SERVICE.title}
                    </p>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                      style={{ backgroundColor: ACCENT + '20', color: ACCENT }}
                    >
                      {HERO_SERVICE.badge}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed line-clamp-2 transition-colors ${isActive ? 'text-white/70' : 'text-text-sub'}`}>
                    {HERO_SERVICE.description}
                  </p>
                </div>
              </SelectCard>
            );
          })()}

          {/* 나머지 서비스 카드 */}
          {SERVICES.map((service) => {
            const isSel = pathname?.startsWith(service.href);
            const isActive = isSel || clickedHref === service.href;
            const isDimmed = clickedHref !== null && !isActive;
            return (
              <SelectCard
                key={service.href}
                selected={isActive}
                dimmed={isDimmed}
                disabled={!!clickedHref && !isActive}
                color={service.accent}
                onClick={() => handleCardClick(service.href)}
              >
                <span
                  className="w-14 h-14 flex items-center justify-center rounded-2xl shrink-0"
                  style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : service.accent + '12' }}
                >
                  <service.Icon size={28} className={isActive ? 'text-white' : service.color} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[16px] font-semibold mb-0.5 transition-colors ${isActive ? 'text-white' : 'text-text'}`}>
                    {service.title}
                  </p>
                  <p className={`text-sm leading-relaxed line-clamp-2 transition-colors ${isActive ? 'text-white/70' : 'text-text-sub'}`}>
                    {service.description}
                  </p>
                </div>
              </SelectCard>
            );
          })}

        </section>

        {/* 신뢰 배지 */}
        <section className="px-5 mt-8 max-w-lg mx-auto">
          <div className="flex justify-center gap-4 flex-wrap">
            {BADGES.map((badge) => (
              <div key={badge.text} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface shadow-sm">
                <badge.Icon size={15} className="text-primary" />
                <span className="text-[13px] text-text-sub font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {mounted && (
        <ConsultationSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} />
      )}
    </>
  );
}
