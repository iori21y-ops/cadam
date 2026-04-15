'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Vehicle } from '@/constants/vehicles';

interface CarHeroProps {
  vehicle: Vehicle;
}

export function CarHero({ vehicle }: CarHeroProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <section>
      {/* 차량 이미지 영역 */}
      <div className="mx-4 mt-4 relative aspect-[4/3] bg-white rounded-2xl overflow-hidden shadow-sm">
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
      <div className="px-5 pt-4 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-text-sub font-medium">{vehicle.brand}</span>
        </div>
        <h1 className="text-[26px] font-extrabold text-text tracking-tight leading-tight">
          {vehicle.model}
        </h1>

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
