'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Footer } from '@/components/Footer';
import type { Vehicle } from '@/constants/vehicles';

export interface VehicleWithPrice extends Vehicle {
  isActive: boolean;
  displayOrder: number;
  price: { min: number; max: number } | null;
}

interface Props {
  vehicles: VehicleWithPrice[];
}

const BRAND_FILTERS = [
  { label: '인기차종', value: null },
  { label: '현대', value: '현대' },
  { label: '기아', value: '기아' },
  { label: '제네시스', value: '제네시스' },
  { label: 'KGM', value: 'KGM' },
  { label: '르노', value: '르노코리아' },
  { label: '테슬라', value: '테슬라' },
] as const;

// 장기렌트 판매순위 기준 인기차종 (1위~16위)
const POPULAR_SLUGS = [
  'avante',     // 1. 현대 아반떼
  'k5',         // 2. 기아 K5
  'tucson',     // 3. 현대 투싼
  'sportage',   // 4. 기아 스포티지
  'sorento',    // 5. 기아 쏘렌토
  'santafe',    // 6. 현대 싼타페
  'grandeur',   // 7. 현대 그랜저
  'carnival',   // 8. 기아 카니발
  'k8',         // 9. 기아 K8
  'palisade',   // 10. 현대 팰리세이드
  'ioniq5',     // 11. 현대 아이오닉5
  'ev6',        // 12. 기아 EV6
  'ioniq6',     // 13. 현대 아이오닉6
  'ev9',        // 14. 기아 EV9
  'torres',     // 15. KGM 토레스
  'qm6',        // 16. 르노 QM6
] as const;

const POPULAR_ORDER = new Map<string, number>(POPULAR_SLUGS.map((slug, i) => [slug, i]));

function formatMinPrice(min: number) {
  return `월 ${Math.round(min / 10000)}만원~`;
}

// "아반떼 (CN7)" → 본체 + 괄호 코드 분리
function ModelName({ name }: { name: string }) {
  const idx = name.indexOf(' (');
  if (idx === -1) return <>{name}</>;
  return (
    <>
      {name.slice(0, idx)}
      <span className="text-gray-400 font-normal">{name.slice(idx)}</span>
    </>
  );
}

