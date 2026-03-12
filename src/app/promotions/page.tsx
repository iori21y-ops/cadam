'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getVehicleBySlug, type Vehicle } from '@/constants/vehicles';
import { Footer } from '@/components/Footer';

const POPULAR_SLUGS = [
  'avante',
  'tucson',
  'k5',
  'sportage',
  'sorento',
  'ioniq5',
] as const;

const POPULAR_PRICE_PLACEHOLDER: Record<string, string> = {
  avante: '월 28만원~',
  tucson: '월 35만원~',
  k5: '월 30만원~',
  sportage: '월 34만원~',
  sorento: '월 40만원~',
  ioniq5: '월 45만원~',
};

function getPopularVehicles(): (Vehicle & { priceLabel: string })[] {
  return POPULAR_SLUGS.map((slug) => {
    const v = getVehicleBySlug(slug);
    if (!v) return null;
    return {
      ...v,
      priceLabel: POPULAR_PRICE_PLACEHOLDER[slug] ?? '월 XX만원~',
    };
  }).filter((v): v is Vehicle & { priceLabel: string } => v !== null);
}

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
}

export default function PromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const popularVehicles = getPopularVehicles();

  useEffect(() => {
    document.cookie = 'inflow_page=/promotions; path=/; max-age=86400';
  }, []);

  useEffect(() => {
    fetch('/api/promotions')
      .then((res) => res.json())
      .then((data: { promotions?: Promotion[]; error?: string }) => {
        if (data.promotions) setPromotions(data.promotions);
      })
      .catch(() => setPromotions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center px-5 py-16 min-h-[40vh] bg-gradient-to-br from-primary to-accent text-white text-center"
      >
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
          이달의 프로모션
        </h1>
        <p className="text-base sm:text-lg text-white/90 mb-6">
          카담에서 진행 중인 특별 혜택을 확인하세요
        </p>
        <button
          type="button"
          onClick={() => router.push('/quote')}
          className="px-8 py-3.5 rounded-lg font-bold text-accent bg-white hover:opacity-90 transition-opacity"
        >
          무료 견적 받기
        </button>
      </section>

      {/* 프로모션 목록 */}
      <section className="px-5 py-12 flex-1">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : promotions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-lg mb-2">
              현재 진행 중인 프로모션이 없습니다
            </p>
            <p className="text-gray-400 text-sm">
              새로운 혜택을 준비 중입니다. 곧 만나보세요!
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-6 justify-center">
            {promotions.map((p) => {
              const cardContent = (
                <>
                  <div className="aspect-[16/10] bg-gray-200 flex items-center justify-center">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">배너 이미지</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                      {p.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {p.description ?? '-'}
                    </p>
                  </div>
                </>
              );
              const className =
                'flex flex-col flex-shrink-0 w-full sm:w-[280px] rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow';
              return p.linkUrl ? (
                <a key={p.id} href={p.linkUrl} className={className}>
                  {cardContent}
                </a>
              ) : (
                <div key={p.id} className={className}>
                  {cardContent}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 인기 차종 견적 미리보기 */}
      <section className="px-5 py-12 bg-gray-50">
        <h2 className="text-xl font-bold text-primary mb-6 text-center">
          인기 차종 견적 미리보기
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {popularVehicles.map((v) => (
            <Link
              key={v.id}
              href={`/cars/${v.slug}`}
              className="flex flex-col p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-accent hover:bg-[#EBF5FB] transition-all"
            >
              <span className="font-semibold text-gray-900">{v.model}</span>
              <span className="text-accent font-bold text-lg mt-1">
                {v.priceLabel}
              </span>
              <span className="text-accent text-sm font-semibold mt-2 hover:underline">
                견적 보기 →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
