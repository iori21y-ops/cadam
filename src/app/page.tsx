'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { gtag } from '@/lib/gtag';
import { getVehicleBySlug } from '@/constants/vehicles';

const POPULAR_SLUGS = ['avante', 'tucson', 'k5', 'sportage', 'sorento', 'ioniq5'] as const;

const MAIN_CARDS = [
  {
    id: 'quote',
    href: '/quote',
    emoji: '📋',
    title: '무료 견적 받기',
    description: '차종·예산·기간을 선택하면 맞춤 월 납부금을 바로 확인할 수 있어요.',
    cta: '견적 시작하기',
  },
  {
    id: 'info',
    href: '/info',
    emoji: '📚',
    title: '장기렌터카 정보',
    description: '장기렌트 vs 구매 비교, 세금 처리, 인기 차종 정보를 한눈에.',
    cta: '정보 보기',
  },
  {
    id: 'promotions',
    href: '/promotions',
    emoji: '🎁',
    title: '이달의 프로모션',
    description: '카담에서 진행 중인 특별 혜택과 인기 차종 견적 미리보기.',
    cta: '혜택 확인하기',
  },
];

export default function HomePage() {
  const router = useRouter();

  const handleCardClick = (cardId: string, href: string) => {
    if (cardId === 'quote') gtag.infoCtaClick('main_quote');
    router.push(href);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-5 py-16 min-h-[50vh] bg-gradient-to-br from-primary to-accent text-white text-center">
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
          장기렌터카, 카담에서 가장 쉽게
        </h1>
        <p className="text-base sm:text-lg text-white/90 mb-8">
          현대·기아·제네시스 45종 최저가 견적을 비교해 보세요
        </p>
        <button
          type="button"
          onClick={() => handleCardClick('quote', '/quote')}
          className="px-8 py-3.5 rounded-lg font-bold text-accent bg-white hover:opacity-90 transition-opacity shadow-lg"
        >
          무료 견적 받기
        </button>
      </section>

      {/* 메인 카드 목록 */}
      <section className="px-5 py-12 flex-1">
        <h2 className="text-xl font-bold text-primary mb-6 text-center">
          카담과 함께하기
        </h2>
        <div className="flex flex-col gap-6 max-w-lg mx-auto">
          {MAIN_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(card.id, card.href)}
              className="w-full text-left p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-accent hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl shrink-0">{card.emoji}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-accent transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {card.description}
                  </p>
                  <span className="inline-block mt-3 text-accent font-semibold text-sm">
                    {card.cta} →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 인기 차종 바로가기 */}
      <section className="px-5 py-12 bg-gray-50">
        <h2 className="text-xl font-bold text-primary mb-6 text-center">
          인기 차종
        </h2>
        <div className="flex flex-wrap gap-3 justify-center max-w-lg mx-auto">
          {POPULAR_SLUGS.map((slug) => {
            const vehicle = getVehicleBySlug(slug);
            if (!vehicle) return null;
            return (
              <Link
                key={slug}
                href={`/cars/${slug}`}
                className="px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white font-semibold text-gray-700 hover:border-accent hover:text-accent transition-all"
              >
                {vehicle.model}
              </Link>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
