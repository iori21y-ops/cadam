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

export function TrimOptionSelector({ trims, options, slug }: TrimOptionSelectorProps) {
  const [selectedTrimId, setSelectedTrimId] = useState<string>(trims[0]?.id ?? '');
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set());

  if (trims.length === 0) return null;

  const selectedTrim = trims.find((t) => t.id === selectedTrimId) ?? trims[0];

  // 선택 옵션: trim_id가 선택 트림과 같고 option_type !== 'common', id 기준 중복 제거
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

  const selectedOptionsTotal = options
    .filter((o) => selectedOptionIds.has(o.id))
    .reduce((sum, o) => sum + o.option_price, 0);

  const finalPrice = selectedTrim.base_price + selectedOptionsTotal;

  function toggleOption(id: string) {
    setSelectedOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleTrimChange(trimId: string) {
    setSelectedTrimId(trimId);
    setSelectedOptionIds(new Set());
  }

  return (
    <section className="px-5 pb-8">
      <h2 className="text-lg font-bold text-text mb-4">트림 &amp; 옵션 선택</h2>

      {/* 트림 선택 드롭다운 */}
      <select
        value={selectedTrimId}
        onChange={(e) => handleTrimChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-text bg-white mb-4 focus:outline-none focus:border-blue-400"
      >
        {trims.map((trim) => (
          <option key={trim.id} value={trim.id}>
            {trim.trim_name} — {formatManwon(trim.base_price)}
          </option>
        ))}
      </select>

      {/* 선택된 트림 기본 출고가 */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
        <p className="text-xs text-blue-500 mb-0.5">선택 트림 기본 출고가</p>
        <p className="text-base font-extrabold text-blue-700">
          {formatManwon(selectedTrim.base_price)}
        </p>
        {selectedTrim.tax_reduced_price != null &&
          selectedTrim.tax_reduced_price !== selectedTrim.base_price && (
            <p className="text-xs text-blue-400 mt-0.5">
              개소세 감면 시 {formatManwon(selectedTrim.tax_reduced_price)}
            </p>
          )}
      </div>

      {/* 선택 옵션 체크박스 */}
      {trimOptions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-text-sub mb-2">선택 옵션</p>
          <div className="space-y-2">
            {trimOptions.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer ${
                  selectedOptionIds.has(opt.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedOptionIds.has(opt.id)}
                    onChange={() => toggleOption(opt.id)}
                    className="accent-blue-500"
                  />
                  <span className="text-sm text-text">{opt.option_name}</span>
                </div>
                <span className="text-sm font-semibold text-text-sub shrink-0 ml-2">
                  {opt.option_price > 0 ? `+${formatManwon(opt.option_price)}` : '무상'}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 공통 옵션 체크박스 */}
      {commonOptions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-text-sub mb-2">공통 옵션</p>
          <div className="space-y-2">
            {commonOptions.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer ${
                  selectedOptionIds.has(opt.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedOptionIds.has(opt.id)}
                    onChange={() => toggleOption(opt.id)}
                    className="accent-blue-500"
                  />
                  <span className="text-sm text-text">{opt.option_name}</span>
                </div>
                <span className="text-sm font-semibold text-text-sub shrink-0 ml-2">
                  {opt.option_price > 0 ? `+${formatManwon(opt.option_price)}` : '무상'}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 가격 합산 카드 */}
      <div className="rounded-xl bg-white border border-gray-200 px-4 py-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-sub">옵션 합계</span>
          <span className="text-sm font-semibold text-text">
            {selectedOptionsTotal > 0 ? `+${formatManwon(selectedOptionsTotal)}` : '0원'}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-sm font-bold text-text">최종 예상 출고가</span>
          <span className="text-base font-extrabold text-primary">
            {formatManwon(finalPrice)}
          </span>
        </div>
      </div>

      {/* 옵션 상세 보기 링크 */}
      <Link
        href={`/cars/${slug}/options`}
        className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl border border-primary text-primary text-sm font-semibold"
      >
        옵션 상세 보기 →
      </Link>
    </section>
  );
}
