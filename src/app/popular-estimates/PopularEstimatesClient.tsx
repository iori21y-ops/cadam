'use client';
import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Vehicle } from '@/constants/vehicles';
interface VehicleWithPrice extends Vehicle {
  price: { min: number; max: number } | null;
}
const CATEGORY_MAP: Record<string, string> = {
  '세단': '세단',
  'SUV': 'SUV',
  'EV': '전기차',
  '기타차량': '기타차량',
  '트럭': '트럭',
};
function formatPrice(won: number): string {
  return `${Math.round(won / 10000)}만원~`;
}
function rankColor(rank: number): string {
  if (rank === 1) return '#FFB800';
  if (rank === 2) return '#8E8E93';
  if (rank === 3) return '#CD7F32';
  return '#AEAEB2';
}
export const PopularEstimatesClient = memo(function PopularEstimatesClient({
  vehicles,
}: {
  vehicles: VehicleWithPrice[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {vehicles.map((v, i) => {
        const rank = i + 1;
        const color = rankColor(rank);
        return (
          <Link
            key={v.id}
            href={`/cars/${v.slug}`}
            className="flex items-center gap-3 bg-white rounded-2xl border border-border-solid p-3 hover:border-primary hover:shadow-sm transition-all group"
          >
            <div
              className="w-8 text-center font-bold text-base shrink-0"
              style={{ color }}
            >
              {rank}
            </div>
            <div className="w-20 h-12 relative shrink-0 bg-surface-secondary rounded-xl overflow-hidden">
              <Image
                src={`/cars/${v.imageKey}.webp`}
                alt={v.model}
                fill
                sizes="80px"
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-text group-hover:text-primary transition-colors truncate">
                {v.model}
              </p>
              <p className="text-[11px] text-text-muted">
                {v.brand} {'\u00B7'} {CATEGORY_MAP[v.category] ?? v.category}
              </p>
              {v.price ? (
                <p className="text-primary font-semibold text-sm mt-0.5">
                  월 {formatPrice(v.price.min)}
                </p>
              ) : (
                <p className="text-text-sub text-xs mt-0.5">가격 준비중</p>
              )}
            </div>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="shrink-0">
              <path
                d="M1 1l5 5-5 5"
                stroke="#C7C7CC"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        );
      })}
      {vehicles.length === 0 && (
        <div className="py-16 text-center text-text-sub">등록된 차량이 없습니다</div>
      )}
    </div>
  );
});