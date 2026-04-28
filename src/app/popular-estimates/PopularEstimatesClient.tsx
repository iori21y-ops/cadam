'use client';

import { memo, useState, useMemo } from 'react';
import Link from 'next/link';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { CarImageFallback } from '@/components/cars/CarImageFallback';
import { FilterModal } from './FilterModal';
import type { VehicleCard, SortKey, TabKey, FilterState } from './types';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'best', label: 'BEST' },
  { key: 'domestic', label: '국산차' },
  { key: 'import', label: '수입차' },
  { key: 'ev', label: '전기차' },
  { key: 'hybrid', label: 'HYBRID' },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'price_asc', label: '월 이용료 낮은순' },
  { key: 'price_desc', label: '월 이용료 높은순' },
  { key: 'base_asc', label: '출고가 낮은순' },
  { key: 'base_desc', label: '출고가 높은순' },
  { key: 'name_asc', label: '가나다순' },
];

const DEFAULT_FILTERS: FilterState = {
  productTypes: [],
  depositZero: null,
  contractMonths: [],
};

function formatPrice(won: number): string {
  return `월 ${Math.round(won / 10000).toLocaleString()}만원~`;
}

function filterByTab(vehicles: VehicleCard[], tab: TabKey): VehicleCard[] {
  switch (tab) {
    case 'best':
      return [...vehicles]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .slice(0, 30);
    case 'domestic':
      return vehicles.filter(v => v.isDomestic);
    case 'import':
      return vehicles.filter(v => !v.isDomestic);
    case 'ev':
      return vehicles.filter(v => v.fuelType === '전기');
    case 'hybrid':
      return vehicles.filter(
        v => v.fuelType === '하이브리드' || v.fuelType === '플러그인 하이브리드'
      );
    default:
      return vehicles;
  }
}

function applyFilters(vehicles: VehicleCard[], filters: FilterState): VehicleCard[] {
  const noFilter =
    filters.productTypes.length === 0 &&
    filters.depositZero === null &&
    filters.contractMonths.length === 0;

  if (noFilter) return vehicles;

  return vehicles.filter(v => {
    const opts = v.pricingOptions;
    if (opts.length === 0) return false;

    if (filters.productTypes.length > 0) {
      const ok = opts.some(o =>
        (filters.productTypes as string[]).includes(o.productType)
      );
      if (!ok) return false;
    }

    if (filters.depositZero !== null) {
      const ok = opts.some(o => o.depositZero === filters.depositZero);
      if (!ok) return false;
    }

    if (filters.contractMonths.length > 0) {
      const ok = opts.some(o => filters.contractMonths.includes(o.contractMonths));
      if (!ok) return false;
    }

    return true;
  });
}

function sortVehicles(vehicles: VehicleCard[], sort: SortKey): VehicleCard[] {
  return [...vehicles].sort((a, b) => {
    switch (sort) {
      case 'price_asc': {
        if (!a.price && !b.price) return 0;
        if (!a.price) return 1;
        if (!b.price) return -1;
        return a.price.min - b.price.min;
      }
      case 'price_desc': {
        if (!a.price && !b.price) return 0;
        if (!a.price) return 1;
        if (!b.price) return -1;
        return b.price.min - a.price.min;
      }
      case 'base_asc': {
        if (!a.basePrice && !b.basePrice) return 0;
        if (!a.basePrice) return 1;
        if (!b.basePrice) return -1;
        return a.basePrice - b.basePrice;
      }
      case 'base_desc': {
        if (!a.basePrice && !b.basePrice) return 0;
        if (!a.basePrice) return 1;
        if (!b.basePrice) return -1;
        return b.basePrice - a.basePrice;
      }
      case 'name_asc':
        return a.name.localeCompare(b.name, 'ko');
    }
  });
}

