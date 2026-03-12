'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Vehicle } from '@/constants/vehicles';

interface CarHeroProps {
  vehicle: Vehicle;
  minPrice: number | null;
}

function formatPrice(manwon: number): string {
  return `${(manwon / 10000).toLocaleString()}만`;
}

export function CarHero({ vehicle, minPrice }: CarHeroProps) {
  const [imageError, setImageError] = useState(false);
  const priceText = minPrice != null
    ? `월 ${formatPrice(minPrice)}원부터~`
    : '상담 문의';

  return (
    <section className="bg-gray-100 py-6 px-5 text-center">
      <div className="relative w-full max-w-[280px] aspect-[5/3] mx-auto mb-4 rounded-xl overflow-hidden bg-gray-200">
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
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
      <h1 className="text-2xl font-extrabold text-gray-900">{vehicle.model}</h1>
      <div className="flex gap-1.5 justify-center mt-2">
        <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[#EBF5FB] text-accent">
          {vehicle.segment}
        </span>
        <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[#E8F8F0] text-success">
          {vehicle.fuel}
        </span>
      </div>
      <p className="text-[22px] font-extrabold text-accent mt-3">{priceText}</p>
    </section>
  );
}
