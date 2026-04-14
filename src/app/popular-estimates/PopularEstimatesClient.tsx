'use client';

import { memo, useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { Vehicle } from '@/constants/vehicles';
import { CarImageFallback } from '@/components/cars/CarImageFallback';

interface VehicleWithPrice extends Vehicle {
  price: { min: number; max: number } | null;
}

interface SectionDef {
  label: string;
  groups: {
    title: string;
    filter: (v: VehicleWithPrice) => boolean;
  }[];
}

const SECTION_TABS: Record<string, SectionDef> = {
  category: {
    label: '카테고리별',
    groups: [
      { title: '🚗 세단 TOP', filter: (v) => v.category === '세단' },
      { title: '🏔️ SUV TOP', filter: (v) => v.category === 'SUV' },
      { title: '⚡ 전기차 TOP', filter: (v) => v.category === 'EV' },
    ],
  },
  brand: {
    label: '브랜드별',
    groups: [
      { title: '현대', filter: (v) => v.brand === '현대' },
      { title: '기아', filter: (v) => v.brand === '기아' },
      { title: '제네시스', filter: (v) => v.brand === '제네시스' },
      { title: '르노코리아', filter: (v) => v.brand === '르노코리아' },
      { title: 'KGM', filter: (v) => v.brand === 'KGM' },
    ],
  },
  purpose: {
    label: '용도별',
    groups: [
      {
        title: '🧑‍💼 출퇴근 추천',
        filter: (v) =>
          v.category === '세단' && (v.segment.includes('소형') || v.segment.includes('준중형') || v.segment.includes('중형')),
      },
      {
        title: '👨‍👩‍👧‍👦 가족용 추천',
        filter: (v) =>
          v.category === 'SUV' || v.model.includes('카니발') || v.model.includes('팰리세이드'),
      },
      {
        title: '💼 비즈니스 추천',
        filter: (v) =>
          v.brand === '제네시스' || v.model.includes('그랜저') || v.model.includes('K8'),
      },
    ],
  },
};

const TAB_KEYS = Object.keys(SECTION_TABS);
const VISIBLE_COUNT = 3;

function rankStyle(rank: number): { color: string; bg: string } {
  if (rank === 1) return { color: '#FFB800', bg: 'bg-[#FFB800]/10' };
  if (rank === 2) return { color: '#8E8E93', bg: 'bg-[#8E8E93]/10' };
  if (rank === 3) return { color: '#CD7F32', bg: 'bg-[#CD7F32]/10' };
  return { color: '#9CA3AF', bg: '' };
}

function formatPrice(won: number): string {
  return `월 ${Math.round(won / 10000)}만원~`;
}

function VehicleRow({ v, rank }: { v: VehicleWithPrice; rank: number }) {
  const style = rankStyle(rank);

  return (
    <Link
      href={`/cars/${v.slug}`}
      className="flex items-center gap-3 bg-white rounded-2xl border border-border-solid p-3 hover:border-accent hover:shadow-sm transition-all group"
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${style.bg}`}
        style={{ color: style.color }}
      >
        {rank}
      </div>

      <div className="w-20 h-14 relative shrink-0 bg-white rounded-xl overflow-hidden">
        <CarImageFallback
          src={`/cars/${v.imageKey}.webp`}
          alt={v.model}
          sizes="80px"
          className="object-contain p-1"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-text group-hover:text-accent transition-colors truncate">
          {v.model}
        </p>
        <p className="text-[11px] text-text-sub">
          {v.brand} · {v.category}
        </p>
        {v.price ? (
          <p className="text-accent font-bold text-sm mt-0.5">
            {formatPrice(v.price.min)}
          </p>
        ) : (
          <p className="text-text-sub text-xs mt-0.5">견적 문의</p>
        )}
      </div>

      <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="shrink-0">
        <path d="M1 1l5 5-5 5" stroke="#C7C7CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

function SectionGroup({
  title,
  vehicles,
}: {
  title: string;
  vehicles: VehicleWithPrice[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (vehicles.length === 0) return null;

  const hasMore = vehicles.length > VISIBLE_COUNT;
  const displayed = expanded ? vehicles : vehicles.slice(0, VISIBLE_COUNT);
  const hiddenCount = vehicles.length - VISIBLE_COUNT;

  return (
    <div className="mb-8">
      <h2 className="text-base font-bold text-text mb-3">{title}</h2>
      <div className="flex flex-col gap-2">
        {displayed.map((v, i) => (
          <VehicleRow key={v.id} v={v} rank={i + 1} />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-2 py-2.5 flex items-center justify-center gap-1 text-sm font-medium text-text-sub hover:text-accent transition-colors rounded-xl border border-border-solid bg-white"
        >
          {expanded ? '접기' : `${hiddenCount}개 더보기`}
          <ChevronDown
            size={16}
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
}

export const PopularEstimatesClient = memo(function PopularEstimatesClient({
  vehicles,
}: {
  vehicles: VehicleWithPrice[];
}) {
  const [activeTab, setActiveTab] = useState(TAB_KEYS[0]);

  const section = SECTION_TABS[activeTab];

  const groupedData = useMemo(() => {
    return section.groups.map((group) => ({
      title: group.title,
      vehicles: vehicles.filter(group.filter),
    }));
  }, [vehicles, section]);

  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              activeTab === key
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-solid bg-white text-text-sub hover:border-text-sub'
            }`}
          >
            {SECTION_TABS[key].label}
          </button>
        ))}
      </div>

      {groupedData.map((group) => (
        <SectionGroup key={group.title} title={group.title} vehicles={group.vehicles} />
      ))}

      {groupedData.every((g) => g.vehicles.length === 0) && (
        <div className="py-16 text-center text-text-sub">등록된 차량이 없습니다</div>
      )}
    </div>
  );
});