const SPIN_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-360`;

function getCardImageSrc(v: VehicleCard): string | null {
  if (v.has360Spin) {
    const frame = String(v.spinStartFrame + 1).padStart(3, '0');
    return `${SPIN_BASE}/${v.slug}/${frame}.webp`;
  }
  return v.imageKey ? `/cars/${v.imageKey}.webp` : null;
}

function VehicleCardItem({ v }: { v: VehicleCard }) {
  const imgSrc = getCardImageSrc(v);

  return (
    <Link
      href={`/cars/${v.slug}`}
      className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-border-solid p-5 hover:border-accent hover:shadow-md transition-all group"
    >
      {/* 좌측 텍스트 */}
      <div className="flex-1 min-w-0">
        <span className="inline-block text-[11px] font-bold tracking-wide text-white bg-success rounded-md px-2 py-0.5 mb-2.5">
          장기렌트
        </span>
        <p className="font-bold text-lg text-text leading-snug truncate group-hover:text-accent transition-colors">
          {v.name}
        </p>
        <p className="text-sm text-text-sub mt-1">
          {v.brand}
          {v.category ? ` · ${v.category}` : ''}
        </p>
        {v.price ? (
          <p className="text-accent font-extrabold text-xl mt-2.5 leading-none">
            {formatPrice(v.price.min)}
          </p>
        ) : (
          <p className="text-text-sub text-sm mt-2.5">견적 문의</p>
        )}
      </div>

      {/* 우측 이미지 — 홈페이지 카드와 동일한 4:3 비율 */}
      <div className="relative w-44 aspect-[4/3] shrink-0 rounded-xl overflow-hidden bg-gray-50">
        {imgSrc ? (
          <CarImageFallback
            src={imgSrc}
            alt={v.name}
            sizes="176px"
            className="object-contain p-3"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20">
            🚗
          </div>
        )}
      </div>
    </Link>
  );
}

export const PopularEstimatesClient = memo(function PopularEstimatesClient({
  vehicles,
}: {
  vehicles: VehicleCard[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [sortKey, setSortKey] = useState<SortKey>('price_asc');
  const [showSort, setShowSort] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.productTypes.length) n++;
    if (filters.depositZero !== null) n++;
    if (filters.contractMonths.length) n++;
    return n;
  }, [filters]);

  const displayed = useMemo(() => {
    const tabFiltered = filterByTab(vehicles, activeTab);
    const filterApplied = applyFilters(tabFiltered, filters);
    return sortVehicles(filterApplied, sortKey);
  }, [vehicles, activeTab, sortKey, filters]);

  const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? '';

  return (
    <div>
      {/* 카테고리 탭 */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              activeTab === tab.key
                ? 'border-primary bg-primary text-white'
                : 'border-border-solid bg-white text-text-sub hover:border-text-sub'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 정렬 + 필터 바 */}
      <div className="flex items-center justify-between mb-3">
        {/* 정렬 드롭다운 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSort(v => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-text-sub hover:text-text transition-colors"
          >
            {currentSortLabel}
            <ChevronDown
              size={15}
              className={`transition-transform ${showSort ? 'rotate-180' : ''}`}
            />
          </button>
          {showSort && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
              <div className="absolute left-0 top-8 z-20 bg-white border border-border-solid rounded-2xl shadow-lg py-1.5 min-w-[180px]">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => { setSortKey(opt.key); setShowSort(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      sortKey === opt.key
                        ? 'text-accent font-semibold'
                        : 'text-text hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 필터 버튼 */}
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
            activeFilterCount > 0
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border-solid bg-white text-text-sub hover:border-text-sub'
          }`}
        >
          <SlidersHorizontal size={14} />
          필터
          {activeFilterCount > 0 && (
            <span className="ml-0.5 bg-accent text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* 차량 수 표시 */}
      <p className="text-xs text-text-sub mb-3">
        총 <span className="font-semibold text-text">{displayed.length}</span>개 차종
      </p>

      {/* 카드 리스트 */}
      {displayed.length > 0 ? (
        <div className="flex flex-col gap-3">
          {displayed.map(v => (
            <VehicleCardItem key={v.id} v={v} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-text-sub text-sm">
          해당하는 차종이 없습니다
        </div>
      )}

      {/* 필터 모달 */}
      <FilterModal
        open={filterOpen}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
});
