'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/constants/vehicles';

interface VehicleCard {
  slug: string;
  brand: string;
  model: string;
  category: Category;
  imageKey: string;
  price: { min: number; max: number } | null;
}

const FILTERS: { label: string; value: Category | '전체' }[] = [
  { label: '전체', value: '전체' },
  { label: 'SUV', value: 'SUV' },
  { label: '세단', value: '세단' },
  { label: 'EV', value: 'EV' },
  { label: '다목적', value: '다목적' },
];

function formatPrice(n: number) {
  return Math.round(n / 10000).toLocaleString();
}

export function PopularVehiclesScroll({ vehicles }: { vehicles: VehicleCard[] }) {
  const [activeFilter, setActiveFilter] = useState<Category | '전체'>('전체');
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const filtered = activeFilter === '전체'
    ? vehicles
    : vehicles.filter((v) => v.category === activeFilter);

  // 필터 변경 시 스크롤 초기화
  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [activeFilter]);

  // IntersectionObserver로 활성 도트 추적
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target as HTMLAnchorElement);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { root: container, threshold: 0.6 }
    );

    for (const card of cardRefs.current) {
      if (card) observer.observe(card);
    }

    return () => observer.disconnect();
  }, [filtered]);

  const setCardRef = useCallback((el: HTMLAnchorElement | null, i: number) => {
    cardRefs.current[i] = el;
  }, []);

  return (
    <div>
      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-5 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === f.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 카드 스크롤 */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-5"
      >
        {filtered.map((v, i) => (
          <Link
            key={v.slug}
            ref={(el) => setCardRef(el, i)}
            href={`/cars/${v.slug}`}
            className="w-[80vw] max-w-[320px] shrink-0 snap-center bg-white rounded-2xl shadow-sm overflow-hidden transition-transform active:scale-[0.98]"
            draggable={false}
          >
            <div className="aspect-[16/10] bg-gradient-to-b from-gray-50 to-white relative">
              <Image
                src={`/cars/${v.imageKey}.webp`}
                alt={v.model}
                fill
                className="object-contain p-6"
                sizes="(max-width: 768px) 80vw, 320px"
                draggable={false}
              />
            </div>
            <div className="p-5">
              <p className="text-text-sub text-xs">{v.brand}</p>
              <p className="text-primary font-bold text-lg">{v.model}</p>
              <div className="border-t border-gray-100 my-3" />
              {v.price ? (
                <p>
                  <span className="text-text-sub text-xs mr-1">월</span>
                  <span className="text-accent font-bold text-xl">
                    {formatPrice(v.price.min)}
                  </span>
                  <span className="text-text-sub text-xs">만원~</span>
                </p>
              ) : (
                <p className="text-accent font-bold">견적 문의</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* 도트 인디케이터 */}
      {filtered.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {filtered.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === activeIndex ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
