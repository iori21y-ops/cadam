'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import type { Vehicle } from '@/constants/vehicles';

interface CarHeroProps {
  vehicle: Vehicle;
}

export function CarHero({ vehicle }: CarHeroProps) {
  const [imageError, setImageError] = useState(false);
  const [trimOpen, setTrimOpen] = useState(false);
  const [selectedTrim, setSelectedTrim] = useState(vehicle.trims[0] ?? '기본');

  return (
    <section className="bg-white">
      {/* 차량 이미지 영역 */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-[#F8F6F1] to-white">
        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-5xl opacity-20">🚗</span>
            <span className="text-sm text-text-sub">이미지 준비 중</span>
          </div>
        ) : (
          <Image
            src={`/cars/${vehicle.imageKey}.webp`}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            sizes="(max-width:768px) 100vw, 480px"
            className="object-contain p-4"
            priority
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* 모델명 + 배지 */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-text-sub font-medium">{vehicle.brand}</span>
        </div>
        <h1 className="text-[26px] font-extrabold text-text tracking-tight leading-tight">
          {vehicle.model}
        </h1>

        {/* 트림 선택 드롭다운 */}
        {vehicle.trims.length > 0 && (
          <div className="relative mt-3">
            <button
              type="button"
              onClick={() => setTrimOpen(!trimOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border-solid bg-surface-secondary text-sm text-text hover:border-accent transition-colors"
            >
              <span className="truncate">{selectedTrim}</span>
              <ChevronDown
                size={18}
                className={`text-text-sub shrink-0 transition-transform ${trimOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {trimOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-border-solid shadow-lg z-20 max-h-60 overflow-y-auto">
                {vehicle.trims.map((trim) => (
                  <button
                    key={trim}
                    type="button"
                    onClick={() => {
                      setSelectedTrim(trim);
                      setTrimOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      trim === selectedTrim
                        ? 'bg-accent/10 text-accent font-semibold'
                        : 'text-text hover:bg-surface-secondary'
                    }`}
                  >
                    {trim}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 세그먼트 + 연료 태그 */}
        <div className="flex gap-1.5 mt-3">
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary">
            {vehicle.segment}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-600">
            {vehicle.fuel}
          </span>
        </div>
      </div>
    </section>
  );
}