export function HomeClient({ vehicles }: Props) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithPrice | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<'success' | 'duplicate' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const filtered = selectedBrand
    ? vehicles.filter((v) => v.brand === selectedBrand)
    : vehicles
        .filter((v) => POPULAR_ORDER.has(v.slug))
        .sort((a, b) => (POPULAR_ORDER.get(a.slug) ?? 99) - (POPULAR_ORDER.get(b.slug) ?? 99));

  function openSheet(vehicle: VehicleWithPrice) {
    setSelectedVehicle(vehicle);
    setIsSheetOpen(true);
    setSubmitResult(null);
    setName('');
    setPhone('');
    setAgreed(false);
    setErrorMsg('');
  }

  function closeSheet() {
    setIsSheetOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicle || !agreed) return;

    setLoading(true);
    setSubmitResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          privacyAgreed: true,
          contactMethod: 'phone',
          carBrand: selectedVehicle.brand,
          carModel: selectedVehicle.model,
          stepCompleted: 5,
        }),
      });

      if (res.ok) {
        setSubmitResult('success');
      } else if (res.status === 409) {
        setSubmitResult('duplicate');
      } else if (res.status === 429) {
        setErrorMsg('잠시 후 다시 시도해주세요.');
        setSubmitResult('error');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? '오류가 발생했습니다.');
        setSubmitResult('error');
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
      setSubmitResult('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <main className="pb-24 bg-background min-h-screen">
        {/* 헤더 카피 */}
        <div className="bg-primary text-white py-10">
          <div className="max-w-2xl mx-auto px-4">
            <p className="text-xs text-accent font-semibold mb-3 tracking-widest uppercase">RenTailor</p>
            <h1 className="text-2xl font-bold leading-snug">
              내 차에 맞는<br />최적의 장기렌트를<br />찾아보세요
            </h1>
            <p className="text-sm text-white/60 mt-3">
              차량을 선택하고 무료 견적을 신청하세요
            </p>
          </div>
        </div>

        {/* 브랜드 필터 */}
        <div className="sticky top-0 z-10 bg-background border-b border-border shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {BRAND_FILTERS.map((b) => (
              <button
                key={b.label}
                onClick={() => setSelectedBrand(b.value)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedBrand === b.value
                    ? 'bg-primary text-white'
                    : 'bg-surface-secondary text-text-sub hover:bg-border'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* 차량 그리드 */}
        <div className="max-w-2xl mx-auto px-4 py-5">
          <p className="text-xs text-text-muted mb-4">{filtered.length}개 차종</p>
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((vehicle, index) => (
              <button
                key={vehicle.slug}
                onClick={() => openSheet(vehicle)}
                className="text-left bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] overflow-hidden"
              >
                <div className="relative aspect-[4/3] bg-gray-50">
                  <Image
                    src={`/cars/${vehicle.imageKey}.webp`}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 640px) 50vw, 320px"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-text leading-snug line-clamp-2">
                    <ModelName name={vehicle.model} />
                  </p>
                  {vehicle.price ? (
                    <div
                      className="mt-2 flex items-baseline gap-0.5"
                      style={isMounted ? {
                        animation: `pricePopIn 0.4s ease-out ${index * 0.08}s both`,
                      } : undefined}
                    >
                      <span className="text-sm font-normal" style={{ color: '#9CA3AF' }}>월</span>
                      <span
                        className="text-3xl font-extrabold"
                        style={{ color: '#996515', letterSpacing: '-0.02em' }}
                      >
                        {Math.round(vehicle.price.min / 10000)}
                      </span>
                      <span className="text-sm font-normal" style={{ color: '#9CA3AF' }}>만원~</span>
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted mt-1.5">견적 문의</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      {/* 딤 오버레이 */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSheet}
      />

      {/* 하단 슬라이드 시트 */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out max-h-[85vh] flex flex-col ${
          isSheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* 핸들 바 — 항상 고정 */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {submitResult === 'success' ? (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <div className="max-w-2xl mx-auto py-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-xl font-bold text-text mb-2">신청이 완료됐습니다</p>
                <p className="text-sm text-text-sub mb-1">
                  <span className="font-medium">{selectedVehicle?.model}</span> 견적을 신청하셨습니다.
                </p>
                <p className="text-sm text-text-sub">빠른 시간 내에 연락드리겠습니다.</p>
              </div>
            </div>
            <div className="shrink-0 px-5 pt-3 pb-24 bg-white border-t border-border">
              <div className="max-w-2xl mx-auto">
                <button
                  onClick={closeSheet}
                  className="w-full py-4 bg-primary text-white rounded-xl font-semibold"
                >
                  닫기
                </button>
              </div>
            </div>
          </>
        ) : submitResult === 'duplicate' ? (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <div className="max-w-2xl mx-auto py-8 text-center">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-xl font-bold text-text mb-2">이미 신청하셨습니다</p>
                <p className="text-sm text-text-sub">
                  24시간 내 동일한 신청이 접수되어 있습니다.<br />
                  담당자가 곧 연락드릴 예정입니다.
                </p>
              </div>
            </div>
            <div className="shrink-0 px-5 pt-3 pb-24 bg-white border-t border-border">
              <div className="max-w-2xl mx-auto">
                <button
                  onClick={closeSheet}
                  className="w-full py-4 bg-primary text-white rounded-xl font-semibold"
                >
                  확인
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 스크롤 가능한 폼 내용 */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <div className="max-w-2xl mx-auto">
                {/* 선택 차종 표시 */}
                {selectedVehicle && (
                  <div className="flex items-center gap-3 py-4 border-b border-border mb-4">
                    <div className="relative w-20 h-12 shrink-0 bg-surface-secondary rounded-lg">
                      <Image
                        src={`/cars/${selectedVehicle.imageKey}.webp`}
                        alt={selectedVehicle.model}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-muted">{selectedVehicle.brand}</p>
                      <p className="font-semibold text-text leading-tight">{selectedVehicle.model}</p>
                      {selectedVehicle.price && (
                        <p className="text-xs text-accent font-medium mt-0.5">
                          {formatMinPrice(selectedVehicle.price.min)}
                        </p>
                      )}
                    </div>
                    <button onClick={closeSheet} className="text-text-muted text-xl shrink-0">✕</button>
                  </div>
                )}

                <p className="text-base font-bold text-text mb-4">무료 견적 신청</p>

                <form id="consultation-form" onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      이름 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="홍길동"
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      연락처 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="010-0000-0000"
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-primary shrink-0"
                    />
                    <span className="text-xs text-text-sub leading-relaxed">
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-primary font-medium">
                        개인정보 처리방침
                      </a>
                      에 동의합니다. (필수)
                    </span>
                  </label>
                </form>
              </div>
            </div>

            {/* 신청 버튼 — 항상 하단 고정 (탭바 위) */}
            <div className="shrink-0 px-5 pt-3 pb-24 bg-white border-t border-border">
              <div className="max-w-2xl mx-auto">
                {submitResult === 'error' && errorMsg && (
                  <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg mb-3">{errorMsg}</p>
                )}
                <button
                  type="submit"
                  form="consultation-form"
                  disabled={loading || !agreed || !name || !phone}
                  className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  {loading ? '처리 중...' : '무료 견적 신청하기'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
