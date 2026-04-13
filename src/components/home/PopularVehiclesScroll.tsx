'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useDragScroll } from '@/hooks/useDragScroll';

interface VehicleCard {
  slug: string;
  model: string;
  imageKey: string;
  price: { min: number; max: number } | null;
}

function formatPrice(n: number) {
  return Math.round(n / 10000).toLocaleString();
}

export function PopularVehiclesScroll({ vehicles }: { vehicles: VehicleCard[] }) {
  const { ref, onMouseDown, onMouseLeave, onMouseUp, onMouseMove } = useDragScroll();

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory cursor-grab px-5 -mx-5"
    >
      {vehicles.map((v) => (
        <Link
          key={v.slug}
          href={`/cars/${v.slug}`}
          className="min-w-[200px] md:min-w-[240px] bg-surface rounded-2xl shadow-sm overflow-hidden snap-start shrink-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          draggable={false}
        >
          <div className="aspect-[4/3] bg-background relative">
            <Image
              src={`/cars/${v.imageKey}.webp`}
              alt={v.model}
              fill
              className="object-contain p-2"
              sizes="240px"
              draggable={false}
            />
          </div>
          <div className="p-4">
            <p className="text-primary font-bold text-sm">{v.model}</p>
            {v.price ? (
              <p className="mt-1">
                <span className="text-accent font-bold text-lg">
                  {formatPrice(v.price.min)}
                </span>
                <span className="text-text-muted text-xs ml-1">만원/월~</span>
              </p>
            ) : (
              <p className="text-text-muted text-sm mt-1">견적 문의</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
