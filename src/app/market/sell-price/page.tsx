'use client';

import { useState, useEffect, useCallback } from 'react';

// ── 타입 ──────────────────────────────────────────────────────────────

interface YearPrices {
  low:  number | null;
  mid:  number | null;
  high: number | null;
}

interface UsedPricesResult {
  status:     'ok' | 'not_found';
  brand:      string;
  model:      string;
  latestWeek: string | null;
  prices:     Record<number, YearPrices> | null;
}

interface TrimOption {
  trim_name:  string;
  msrp_price: number;
}

// ── 상수 ──────────────────────────────────────────────────────────────

const MILEAGE_LABELS: Record<'low' | 'mid' | 'high', string> = {
  low:  '저주행 (0 ~ 3만km)',
  mid:  '일반 (3 ~ 6만km)',
  high: '고주행 (6 ~ 10만km)',
};

// ── 유틸 ──────────────────────────────────────────────────────────────

function fmtMk(val: number): string {
  if (val >= 10_000) return `${(val / 10_000).toFixed(1)}억원`;
  return `${val.toLocaleString()}만원`;
}

function fmtRatio(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

function getConditionLabel(ratio: number): { label: string; color: string } {
  if (ratio >= 0.8) return { label: '가치 보존 우수', color: '#22c55e' };
  if (ratio >= 0.6) return { label: '평균 수준', color: '#f59e0b' };
  if (ratio >= 0.4) return { label: '감가 진행', color: '#f97316' };
  return { label: '대폭 감가', color: '#ef4444' };
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────

function SelectStyled({
  value,
  onChange,
  disabled,
  loading,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className="w-full px-4 py-3 rounded-xl border border-[#2a2a3e] bg-[#0e0e20] text-white text-sm appearance-none focus:outline-none focus:border-red-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
        {loading ? '⟳' : '▾'}
      </span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-300 text-sm font-semibold mb-2">{children}</p>;
}

// ── 메인 페이지 ───────────────────────────────────────────────────────

export default function SellPricePage() {
  // 입력
  const [brand, setBrand]     = useState('');
  const [model, setModel]     = useState('');
  const [year, setYear]       = useState<number | ''>('');
  const [mileage, setMileage] = useState<'low' | 'mid' | 'high'>('mid');

  // 드롭다운 데이터
  const [brands, setBrands]   = useState<string[]>([]);
  const [models, setModels]   = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // 조회 결과
  const [result, setResult]       = useState<UsedPricesResult | null>(null);
  const [msrpMin, setMsrpMin]     = useState<number | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [queried, setQueried]     = useState(false);

  // 리드
  const [leadData, setLeadData]           = useState({ name: '', phone: '' });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError]         = useState<string | null>(null);
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  // ── 브랜드 로드 ────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingBrands(true);
    fetch('/api/vehicle-msrp/brands')
      .then((r) => r.json())
      .then((d: { brands?: string[] }) => setBrands(d.brands ?? []))
      .catch(() => setBrands([]))
      .finally(() => setLoadingBrands(false));
  }, []);

  // ── 모델 로드 ──────────────────────────────────────────────────────
  const loadModels = useCallback(async (b: string) => {
    if (!b) { setModels([]); return; }
    setLoadingModels(true);
    setModels([]);
    setModel('');
    setResult(null);
    setQueried(false);
    try {
      const r = await fetch(`/api/vehicle-msrp/models?brand=${encodeURIComponent(b)}`);
      const d = await r.json() as { models?: string[] };
      setModels(d.models ?? []);
    } catch { setModels([]); }
    finally { setLoadingModels(false); }
  }, []);

  // ── 조회 ───────────────────────────────────────────────────────────
  async function handleSearch() {
    if (!brand || !model) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setMsrpMin(null);
    setQueried(true);

    try {
      const [priceRes, msrpRes] = await Promise.all([
        fetch(`/api/used-prices?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`),
        fetch(`/api/vehicle-msrp?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`),
      ]);

      const priceData = await priceRes.json() as UsedPricesResult;
      setResult(priceData);

      if (msrpRes.ok) {
        const msrpData = await msrpRes.json() as { trims?: TrimOption[] };
        const prices = (msrpData.trims ?? []).map((t) => t.msrp_price).filter((p) => p > 0);
        if (prices.length > 0) setMsrpMin(Math.min(...prices));
      }

      if (priceData.prices) {
        const years = Object.keys(priceData.prices).map(Number).sort((a, b) => b - a);
        if (year === '' && years.length > 0) setYear(years[0]);
      }
    } catch {
      setError('조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  // ── 리드 제출 ──────────────────────────────────────────────────────
  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLeadSubmitting(true);
    setLeadError(null);

    const currentPrice = year !== '' && result?.prices?.[year]
      ? result.prices[year][mileage]
      : null;

    const summary = [
      `[시세조회] ${brand} ${model} ${year}년식 ${MILEAGE_LABELS[mileage]}`,
      currentPrice ? `예상시세: ${fmtMk(currentPrice)}` : '시세 미조회',
    ].join(' / ');

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadData.name,
          phone: leadData.phone,
          privacyAgreed: true,
          contactMethod: 'phone',
          financeSummary: summary,
          stepCompleted: 3,
        }),
      });
      if (!res.ok) throw new Error('API 오류');
      setLeadSubmitted(true);
    } catch {
      setLeadError('잠시 후 다시 시도해주세요.');
    } finally {
      setLeadSubmitting(false);
    }
  }

  // ── 파생 데이터 ────────────────────────────────────────────────────
  const availableYears = result?.prices
    ? Object.keys(result.prices).map(Number).sort((a, b) => b - a)
    : [];

  const selectedPrices = year !== '' && result?.prices?.[year] ? result.prices[year] : null;
  const displayPrice   = selectedPrices?.[mileage] ?? null;
  const retentionRatio = displayPrice && msrpMin ? displayPrice / msrpMin : null;
  const condition      = retentionRatio ? getConditionLabel(retentionRatio) : null;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0c0c1d 0%, #1a1a2e 60%, #0c0c1d 100%)' }}
    >
      <div className="max-w-[560px] mx-auto px-4 py-10">

        {/* 헤더 */}
        <div className="mb-8">
          <p className="text-slate-500 text-xs font-medium tracking-widest uppercase mb-2">RENTAILOR</p>
          <h1 className="text-white text-2xl font-bold mb-1">내 차 시세 조회</h1>
          <p className="text-slate-400 text-sm">엔카 실거래 기준 · 연식·주행거리별 중고차 예상 시세</p>
        </div>

        {/* 입력 폼 */}
        <div className="bg-[#12122a] border border-[#2a2a3e] rounded-2xl p-5 mb-6 flex flex-col gap-5">

          {/* 브랜드 */}
          <div>
            <Label>브랜드</Label>
            <SelectStyled
              value={brand}
              onChange={(v) => { setBrand(v); loadModels(v); }}
              loading={loadingBrands}
            >
              <option value="">브랜드 선택</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </SelectStyled>
          </div>

          {/* 모델 */}
          <div>
            <Label>모델</Label>
            <SelectStyled
              value={model}
              onChange={(v) => { setModel(v); setResult(null); setQueried(false); setYear(''); }}
              disabled={!brand}
              loading={loadingModels}
            >
              <option value="">모델 선택</option>
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </SelectStyled>
          </div>

          {/* 주행거리 구간 */}
          <div>
            <Label>현재 주행거리</Label>
            <div className="flex flex-col gap-2">
              {(['low', 'mid', 'high'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMileage(k)}
                  className={[
                    'px-4 py-3 rounded-xl border text-left text-sm transition-all',
                    mileage === k
                      ? 'border-red-500 bg-red-500/10 text-white ring-1 ring-red-500/30'
                      : 'border-[#2a2a3e] bg-[#0e0e20] text-slate-400 hover:border-[#3a3a5e]',
                  ].join(' ')}
                >
                  {MILEAGE_LABELS[k]}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={!brand || !model || loading}
            className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '조회 중…' : '시세 조회하기'}
          </button>
        </div>

        {/* 에러 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* 결과 없음 */}
        {queried && !loading && result?.status === 'not_found' && (
          <div className="bg-[#12122a] border border-[#2a2a3e] rounded-2xl p-6 mb-6 text-center">
            <p className="text-slate-400 text-2xl mb-2">🔍</p>
            <p className="text-white font-semibold mb-1">시세 데이터 없음</p>
            <p className="text-slate-500 text-sm">{brand} {model}의 데이터가 아직 수집되지 않았습니다.</p>
          </div>
        )}

        {/* 결과 있음 */}
        {result?.status === 'ok' && result.prices && (
          <>
            {/* 연식 선택 탭 */}
            {availableYears.length > 1 && (
              <div className="mb-4">
                <p className="text-slate-400 text-xs mb-2">연식 선택</p>
                <div className="flex flex-wrap gap-2">
                  {availableYears.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(y)}
                      className={[
                        'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
                        year === y
                          ? 'border-red-500 bg-red-500/15 text-red-300'
                          : 'border-[#2a2a3e] bg-[#0e0e20] text-slate-400 hover:border-[#3a3a5e]',
                      ].join(' ')}
                    >
                      {y}년식
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 메인 시세 카드 */}
            {selectedPrices && (
              <div className="bg-[#12122a] border border-[#2a2a3e] rounded-2xl p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">
                      {brand} {model} {year !== '' ? `${year}년식` : ''} · {MILEAGE_LABELS[mileage]}
                    </p>
                    <p className="text-white text-3xl font-bold">
                      {displayPrice ? fmtMk(displayPrice) : '–'}
                    </p>
                  </div>
                  {condition && (
                    <div
                      className="px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ color: condition.color, backgroundColor: condition.color + '20' }}
                    >
                      {condition.label}
                    </div>
                  )}
                </div>

                {/* 3구간 비교 */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(['low', 'mid', 'high'] as const).map((k) => (
                    <div
                      key={k}
                      className={[
                        'rounded-xl p-3 text-center border transition-all',
                        mileage === k
                          ? 'border-red-500/50 bg-red-500/10'
                          : 'border-[#2a2a3e] bg-[#0e0e20]/60',
                      ].join(' ')}
                    >
                      <p className="text-slate-500 text-xs mb-1">
                        {k === 'low' ? '저주행' : k === 'mid' ? '일반' : '고주행'}
                      </p>
                      <p className={['font-bold text-sm', mileage === k ? 'text-white' : 'text-slate-300'].join(' ')}>
                        {selectedPrices[k] ? fmtMk(selectedPrices[k]!) : '–'}
                      </p>
                    </div>
                  ))}
                </div>

                {/* 신차가 대비 잔존율 */}
                {retentionRatio !== null && msrpMin !== null && (
                  <div className="pt-3 border-t border-[#1a1a3e]">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">신차가 기준 잔존율</span>
                      <span className="text-slate-300 font-medium">{fmtRatio(retentionRatio)}</span>
                    </div>
                    <div className="w-full bg-[#1a1a3e] rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, retentionRatio * 100)}%`,
                          backgroundColor: condition?.color ?? '#ef4444',
                        }}
                      />
                    </div>
                    <p className="text-slate-600 text-xs mt-1">
                      신차가 최저 {fmtMk(msrpMin)} 기준
                    </p>
                  </div>
                )}

                {/* 데이터 신선도 */}
                {result.latestWeek && (
                  <div className="mt-3 pt-3 border-t border-[#1a1a3e] flex items-center gap-1.5">
                    <span className="text-emerald-500 text-xs">●</span>
                    <span className="text-slate-500 text-xs">엔카 {result.latestWeek} 실거래 기준</span>
                  </div>
                )}
              </div>
            )}

            {/* 연식별 시세 테이블 */}
            <div className="bg-[#12122a] border border-[#2a2a3e] rounded-2xl overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-[#1a1a3e]">
                <p className="text-white text-sm font-semibold">연식별 시세 비교</p>
                <p className="text-slate-500 text-xs mt-0.5">일반 주행거리(3~6만km) 기준</p>
              </div>
              <div className="divide-y divide-[#1a1a3e]">
                {availableYears.map((y) => {
                  const p   = result.prices![y];
                  const mid = p?.mid;
                  const ratio = mid && msrpMin ? mid / msrpMin : null;
                  const isSelected = year === y;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(y)}
                      className={[
                        'w-full px-5 py-3 flex items-center justify-between transition-colors text-left',
                        isSelected ? 'bg-red-500/5' : 'hover:bg-white/2',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected && (
                          <span className="text-red-400 text-xs">▶</span>
                        )}
                        {!isSelected && <span className="w-3" />}
                        <span className={['text-sm font-medium', isSelected ? 'text-white' : 'text-slate-300'].join(' ')}>
                          {y}년식
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-300 text-sm font-semibold">
                          {mid ? fmtMk(mid) : '–'}
                        </span>
                        {ratio !== null && (
                          <span className="text-slate-500 text-xs w-10 text-right">
                            {fmtRatio(ratio)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 매각 안내 + 리드 수집 */}
            <div className="bg-[#12122a] border border-red-900/40 rounded-2xl p-5">
              {leadSubmitted ? (
                <div className="text-center py-4">
                  <p className="text-red-400 text-3xl mb-2">✓</p>
                  <p className="text-white font-semibold">신청 완료!</p>
                  <p className="text-slate-400 text-sm mt-1">
                    빠른 시일 내 렌테일러 전문가가 연락드립니다.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-white font-semibold mb-1">이 가격에 실제로 팔 수 있을까요?</p>
                  <p className="text-slate-400 text-xs mb-4">
                    매각 채널·타이밍·상태에 따라 시세와 차이가 날 수 있습니다. 무료로 매각 전략을 안내드립니다.
                  </p>
                  <form onSubmit={submitLead} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="이름"
                      value={leadData.name}
                      onChange={(e) => setLeadData((d) => ({ ...d, name: e.target.value }))}
                      required
                      className="px-4 py-3 rounded-xl border border-[#2a2a3e] bg-[#0c0c1d] text-white text-sm focus:outline-none focus:border-red-500/60"
                    />
                    <input
                      type="tel"
                      placeholder="연락처"
                      value={leadData.phone}
                      onChange={(e) => setLeadData((d) => ({ ...d, phone: e.target.value }))}
                      required
                      className="px-4 py-3 rounded-xl border border-[#2a2a3e] bg-[#0c0c1d] text-white text-sm focus:outline-none focus:border-red-500/60"
                    />
                    {leadError && <p className="text-red-400 text-xs">{leadError}</p>}
                    <p className="text-slate-600 text-xs">개인정보는 매각 안내 목적으로만 사용됩니다.</p>
                    <button
                      type="submit"
                      disabled={leadSubmitting}
                      className="py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                      {leadSubmitting ? '전송 중…' : '무료 매각 전략 상담 신청 →'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </>
        )}

        {/* 하단 안내 */}
        <p className="text-slate-600 text-xs text-center mt-6 leading-relaxed">
          시세는 엔카 수집 데이터 기준이며 실제 거래 가격과 차이가 있을 수 있습니다.<br />
          차량 상태·옵션·지역에 따라 시세는 달라질 수 있습니다.
        </p>
      </div>
    </div>
  );
}
