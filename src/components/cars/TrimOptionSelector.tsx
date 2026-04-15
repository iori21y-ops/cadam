'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Trim {
  id: string;
  trim_name: string;
  base_price: number;
  tax_reduced_price: number | null;
}

interface TrimOption {
  id: string;
  trim_id: string | null;
  vehicle_id: string;
  option_name: string;
  option_price: number;
  option_type: string;
}

interface TrimOptionSelectorProps {
  trims: Trim[];
  options: TrimOption[];
  slug: string;
}

function formatManwon(price: number): string {
  return `${Math.round(price / 10000).toLocaleString('ko-KR')}만원`;
}

function IconChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface OptionAccordionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  options: TrimOption[];
  selectedIds: Set<string>;
  onToggleOption: (id: string) => void;
}

function OptionAccordion({
  title,
  isOpen,
  onToggle,
  options,
  selectedIds,
  onToggleOption,
}: OptionAccordionProps) {
  const selected = options.filter((o) => selectedIds.has(o.id));
  const total = selected.reduce((sum, o) => sum + o.option_price, 0);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start justify-between px-4 py-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text">{title}</span>
            {!isOpen && selected.length > 0 && (
              <span className="text-xs text-blue-500 font-medium">
                {selected.length}개 선택 · +{formatManwon(total)}
              </span>
            )}
          </div>
          {!isOpen && selected.length > 0 && (
            <p className="text-xs text-text-sub mt-0.5 truncate">
              {selected.map((o) => o.option_name).join(', ')}
            </p>
          )}
        </div>
        <span className="ml-2 text-text-sub shrink-0 mt-0.5">
          {isOpen ? <IconChevronUp /> : <IconChevronDown />}
        </span>
      </button>

      {isOpen && (
        <div className="px-4 pb-3 space-y-2">
          {options.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center justify-between px-3 py-3 rounded-xl border cursor-pointer transition-colors ${
                selectedIds.has(opt.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedIds.has(opt.id)}
                  onChange={() => onToggleOption(opt.id)}
                  className="accent-blue-500 shrink-0"
                />
                <span className="text-sm text-text truncate">{opt.option_name}</span>
              </div>
              <span className="text-sm font-semibold text-text-sub shrink-0 ml-2">
                {opt.option_price > 0 ? `+${formatManwon(opt.option_price)}` : '무상'}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function TrimOptionSelector({ trims, options, slug }: TrimOptionSelectorProps) {
  const [selectedTrimId, setSelectedTrimId] = useState<string>(trims[0]?.id ?? '');
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set());
  const [trimOptionsOpen, setTrimOptionsOpen] = useState(false);
  const [commonOptionsOpen, setCommonOptionsOpen] = useState(false);

  if (trims.length === 0) return null;

  const selectedTrim = trims.find((t) => t.id === selectedTrimId) ?? trims[0];

  // 선택 옵션: 해당 트림 전용이고 common이 아닌 것, id 기준 중복 제거
  const trimOptions = options.filter(
    (o, idx, arr) =>
      o.trim_id === selectedTrimId &&
      o.option_type !== 'common' &&
      arr.findIndex((x) => x.id === o.id) === idx
  );

  // 공통 옵션: trim_id === null 이거나 option_type === 'common', id 기준 중복 제거
  const commonOptions = options.filter(
    (o, idx, arr) =>
      (o.trim_id === null || o.option_type === 'common') &&
      arr.findIndex((x) => x.id === o.id) === idx
  );

  const selectedOptionsTotal = [...trimOptions, ...commonOptions]
    .filter((o) => selectedOptionIds.has(o.id))
    .reduce((sum, o) => sum + o.option_price, 0);

  const finalPrice = selectedTrim.base_price + selectedOptionsTotal;

  function toggleOption(id: string) {
    setSelectedOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleTrimChange(trimId: string) {
    setSelectedTrimId(trimId);
    setSelectedOptionIds(new Set());
    setTrimOptionsOpen(false);
    setCommonOptionsOpen(false);
  }

  return (
    <section className="px-5 pt-2 pb-6">
      <h2 className="text-lg font-bold text-text mb-3">트림 &amp; 옵션 선택</h2>

      <div className="bg-white rounded-2xl border border-border-solid shadow-sm overflow-hidden">
        {/* 트림 선택 */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <p className="text-xs text-text-sub mb-1.5">트림 선택</p>
          <select
            value={selectedTrimId}
            onChange={(e) => handleTrimChange(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-text bg-surface-secondary focus:outline-none focus:border-blue-400"
          >
            {trims.map((trim) => (
              <option key={trim.id} value={trim.id}>
                {trim.trim_name} — {formatManwon(trim.base_price)}
              </option>
            ))}
          </select>

          {selectedTrim.tax_reduced_price != null &&
            selectedTrim.tax_reduced_price !== selectedTrim.base_price && (
              <p className="text-xs text-text-sub mt-1.5">
                개소세 감면 시{' '}
                <span className="font-semibold text-blue-500">
                  {formatManwon(selectedTrim.tax_reduced_price)}
                </span>
              </p>
            )}
        </div>

        {/* 선택 옵션 아코디언 */}
        {trimOptions.length > 0 && (
          <OptionAccordion
            title="선택 옵션"
            isOpen={trimOptionsOpen}
            onToggle={() => setTrimOptionsOpen((v) => !v)}
            options={trimOptions}
            selectedIds={selectedOptionIds}
            onToggleOption={toggleOption}
          />
        )}

        {/* 공통 옵션 아코디언 */}
        {commonOptions.length > 0 && (
          <OptionAccordion
            title="공통 옵션"
            isOpen={commonOptionsOpen}
            onToggle={() => setCommonOptionsOpen((v) => !v)}
            options={commonOptions}
            selectedIds={selectedOptionIds}
            onToggleOption={toggleOption}
          />
        )}

        {/* 최종 가격 요약 */}
        <div className="px-4 py-4 bg-surface-secondary">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-text-sub">트림 기본가</span>
            <span className="text-sm text-text">{formatManwon(selectedTrim.base_price)}</span>
          </div>
          {selectedOptionsTotal > 0 && (
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-text-sub">옵션 합계</span>
              <span className="text-sm text-text">+{formatManwon(selectedOptionsTotal)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 mt-2 pt-3 flex items-center justify-between">
            <span className="text-sm font-bold text-text">최종 차량가격</span>
            <span className="text-xl font-extrabold text-primary">{formatManwon(finalPrice)}</span>
          </div>
        </div>
      </div>

      {/* 옵션 상세 보기 */}
      <Link
        href={`/cars/${slug}/options`}
        className="flex items-center justify-center gap-1.5 w-full mt-3 py-3 rounded-xl border border-primary text-primary text-sm font-semibold"
      >
        옵션 상세 보기 →
      </Link>
    </section>
  );
}
