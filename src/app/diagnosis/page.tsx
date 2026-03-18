'use client';

import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { SelectCard } from '@/components/ui/SelectCard';
import { usePageTransitionStore } from '@/store/pageTransitionStore';

const SERVICES = [
  {
    href: '/diagnosis/finance',
    accent: '#007AFF',
    emoji: '📊',
    title: '금융상품 진단',
    description: '할부·리스·렌트·현금 중 나에게 맞는 금융 방식을 1분 만에 알아보세요.',
    color: 'text-finance',
    bg: 'bg-finance/8',
  },
  {
    href: '/diagnosis/vehicle',
    accent: '#5856D6',
    emoji: '🚗',
    title: '차종 추천',
    description: '라이프스타일과 예산에 딱 맞는 차종을 추천받으세요.',
    color: 'text-vehicle',
    bg: 'bg-vehicle/8',
  },
  {
    href: '/diagnosis/calculator',
    accent: '#0A84FF',
    emoji: '🧮',
    title: '월 비용 계산기',
    description: '차종·기간·선수금 조건에 따른 월 납입금을 바로 계산해 보세요.',
    color: 'text-calculator',
    bg: 'bg-calculator/8',
  },
  {
    href: '/consult',
    accent: '#34C759',
    emoji: '💬',
    title: '무료 상담',
    description: '전문 상담사가 직접 맞춤 조건을 안내해 드립니다.',
    color: 'text-success',
    bg: 'bg-success/8',
  },
];

const BADGES = [
  { icon: '🔒', text: '개인정보 미수집' },
  { icon: '⚡', text: '1분 소요' },
  { icon: '🎯', text: 'AI 맞춤 추천' },
];

export default function DiagnosisPage() {
  const pathname = usePathname();
  const ACCENT = '#007AFF';
  const router = useRouter();
  const [clickedHref, setClickedHref] = useState<string | null>(null);
  const NAV_DELAY_MS = 300;

  const triggerPageTransition = usePageTransitionStore((s) => s.trigger);

  const handleCardClick = (href: string) => {
    if (clickedHref) return;
    triggerPageTransition();
    setClickedHref(href);
    window.setTimeout(() => {
      router.push(href);
    }, NAV_DELAY_MS);
  };

  return (
    <div className="min-h-screen bg-surface-secondary pb-10">
      {/* 히어로 */}
      <section className="px-5 pt-12 pb-8 text-center">
        <span className="text-5xl mb-4 block">🚘</span>
        <h1 className="text-2xl font-bold text-text tracking-tight mb-2">
          자동차, 뭘 어떻게 이용해야 할까?
        </h1>
        <p className="text-sm text-text-sub">
          진단 서비스로 나에게 맞는 방법을 찾아보세요
        </p>
      </section>

      {/* 서비스 카드 */}
      <section className="px-5 max-w-lg mx-auto flex flex-col gap-4">
        {SERVICES.map((service, i) => (
          <motion.div
            key={service.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
              {(() => {
                const isSel = pathname?.startsWith(service.href);
                const isActive = isSel || clickedHref === service.href;
                const isDimmed = clickedHref !== null && !isActive;

                return (
                  <SelectCard
                    selected={isActive}
                    dimmed={isDimmed}
                    disabled={!!clickedHref && !isActive}
                    color={ACCENT}
                    onClick={() => handleCardClick(service.href)}
                  >
                    <span className="text-3xl w-14 h-14 flex items-center justify-center rounded-2xl shrink-0 bg-[#007AFF0D]">
                      {service.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[16px] font-medium mb-0.5 transition-colors ${
                          isActive ? 'text-white' : 'text-text'
                        }`}
                      >
                        {service.title}
                      </p>
                      <p
                        className={`text-sm leading-relaxed transition-colors ${
                          isActive ? 'text-white/70' : 'text-text-sub'
                        }`}
                      >
                        {service.description}
                      </p>
                    </div>
                  </SelectCard>
                );
              })()}
          </motion.div>
        ))}
      </section>

      {/* 신뢰 배지 */}
      <section className="px-5 mt-8 max-w-lg mx-auto">
        <div className="flex justify-center gap-4 flex-wrap">
          {BADGES.map((badge) => (
            <div key={badge.text} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface shadow-sm">
              <span className="text-sm">{badge.icon}</span>
              <span className="text-[13px] text-text-sub font-medium">{badge.text}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
