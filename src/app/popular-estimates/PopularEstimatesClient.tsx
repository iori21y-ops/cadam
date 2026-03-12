'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Vehicle } from '@/constants/vehicles';
import { useDragScroll } from '@/hooks/useDragScroll';

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

function formatPrice(won: number): string {
  return `월 ${Math.round(won / 10000)}만원~`;
}

function FilterChips({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect(item)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap transition-all ${
            selected === item
              ? 'bg-accent text-white border-accent'
              : 'bg-white text-gray-600 border-gray-300 hover:border-accent'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function CarImage({ imageKey, model, priority }: { imageKey: string; model: string; priority?: boolean }) {
  const [error, setError] = useState(false);
  return (
    <div className="w-full aspect-[5/3] bg-gray-100 overflow-hidden relative">
      {error ? (
        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
          🚗
        </div>
      ) : (
        <Image
          src={`/cars/${imageKey}.webp`}
          alt={model}
          fill
          sizes="(max-width: 640px) 45vw, 240px"
          priority={priority}
          className="object-contain group-hover:scale-105 transition-transform duration-300"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

export function PopularEstimatesClient({ vehicles }: { vehicles: VehicleWithPrice[] }) {
  const [selectedBrand, setSelectedBrand] = useState('전체');
  const [selectedModel, setSelectedModel] = useState('전체');
  const dragScroll = useDragScroll();

  // 제조사 목록 (차량 순서 유지)
  const brands = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const v of vehicles) {
      if (!seen.has(v.brand)) {
        seen.add(v.brand);
        list.push(v.brand);
      }
    }
    return ['전체', ...list];
  }, [vehicles]);

  // 선택된 제조사의 차종명 목록
  const models = useMemo(() => {
    if (selectedBrand === '전체') return [];
    const names = vehicles
      .filter((v) => v.brand === selectedBrand)
      .map((v) => v.model);
    return ['전체', ...names];
  }, [vehicles, selectedBrand]);

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModel('전체');
  };

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (selectedBrand !== '전체' && v.brand !== selectedBrand) return false;
      if (selectedModel !== '전체' && v.model !== selectedModel) return false;
      return true;
    });
  }, [vehicles, selectedBrand, selectedModel]);

  return (
    <>
      {/* 제조사 필터 */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-400 mb-2">제조사</p>
        <FilterChips items={brands} selected={selectedBrand} onSelect={handleBrandSelect} />
      </div>

      {/* 차종명 필터 (제조사 선택 시 표시) */}
      {selectedBrand !== '전체' && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 mb-2">차종명</p>
          <div
            ref={dragScroll.ref}
            onMouseDown={dragScroll.onMouseDown}
            onMouseLeave={dragScroll.onMouseLeave}
            onMouseUp={dragScroll.onMouseUp}
            onMouseMove={dragScroll.onMouseMove}
            className="overflow-x-auto scrollbar-thin cursor-grab select-none"
          >
            <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
              {models.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedModel(item)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap transition-all ${
                    selectedModel === item
                      ? 'bg-accent text-white border-accent'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-accent'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {selectedBrand === '전체' && <div className="mb-6" />}

      {/* 차종 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((v, i) => (
          <Link
            key={v.id}
            href={`/cars/${v.slug}`}
            className="flex flex-col rounded-xl border-2 border-gray-200 bg-white hover:border-accent hover:shadow-md transition-all overflow-hidden group"
          >
            <CarImage imageKey={v.imageKey} model={v.model} priority={i < 4} />
            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-gray-400">{v.brand}</span>
                <span className="text-[10px] text-gray-400">
                  {CATEGORY_MAP[v.category] ?? v.category}
                </span>
              </div>
              <p className="font-bold text-gray-900 text-sm leading-snug mb-1.5 group-hover:text-accent transition-colors">
                {v.model}
              </p>
              {v.price ? (
                <p className="text-accent font-bold text-base">
                  {formatPrice(v.price.min)}
                </p>
              ) : (
                <p className="text-gray-400 text-sm">견적 문의</p>
              )}
              <p className="text-xs text-accent font-semibold mt-1.5">
                자세히 보기 →
              </p>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-gray-400">
          해당 조건의 차종이 없습니다
        </div>
      )}
    </>
  );
}
