 'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { SelectCard } from '@/components/ui/SelectCard';
import { Footer } from '@/components/Footer';
import { getVehicleBySlug } from '@/constants/vehicles';
import { usePageTransitionStore } from '@/store/pageTransitionStore';

const POPULAR_SLUGS = ['avante', 'tucson', 'k5', 'sportage', 'sorento', 'ioniq5'] as const;

const MAIN_CARDS = [
  {
    id: 'quote',
    href: '/quote',
    emoji: '📋',
    title: '무료 견적 받기',
    description: '차종·예산·기간을 선택하면 맞춤 월 납부금을 바로 확인할 수 있어요.',
    cta: '견적 시작하기',
    color: 'bg-[#0A84FF1A]',
  },
  {
    id: 'diagnosis',
    href: '/diagnosis',
    emoji: '🎯',
    title: '내게 맞는 상품 진단',
    description: '금융상품·차종·옵션을 1분 진단으로 추천받으세요.',
    cta: '진단 시작하기',
    color: 'bg-vehicle/8',
  },
  {
    id: 'popular',
    href: '/popular-estimates',
    emoji: '🚗',
    title: '인기차종 견적 미리보기',
    description: '아반떼·투싼·K5 등 인기 차종의 월 납부금을 한눈에 비교해 보세요.',
    cta: '견적 미리보기',
    color: 'bg-success/8',
  },
  {
    id: 'info',
    href: '/info',
    emoji: '📚',
    title: '장기렌터카 정보',
    description: '장기렌트 vs 구매 비교, 세금 처리, 인기 차종 정보를 한눈에.',
    cta: '정보 보기',
    color: 'bg-warning/8',
  },
  {
    id: 'promotions',
    href: '/promotions',
    emoji: '🎁',
    title: '이달의 프로모션',
    description: '카담에서 진행 중인 특별 혜택을 확인하세요.',
    cta: '혜택 확인하기',
    color: 'bg-danger/8',
  },
];

export default function HomePage() {
  const pathname = usePathname();
  const router = useRouter();
  const [clickedHref, setClickedHref] = useState<string | null>(null);
  const clickedRef = useRef<string | null>(null);
  const NAV_DELAY_MS = 300;

  const triggerPageTransition = usePageTransitionStore((s) => s.trigger);

  const handleCardClick = (href: string) => {
    // state 반영 전 더블 탭/이벤트 중복을 ref로 선차단
    if (clickedRef.current) return;
    clickedRef.current = href;
    setClickedHref(href);
    window.setTimeout(() => {
      triggerPageTransition();
      router.push(href);
    }, NAV_DELAY_MS);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
      {/* 메인 카드 목록 */}
      <section className="px-5 pt-10 pb-10 flex-1">
        <h2 className="text-xl font-bold text-text mb-6 text-center">
          카담과 함께하기
        </h2>
        <motion.div
          className="flex flex-col gap-4 max-w-lg mx-auto"
          animate={clickedHref ? { opacity: 0, x: -40 } : { opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {MAIN_CARDS.map((card, idx) => {
            const isSel = pathname?.startsWith(card.href);
            const isActive = isSel || clickedHref === card.href;
            const isDimmed = clickedHref !== null && !isActive;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.35, ease: 'easeOut' }}
              >
                <SelectCard
                  selected={isActive}
                  dimmed={isDimmed}
                  disabled={!!clickedHref && !isActive}
                  color="#007AFF"
                  onClick={() => handleCardClick(card.href)}
                >
                  <span className={`text-3xl shrink-0 w-14 h-14 flex items-center justify-center rounded-2xl ${card.color}`}>
                    {card.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`text-[16px] font-medium mb-0.5 ${
                        isActive ? 'text-white' : 'text-[#1D1D1F]'
                      }`}
                    >
                      {card.title}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed ${
                        isActive ? 'text-white/70' : 'text-text-sub'
                      }`}
                    >
                      {card.description}
                    </p>
                  </div>
                </SelectCard>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* 인기 차종 바로가기 */}
      <section className="px-5 py-10">
        <h2 className="text-xl font-bold text-text mb-6 text-center">
          인기 차종
        </h2>
        <div className="flex flex-wrap gap-3 justify-center max-w-lg mx-auto">
          {POPULAR_SLUGS.map((slug) => {
            const vehicle = getVehicleBySlug(slug);
            if (!vehicle) return null;
            const isSel = pathname?.startsWith(`/cars/${slug}`);
            return (
              <Link
                key={slug}
                href={`/cars/${slug}`}
                className={`px-4 py-2.5 rounded-[20px] border-2 shadow-[0_2px_16px_rgba(0,0,0,0.05)] font-semibold transition-all duration-300 focus:outline-none focus-visible:outline-none ${
                  isSel
                    ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-[0_4px_24px_rgba(0,122,255,0.25)] pointer-events-none cursor-default'
                    : 'bg-white border-transparent text-text-sub hover:border-[#007AFF] hover:scale-[1.015]'
                }`}
              >
                {vehicle.model}
              </Link>
            );
          })}
        </div>
      </section>

      <Footer />

      {/* 관리자 버튼 */}
      <div className="flex justify-center py-4 border-t border-border">
        <a
          href="/admin"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-muted hover:text-text-sub transition-colors"
        >
          관리자
        </a>
      </div>
    </div>
  );
}
