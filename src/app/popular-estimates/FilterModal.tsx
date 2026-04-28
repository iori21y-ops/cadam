'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { FilterState } from './types';

const CONTRACT_MONTHS = [12, 24, 36, 48, 60];

interface FilterModalProps {
  open: boolean;
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onClose: () => void;
}

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

export function FilterModal({ open, filters, onChange, onClose }: FilterModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  function reset() {
    onChange({ productTypes: [], depositZero: null, contractMonths: [] });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* 오버레이 */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* 바텀 시트 */}
      <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-8 max-h-[80vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text">필터</h2>
          <button type="button" onClick={onClose} className="p-1 text-text-sub hover:text-text">
            <X size={20} />
          </button>
        </div>

        {/* 이용상품 */}
        <section className="mb-6">
          <p className="text-sm font-semibold text-text mb-3">이용상품</p>
          <div className="flex gap-2">
            {(['rent', 'lease'] as const).map(pt => {
              const label = pt === 'rent' ? '장기렌트' : '리스';
              const active = filters.productTypes.includes(pt);
              return (
                <button
                  key={pt}
                  type="button"
                  onClick={() => onChange({ ...filters, productTypes: toggleItem(filters.productTypes, pt) })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    active
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border-solid bg-white text-text-sub hover:border-text-sub'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 초기비용 */}
        <section className="mb-6">
          <p className="text-sm font-semibold text-text mb-3">초기비용</p>
          <div className="flex gap-2">
            {([
              { val: null, label: '전체' },
              { val: true, label: '0원' },
              { val: false, label: '납부' },
            ] as const).map(({ val, label }) => {
              const active = filters.depositZero === val;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onChange({ ...filters, depositZero: val })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    active
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border-solid bg-white text-text-sub hover:border-text-sub'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 계약기간 */}
        <section className="mb-8">
          <p className="text-sm font-semibold text-text mb-3">계약기간</p>
          <div className="flex gap-2 flex-wrap">
            {CONTRACT_MONTHS.map(m => {
              const active = filters.contractMonths.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChange({ ...filters, contractMonths: toggleItem(filters.contractMonths, m) })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    active
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border-solid bg-white text-text-sub hover:border-text-sub'
                  }`}
                >
                  {m}개월
                </button>
              );
            })}
          </div>
        </section>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex-1 py-3 rounded-2xl border border-border-solid text-sm font-semibold text-text-sub hover:border-text-sub transition-colors"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-[2] py-3 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            적용하기
          </button>
        </div>
      </div>
    </div>
  );
}
