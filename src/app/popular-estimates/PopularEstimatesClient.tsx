'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Vehicle } from '@/constants/vehicles';

interface VehicleWithPrice extends Vehicle {
  price: { min: number; max: number } | null;
}

const CATEGORY_MAP = {
  '세단': '세단',
  'SUV': 'SUV',
  'EV': '전기차',
  '다목적': '다목적',
  '트럭': '트럭',
} as const;

const ALL_CATEGORIES = ['전체', '세단', 'SUV', '전기차', '다목적'] as const;

function formatPrice(won: number): string {
  return `월 ${Math.round(won / 10000)}만원~`;
}

export function PopularEstimatesClient({ vehicles }: { vehicles: VehicleWithPrice[] }) {
  const [selected, setSelected] = useState<string>('전체');

  const filtered = selected === '전체'
    ? vehicles
    : vehicles.filter((v) => CATEGORY_MAP[v.category] === selected);

  return (
    <>
      {/* 카테고리 필터 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelected(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap transition-all ${
              selected === cat
                ? 'bg-accent text-white border-accent'
                : 'bg-white text-gray-600 border-gray-300 hover:border-accent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 차종 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((v) => (
          <Link
            key={v.id}
            href={`/cars/${v.slug}`}
            className="flex flex-col p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-accent hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {v.brand}
              </span>
              <span className="text-[11px] text-gray-400">
                {CATEGORY_MAP[v.category] ?? v.category}
              </span>
            </div>
            <span className="font-bold text-gray-900 text-sm leading-snug mb-2 group-hover:text-accent transition-colors">
              {v.model}
            </span>
            {v.price ? (
              <span className="text-accent font-bold text-base">
                {formatPrice(v.price.min)}
              </span>
            ) : (
              <span className="text-gray-400 text-sm">견적 문의</span>
            )}
            <span className="text-xs text-accent font-semibold mt-2">
              자세히 보기 →
            </span>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-gray-400">
          해당 카테고리 차종이 없습니다
        </div>
      )}
    </>
  );
}
