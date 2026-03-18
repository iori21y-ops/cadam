'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Vehicle } from '@/constants/vehicles';

interface CarHeroProps {
  vehicle: Vehicle;
  minPrice: number | null;
  minCarPrice?: number | null;
  maxCarPrice?: number | null;
}

function formatPrice(manwon: number): string {
  return `${(manwon / 10000).toLocaleString()}만`;
}

export function CarHero({ vehicle, minPrice, minCarPrice, maxCarPrice }: CarHeroProps) {
  const [imageError, setImageError] = useState(false);
  const priceText = minPrice != null
    ? `월 ${formatPrice(minPrice)}원부터~`
    : '상담 문의';

  return (
    <section className="py-8 px-5 text-center bg-surface-secondary">
      <div className="relative w-full max-w-[280px] aspect-[5/3] mx-auto mb-4 rounded-2xl overflow-hidden bg-white border border-[#E5E5EA]">
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center text-[#86868B] text-sm">
            차량 이미지
          </div>
        ) : (
          <Image
            src={`/cars/${vehicle.imageKey}.webp`}
            alt={vehicle.model}
            fill
            sizes="(max-width: 768px) 280px, 320px"
            className="object-contain"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <h1 className="text-2xl font-extrabold text-[#1D1D1F] tracking-tight">{vehicle.model}</h1>
      <div className="flex gap-1.5 justify-center mt-2">
        <span className="px-2.5 py-1 rounded-[10px] text-[11px] font-semibold bg-[#007AFF1A] text-[#007AFF]">
          {vehicle.segment}
        </span>
        <span className="px-2.5 py-1 rounded-[10px] text-[11px] font-semibold bg-[#34C7591A] text-[#34C759]">
          {vehicle.fuel}
        </span>
      </div>
      {minCarPrice != null && (
        <p className="text-sm text-[#86868B] mt-2">
          차량가격 {Math.round(minCarPrice / 10000).toLocaleString()}만
          {maxCarPrice != null && maxCarPrice !== minCarPrice
            ? ` ~ ${Math.round(maxCarPrice / 10000).toLocaleString()}만원`
            : '원'}
        </p>
      )}
      <p className="text-[22px] font-extrabold text-[#007AFF] mt-3">{priceText}</p>
    </section>
  );
}
