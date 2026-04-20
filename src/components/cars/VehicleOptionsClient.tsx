'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface TrimRow {
  id: string;
  trim_name: string;
  trim_name_en: string | null;
  base_price: number;
  tax_reduced_price: number | null;
  drive_type: string | null;
  fuel_eff_combined: number | null;
  fuel_eff_city: number | null;
  fuel_eff_highway: number | null;
  co2_emission: number | null;
  curb_weight_kg: number | null;
  wheel_size: string | null;
  display_order: number;
}

export interface OptionRow {
  id: string;
  trim_id: string | null;
  option_name: string;
  option_price: number;
  option_type: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
}

interface Props {
  vehicleName: string;
  slug: string;
  trims: TrimRow[];
  options: OptionRow[];
}

function formatManwon(price: number): string {
  return `${Math.round(price / 10000).toLocaleString()}만원`;
}

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CategoryIcon({ category }: { category: string | null }) {
  const cls = 'w-8 h-8 text-text-muted';
  switch (category) {
    case '외관':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case '편의':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case '안전':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case '성능':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      );
  }
}

function OptionCard({ opt }: { opt: OptionRow }) {
  const category = opt.category || null;

  return (
    <div className="flex gap-3 bg-white rounded-xl border border-border-solid shadow-sm p-3">
      {/* 이미지 / 아이콘 */}
      <div className="w-[120px] h-[80px] rounded-lg overflow-hidden bg-surface-secondary flex items-center justify-center shrink-0">
        {opt.image_url ? (
          <Image
            src={opt.image_url}
            alt={opt.option_name}
            width={120}
            height={80}
            className="object-cover w-full h-full"
          />
        ) : (
          <CategoryIcon category={opt.category} />
        )}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-1.5 mb-1">
          <span className="text-sm font-bold text-text leading-snug">{opt.option_name}</span>
          {category && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent shrink-0 leading-5">
              {category}
            </span>
          )}
        </div>
        <p className="text-base font-extrabold text-primary mb-1.5">
          {opt.option_price > 0 ? `+${formatManwon(opt.option_price)}` : '무상'}
        </p>
        <p className="text-xs text-text-sub leading-relaxed line-clamp-2">
          {opt.description ?? '상세 설명 준비 중'}
        </p>
      </div>
    </div>
  );
}

function OptionSection({ title, options }: { title: string; options: OptionRow[] }) {
  if (options.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-bold text-text-sub uppercase tracking-wide mb-2.5">{title}</h3>
      <div className="space-y-3">
        {options.map((opt) => (
          <OptionCard key={opt.id} opt={opt} />
        ))}
      </div>
    </div>
  );
}

export default function VehicleOptionsClient({ vehicleName, slug, trims, options }: Props) {
  const [selectedTrimId, setSelectedTrimId] = useState<string>(trims[0]?.id ?? '');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // 선택 트림 옵션 / 공통 옵션 분리
  const selectedTrimOptions = useMemo(
    () => options.filter((o) => o.trim_id === selectedTrimId && o.option_type !== 'common'),
    [selectedTrimId, options]
  );
  const commonOptions = useMemo(
    () => options.filter((o) => !o.trim_id || o.option_type === 'common'),
    [options]
  );

  // 카테고리 필터 목록 계산
  const { categories, hasCategory } = useMemo(() => {
    const all = [...selectedTrimOptions, ...commonOptions];
    const hasCat = all.some((o) => o.category);
    if (!hasCat) return { categories: [] as string[], hasCategory: false };
    const cats = new Set(all.map((o) => o.category || '기타'));
    return { categories: ['전체', ...Array.from(cats)], hasCategory: true };
  }, [selectedTrimOptions, commonOptions]);

  // 카테고리 필터 적용
  const filteredTrimOptions =
    selectedCategory === '전체'
      ? selectedTrimOptions
      : selectedTrimOptions.filter((o) => (o.category || '기타') === selectedCategory);

  const filteredCommonOptions =
    selectedCategory === '전체'
      ? commonOptions
      : commonOptions.filter((o) => (o.category || '기타') === selectedCategory);

  // 데이터 없음
  if (trims.length === 0) {
    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="bg-white border-b border-border-solid px-4 py-3 flex items-center gap-2 sticky top-0 z-10">
          <Link href={`/cars/${slug}`} className="p-1 -ml-1 text-text-sub">
            <IconBack />
          </Link>
          <span className="text-base font-bold text-text">차량 옵션 정보</span>
        </div>
        <div className="px-5 pt-12 text-center">
          <p className="text-text font-semibold mb-2">{vehicleName}</p>
          <p className="text-sm text-text-sub mb-6">데이터 준비 중입니다.</p>
          <Link href={`/cars/${slug}`} className="inline-flex items-center gap-1 text-sm text-primary font-medium">
            ← 차량 상세로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* 헤더 */}
      <div className="bg-white border-b border-border-solid px-4 py-3 flex items-center gap-2 sticky top-0 z-10">
        <Link href={`/cars/${slug}`} className="p-1 -ml-1 text-text-sub">
          <IconBack />
        </Link>
        <span className="text-base font-bold text-text">차량 옵션 정보</span>
      </div>

      {/* 차량명 + 트림 탭 */}
      <div className="bg-white border-b border-border-solid">
        <div className="max-w-lg mx-auto">
          <p className="px-5 pt-4 pb-2 text-xs text-text-sub font-medium">{vehicleName}</p>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 px-5 pb-3 w-max">
              {trims.map((trim) => (
                <button
                  key={trim.id}
                  type="button"
                  onClick={() => {
                    setSelectedTrimId(trim.id);
                    setSelectedCategory('전체');
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                    selectedTrimId === trim.id
                      ? 'bg-primary text-white'
                      : 'bg-surface-secondary text-text-sub hover:text-text'
                  }`}
                >
                  {trim.trim_name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-4 pb-4 space-y-5">
        {/* 카테고리 필터 칩 */}
        {hasCategory && (
          <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
            <div className="flex gap-2 w-max pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                    selectedCategory === cat
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-text-sub border-border-solid hover:border-text-sub'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 선택 옵션 섹션 */}
        <OptionSection title="선택 옵션" options={filteredTrimOptions} />

        {/* 공통 옵션 섹션 */}
        <OptionSection title="공통 옵션" options={filteredCommonOptions} />

        {/* 옵션 없음 */}
        {filteredTrimOptions.length === 0 && filteredCommonOptions.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-text-sub">등록된 옵션이 없습니다</p>
          </div>
        )}

        <p className="text-[11px] text-text-sub text-center">
          출고가 기준 · 실제 옵션 구성은 변경될 수 있습니다
        </p>
      </div>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-solid px-5 py-4">
        <Link
          href="/direct"
          className="block w-full max-w-lg mx-auto bg-primary text-white text-center py-4 rounded-2xl font-bold text-base tracking-tight"
        >
          상담 신청하기
        </Link>
      </div>
    </div>
  );
}
