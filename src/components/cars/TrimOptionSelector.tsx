'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useQuoteStore } from '@/store/quoteStore';

interface Trim {
  id: string;
  trim_name: string;
  base_price: number;
  tax_reduced_price: number | null;
  fuel_type: string | null;
  displacement: number | null;
  drive_type: string | null;
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

const FUEL_ORDER = ['가솔린', '하이브리드', 'LPG', '디젤', '전기', '수소'];

function matchesFuel(trim: Trim, fuel: string): boolean {
  if (!trim.fuel_type) return true;
  if (trim.fuel_type === fuel) return true;
  if (trim.fuel_type === '가솔린/디젤' && (fuel === '가솔린' || fuel === '디젤')) return true;
  return false;
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

function OptionAccordion({ title, isOpen, onToggle, options, selectedIds, onToggleOption }: OptionAccordionProps) {
  const selected = options.filter((o) => selectedIds.has(o.id));
  const total = selected.reduce((sum, o) => sum + o.option_price, 0);

  return (
    <div className="border-b border-border-solid last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start justify-between px-4 py-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text">{title}</span>
            {!isOpen && selected.length > 0 && (
              <span className="text-xs text-accent font-medium">
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
                selectedIds.has(opt.id) ? 'border-accent bg-accent/10' : 'border-border-solid bg-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedIds.has(opt.id)}
                  onChange={() => onToggleOption(opt.id)}
                  className="accent-accent shrink-0"
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

function FilterButtons({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: { label: string; value: string }[];
  selected: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-text-sub mb-1.5">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
              selected === opt.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-solid bg-white text-text hover:border-text-sub'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TrimOptionSelector({ trims, options, slug }: TrimOptionSelectorProps) {
  const setTrimInStore = useQuoteStore((s) => s.setTrim);

  // 사용자가 명시적으로 선택한 값 (auto-select와 구분)
  const [userFuel, setUserFuel] = useState<string | null>(null);
  const [userDrive, setUserDrive] = useState<string | null>(null);
  const [userDisp, setUserDisp] = useState<number | null>(null);
  const [selectedTrimId, setSelectedTrimId] = useState<string>('');
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set());
  const [trimOptionsOpen, setTrimOptionsOpen] = useState(false);
  const [commonOptionsOpen, setCommonOptionsOpen] = useState(false);

  // ── 1단계: 유종 ──
  const availableFuels = useMemo(() => {
    const set = new Set<string>();
    for (const t of trims) {
      if (!t.fuel_type) continue;
      if (t.fuel_type === '가솔린/디젤') {
        set.add('가솔린');
        set.add('디젤');
      } else {
        set.add(t.fuel_type);
      }
    }
    return FUEL_ORDER.filter((f) => set.has(f));
  }, [trims]);

  // 1개면 자동선택
  const effectiveFuel = availableFuels.length === 1 ? availableFuels[0] : userFuel;

  // ── 2단계: 구동방식 ──
  const trims2 = useMemo(
    () => (effectiveFuel ? trims.filter((t) => matchesFuel(t, effectiveFuel)) : []),
    [trims, effectiveFuel]
  );

  const availableDrives = useMemo(() => {
    const set = new Set<string>();
    for (const t of trims2) if (t.drive_type) set.add(t.drive_type);
    return ['2WD', '4WD'].filter((d) => set.has(d));
  }, [trims2]);

  const skipDrive = availableDrives.length <= 1;
  const effectiveDrive = skipDrive ? (availableDrives[0] ?? null) : userDrive;

  // ── 3단계: 배기량 ──
  const trims3 = useMemo(() => {
    if (!effectiveDrive) return skipDrive ? trims2 : [];
    return trims2.filter((t) => t.drive_type === effectiveDrive);
  }, [trims2, effectiveDrive, skipDrive]);

  const skipDisp = effectiveFuel === '전기' || effectiveFuel === '수소';

  const availableDisps = useMemo(() => {
    if (skipDisp) return [];
    const set = new Set<number>();
    for (const t of trims3) {
      if (t.displacement != null && t.displacement > 0) set.add(t.displacement);
    }
    return [...set].sort((a, b) => a - b);
  }, [trims3, skipDisp]);

  const skipDispStep = skipDisp || availableDisps.length <= 1;
  const effectiveDisp = skipDispStep ? (availableDisps[0] ?? null) : userDisp;

  // ── 4단계: 세부 트림 ──
  const availableTrims = useMemo(() => {
    if (!effectiveFuel) return [];
    if (!skipDrive && !effectiveDrive) return [];
    if (!skipDispStep && effectiveDisp === null) return [];
    let filtered = trims3;
    if (!skipDispStep && effectiveDisp !== null) {
      // displacement null 트림은 판단 불가 → 같이 포함
      filtered = filtered.filter((t) => t.displacement === effectiveDisp || t.displacement === null);
    }
    return filtered;
  }, [trims3, skipDrive, effectiveDrive, skipDispStep, effectiveDisp, effectiveFuel]);

  // 1개면 자동선택, 기존 선택이 available에 없으면 초기화
  const effectiveTrimId = useMemo(() => {
    if (selectedTrimId && availableTrims.some((t) => t.id === selectedTrimId)) return selectedTrimId;
    if (availableTrims.length === 1) return availableTrims[0].id;
    return '';
  }, [selectedTrimId, availableTrims]);

  // quoteStore 동기화
  useEffect(() => {
    const t = trims.find((t) => t.id === effectiveTrimId);
    if (t) setTrimInStore(t.trim_name);
  }, [effectiveTrimId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 트림 변경 시 옵션 초기화
  useEffect(() => {
    setSelectedOptionIds(new Set());
    setTrimOptionsOpen(false);
    setCommonOptionsOpen(false);
  }, [effectiveTrimId]);

  const selectedTrim = trims.find((t) => t.id === effectiveTrimId) ?? null;

  // ── 핸들러 ──
  function handleFuelChange(fuel: string) {
    setUserFuel(fuel);
    setUserDrive(null);
    setUserDisp(null);
    setSelectedTrimId('');
  }

  function handleDriveChange(drive: string) {
    setUserDrive(drive);
    setUserDisp(null);
    setSelectedTrimId('');
  }

  function handleDispChange(v: string) {
    setUserDisp(Number(v));
    setSelectedTrimId('');
  }

  function handleTrimChange(trimId: string) {
    setSelectedTrimId(trimId);
  }

  function toggleOption(id: string) {
    setSelectedOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── 옵션 분류 ──
  const trimOptions = options.filter(
    (o, idx, arr) =>
      o.trim_id === effectiveTrimId &&
      o.option_type !== 'common' &&
      arr.findIndex((x) => x.id === o.id) === idx
  );
  const commonOptions = options.filter(
    (o, idx, arr) =>
      (o.trim_id === null || o.option_type === 'common') &&
      arr.findIndex((x) => x.id === o.id) === idx
  );

  const selectedOptionsTotal = [...trimOptions, ...commonOptions]
    .filter((o) => selectedOptionIds.has(o.id))
    .reduce((sum, o) => sum + o.option_price, 0);

  const finalPrice = selectedTrim ? selectedTrim.base_price + selectedOptionsTotal : 0;

  // ── 단계 표시 조건 ──
  const showDriveStep = effectiveFuel !== null && !skipDrive;
  const showDispStep =
    effectiveFuel !== null && (skipDrive || effectiveDrive !== null) && !skipDispStep;
  const showTrimStep =
    availableTrims.length > 0 && (skipDispStep || effectiveDisp !== null);

  return (
    <section className="px-5 pt-2 pb-6">
      <h2 className="text-lg font-bold text-text mb-3">트림 &amp; 옵션 선택</h2>

      <div className="bg-white rounded-2xl border border-accent shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-border-solid space-y-4">

          {/* 1단계: 유종 */}
          <FilterButtons
            title="유종"
            options={availableFuels.map((f) => ({ label: f, value: f }))}
            selected={effectiveFuel}
            onSelect={handleFuelChange}
          />

          {/* 2단계: 구동방식 — 복수일 때만 표시 */}
          {showDriveStep && (
            <FilterButtons
              title="구동방식"
              options={availableDrives.map((d) => ({ label: d, value: d }))}
              selected={effectiveDrive}
              onSelect={handleDriveChange}
            />
          )}

          {/* 3단계: 배기량 — 복수일 때만 표시 */}
          {showDispStep && (
            <FilterButtons
              title="배기량"
              options={availableDisps.map((d) => ({ label: `${d}L`, value: String(d) }))}
              selected={effectiveDisp !== null ? String(effectiveDisp) : null}
              onSelect={handleDispChange}
            />
          )}

          {/* 4단계: 세부 트림 */}
          {showTrimStep && (
            <div>
              <p className="text-xs text-text-sub mb-1.5">세부 트림</p>
              <select
                value={effectiveTrimId}
                onChange={(e) => handleTrimChange(e.target.value)}
                className="w-full border border-border-solid rounded-xl px-4 py-3 text-sm text-text bg-surface-secondary focus:outline-none focus:border-accent"
              >
                {availableTrims.map((trim) => (
                  <option key={trim.id} value={trim.id}>
                    {trim.trim_name} — {formatManwon(trim.base_price)}
                  </option>
                ))}
              </select>
              {selectedTrim?.tax_reduced_price != null &&
                selectedTrim.tax_reduced_price !== selectedTrim.base_price && (
                  <p className="text-xs text-text-sub mt-1.5">
                    개소세 감면 시{' '}
                    <span className="font-semibold text-accent">
                      {formatManwon(selectedTrim.tax_reduced_price)}
                    </span>
                  </p>
                )}
            </div>
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
        {selectedTrim && (
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
            <div className="border-t border-border-solid mt-2 pt-3 flex items-center justify-between">
              <span className="text-sm font-bold text-text">최종 차량가격</span>
              <span className="text-xl font-extrabold text-primary">{formatManwon(finalPrice)}</span>
            </div>
          </div>
        )}
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
