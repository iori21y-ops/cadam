'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/Footer';

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

      <Footer />
    </div>
  );
}
