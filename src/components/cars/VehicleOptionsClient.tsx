'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronDown } from 'lucide-react';

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

type TabType = 'trim' | 'common';

export default function VehicleOptionsClient({ vehicleName, slug, trims, options }: Props) {
  const [selectedTrimId, setSelectedTrimId] = useState<string>(trims[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState<TabType>('trim');

  const selectedTrim = trims.find((t) => t.id === selectedTrimId) ?? trims[0];

  const commonOptions = options.filter(
    (opt) => !opt.trim_id || opt.option_type === 'common'
  );

  const trimOptions = selectedTrim
    ? options.filter(
        (opt) => opt.trim_id === selectedTrim.id && opt.option_type !== 'common'
      )
    : [];

  const hasSpec =
    selectedTrim &&
    (selectedTrim.fuel_eff_combined != null ||
      selectedTrim.fuel_eff_city != null ||
      selectedTrim.fuel_eff_highway != null ||
      selectedTrim.co2_emission != null ||
      selectedTrim.curb_weight_kg != null ||
      selectedTrim.wheel_size);

  // 데이터 없음 상태
  if (trims.length === 0) {
    return (
      <div className="min-h-screen bg-surface-secondary pb-24">
        <div className="bg-white border-b border-border-solid px-4 py-3 flex items-center gap-2">
          <Link href={`/cars/${slug}`} className="p-1 -ml-1 text-text-sub">
            <ChevronLeft size={20} />
          </Link>
          <span className="text-base font-bold text-text">차량 옵션 정보</span>
        </div>
        <div className="px-5 pt-12 text-center">
          <p className="text-text font-semibold mb-2">{vehicleName}</p>
          <p className="text-sm text-text-sub mb-6">데이터 준비 중입니다.</p>
          <Link
            href={`/cars/${slug}`}
            className="inline-flex items-center gap-1 text-sm text-primary font-medium"
          >
            <ChevronLeft size={14} />
            차량 상세로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary pb-28">
      {/* ── 헤더 ── */}
      <div className="bg-white border-b border-border-solid px-4 py-3 flex items-center gap-2 sticky top-0 z-10">
        <Link href={`/cars/${slug}`} className="p-1 -ml-1 text-text-sub">
          <ChevronLeft size={20} />
        </Link>
        <span className="text-base font-bold text-text">차량 옵션 정보</span>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5 space-y-4">
        {/* ── 차량 정보 카드 ── */}
        <div className="rounded-2xl bg-white border border-border-solid shadow-sm px-5 py-5">
          <p className="text-[11px] text-text-sub mb-0.5">차량</p>
          <p className="text-xl font-bold text-text mb-4">{vehicleName}</p>

          {/* 트림 드롭다운 */}
          <div className="mb-4">
            <p className="text-xs text-text-sub mb-1.5">트림 선택</p>
            <div className="relative">
              <select
                value={selectedTrimId}
                onChange={(e) => {
                  setSelectedTrimId(e.target.value);
                  setActiveTab('trim');
                }}
                className="w-full rounded-xl border border-border-solid bg-surface-secondary px-4 pr-10 py-3 text-sm font-medium text-text appearance-none cursor-pointer"
              >
                {trims.map((trim) => (
                  <option key={trim.id} value={trim.id}>
                    {trim.trim_name}
                    {trim.trim_name_en && trim.trim_name_en !== trim.trim_name
                      ? ` (${trim.trim_name_en})`
                      : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <ChevronDown size={16} className="text-text-sub" />
              </div>
            </div>
          </div>

          {/* 가격 표시 */}
          {selectedTrim && (
            <div className="pt-3 border-t border-border-solid space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-sub">출고가 (기본)</span>
                <span className="text-xl font-extrabold text-primary">
                  {formatManwon(selectedTrim.base_price)}
                </span>
              </div>
              {selectedTrim.tax_reduced_price != null &&
                selectedTrim.tax_reduced_price !== selectedTrim.base_price && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-sub">개소세 감면 시</span>
                    <span className="text-base font-bold text-accent">
                      {formatManwon(selectedTrim.tax_reduced_price)}
                    </span>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* ── 제원 뱃지 (가로 스크롤) ── */}
        {hasSpec && selectedTrim && (
          <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
            <div className="flex gap-2 w-max pb-1">
              {selectedTrim.fuel_eff_combined != null && (
                <div className="shrink-0 rounded-xl bg-white border border-border-solid px-4 py-3 text-center min-w-[72px]">
                  <p className="text-[10px] text-text-sub mb-0.5">복합연비</p>
                  <p className="text-sm font-bold text-text whitespace-nowrap">
                    {selectedTrim.fuel_eff_combined}km/L
                  </p>
                </div>
              )}
              {selectedTrim.fuel_eff_city != null && (
                <div className="shrink-0 rounded-xl bg-white border border-border-solid px-4 py-3 text-center min-w-[72px]">
                  <p className="text-[10px] text-text-sub mb-0.5">도심연비</p>
                  <p className="text-sm font-bold text-text whitespace-nowrap">
                    {selectedTrim.fuel_eff_city}km/L
                  </p>
                </div>
              )}
              {selectedTrim.fuel_eff_highway != null && (
                <div className="shrink-0 rounded-xl bg-white border border-border-solid px-4 py-3 text-center min-w-[72px]">
                  <p className="text-[10px] text-text-sub mb-0.5">고속연비</p>
                  <p className="text-sm font-bold text-text whitespace-nowrap">
                    {selectedTrim.fuel_eff_highway}km/L
                  </p>
                </div>
              )}
              {selectedTrim.co2_emission != null && (
                <div className="shrink-0 rounded-xl bg-white border border-border-solid px-4 py-3 text-center min-w-[72px]">
                  <p className="text-[10px] text-text-sub mb-0.5">CO₂ 배출</p>
                  <p className="text-sm font-bold text-text whitespace-nowrap">
                    {selectedTrim.co2_emission}g/km
                  </p>
                </div>
              )}
              {selectedTrim.curb_weight_kg != null && (
                <div className="shrink-0 rounded-xl bg-white border border-border-solid px-4 py-3 text-center min-w-[72px]">
                  <p className="text-[10px] text-text-sub mb-0.5">공차중량</p>
                  <p className="text-sm font-bold text-text whitespace-nowrap">
                    {selectedTrim.curb_weight_kg.toLocaleString()}kg
                  </p>
                </div>
              )}
              {selectedTrim.wheel_size && (
                <div className="shrink-0 rounded-xl bg-white border border-border-solid px-4 py-3 text-center min-w-[72px]">
                  <p className="text-[10px] text-text-sub mb-0.5">휠사이즈</p>
                  <p className="text-sm font-bold text-text whitespace-nowrap">
                    {selectedTrim.wheel_size}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 옵션 섹션 ── */}
        <div className="rounded-2xl bg-white border border-border-solid shadow-sm overflow-hidden">
          {/* 탭 헤더 */}
          <div className="flex border-b border-border-solid">
            <button
              onClick={() => setActiveTab('trim')}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative ${
                activeTab === 'trim' ? 'text-primary' : 'text-text-sub'
              }`}
            >
              선택 옵션
              {activeTab === 'trim' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('common')}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative ${
                activeTab === 'common' ? 'text-primary' : 'text-text-sub'
              }`}
            >
              공통 옵션
              {activeTab === 'common' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>

          {/* 탭 내용 */}
          {activeTab === 'trim' && (
            <div>
              {trimOptions.length > 0 ? (
                trimOptions.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={`flex items-center justify-between px-5 py-4 ${
                      idx < trimOptions.length - 1 ? 'border-b border-border-solid' : ''
                    }`}
                  >
                    <span className="text-sm text-text leading-snug flex-1 pr-4">
                      {opt.option_name}
                    </span>
                    <span className="text-sm font-bold text-primary shrink-0">
                      {opt.option_price > 0 ? `+${formatManwon(opt.option_price)}` : '무상'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-text-sub">등록된 옵션이 없습니다</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'common' && (
            <div>
              {commonOptions.length > 0 ? (
                commonOptions.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={`flex items-center justify-between px-5 py-4 ${
                      idx < commonOptions.length - 1 ? 'border-b border-border-solid' : ''
                    }`}
                  >
                    <span className="text-sm text-text leading-snug flex-1 pr-4">
                      {opt.option_name}
                    </span>
                    <span className="text-sm font-bold text-primary shrink-0">
                      {opt.option_price > 0 ? `+${formatManwon(opt.option_price)}` : '무상'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-text-sub">등록된 옵션이 없습니다</p>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-[11px] text-text-sub text-center pb-2">
          출고가 기준 · 실제 옵션 구성은 변경될 수 있습니다
        </p>
      </div>

      {/* ── 하단 고정 CTA ── */}
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
