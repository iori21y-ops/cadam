'use client';

import { useState, useCallback } from 'react';

type Brand = '전체' | '현대' | '기아' | '제네시스' | '르노' | 'KGM' | '수입';

interface VehicleInfo {
  slug: string;
  has360Spin: boolean;
  frameCount: number;
  spinStartFrame: number;
  dbSpinStartFrame: number | null;
  model: string;
}

interface Props {
  files: string[];
  vehicleMap: Record<string, VehicleInfo>;
}

const BRAND_PREFIXES: Record<Exclude<Brand, '전체' | '수입'>, string> = {
  현대: 'hyundai-',
  기아: 'kia-',
  제네시스: 'genesis-',
  르노: 'renault-',
  KGM: 'kgm-',
};

function detectBrand(filename: string): Brand {
  for (const [brand, prefix] of Object.entries(BRAND_PREFIXES)) {
    if (filename.startsWith(prefix)) return brand as Brand;
  }
  return '수입';
}

function imageKeyFromFile(f: string) {
  return f.replace('.webp', '');
}

function displayName(f: string) {
  return f.replace('-v2.webp', '');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

function frameUrl(slug: string, frameIndex: number) {
  const padded = String(frameIndex + 1).padStart(3, '0');
  return `${SUPABASE_URL}/storage/v1/object/public/car-360/${slug}/${padded}.webp`;
}

type ApplyStatus = 'idle' | 'loading' | 'ok' | 'error';

export function ImageGrid({ files, vehicleMap }: Props) {
  const [activeBrand, setActiveBrand] = useState<Brand>('전체');
  const [modal, setModal] = useState<string | null>(null);

  // 공유 상태: 프레임 그리드에서 선택한 프레임 (두 섹션 모두 이 값 사용)
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);
  const [widthRatio, setWidthRatio] = useState(72);
  const [vPosition, setVPosition] = useState(55);

  // 섹션 1: 대표 이미지 재생성 상태
  const [applyStatus, setApplyStatus] = useState<ApplyStatus>('idle');
  const [imageVersions, setImageVersions] = useState<Record<string, number>>({});
  const [applyMsg, setApplyMsg] = useState('');

  // 섹션 2: 시작 프레임 저장 상태
  const [savedSpinFrame, setSavedSpinFrame] = useState<number | null>(null);
  const [spinSaveStatus, setSpinSaveStatus] = useState<ApplyStatus>('idle');
  const [spinSaveMsg, setSpinSaveMsg] = useState('');

  const brands: Brand[] = ['전체', '현대', '기아', '제네시스', '르노', 'KGM', '수입'];

  const filtered = files.filter((f) =>
    activeBrand === '전체' ? true : detectBrand(f) === activeBrand
  );

  const openModal = useCallback((file: string) => {
    const info = vehicleMap[imageKeyFromFile(file)];
    setModal(file);
    const dbFrame = info?.dbSpinStartFrame ?? null;
    const initFrame = dbFrame ?? info?.spinStartFrame ?? null;
    setSelectedFrame(initFrame);
    setSavedSpinFrame(dbFrame);
    setWidthRatio(72);
    setVPosition(55);
    setApplyStatus('idle');
    setApplyMsg('');
    setSpinSaveStatus('idle');
    setSpinSaveMsg('');
  }, [vehicleMap]);

  const closeModal = () => setModal(null);

  // 섹션 1: 대표 이미지 재생성·적용
  const handleApply = async () => {
    if (!modal) return;
    const imageKey = imageKeyFromFile(modal);
    const info = vehicleMap[imageKey];
    setApplyStatus('loading');
    setApplyMsg('');
    try {
      const body: Record<string, unknown> = { imageKey, widthRatio, vPosition };
      if (info?.has360Spin && selectedFrame !== null) {
        body.frameIndex = selectedFrame;
        body.slug = info.slug;
      }
      const res = await fetch('/api/admin/update-car-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setApplyStatus('error');
        setApplyMsg(json.error ?? '오류 발생');
      } else {
        setApplyStatus('ok');
        setApplyMsg('저장 완료');
        setImageVersions((prev) => ({ ...prev, [imageKey]: Date.now() }));
      }
    } catch (e) {
      setApplyStatus('error');
      setApplyMsg(String(e));
    }
  };

  // 섹션 2: 360° 시작 프레임 DB 저장
  const handleSaveSpinFrame = async () => {
    console.log('[spin-frame] 버튼 클릭 — modal:', modal, 'selectedFrame:', selectedFrame);
    if (!modal || selectedFrame === null) {
      console.warn('[spin-frame] 조기 반환 — modal 또는 selectedFrame 없음');
      return;
    }
    const info = vehicleMap[imageKeyFromFile(modal)];
    if (!info?.has360Spin || !info.slug) {
      console.warn('[spin-frame] 조기 반환 — has360Spin 없거나 slug 없음', info);
      return;
    }

    console.log('[spin-frame] API 호출 →', { slug: info.slug, spinStartFrame: selectedFrame });
    setSpinSaveStatus('loading');
    setSpinSaveMsg('');
    try {
      const res = await fetch('/api/admin/update-spin-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: info.slug, spinStartFrame: selectedFrame }),
      });
      const json = await res.json();
      console.log('[spin-frame] API 응답 —', res.status, json);
      if (!res.ok) {
        setSpinSaveStatus('error');
        setSpinSaveMsg(json.error ?? '오류 발생');
      } else {
        setSpinSaveStatus('ok');
        setSpinSaveMsg(`#${String(selectedFrame + 1).padStart(3, '0')} 저장 완료`);
        setSavedSpinFrame(selectedFrame);
      }
    } catch (e) {
      console.error('[spin-frame] fetch 예외:', e);
      setSpinSaveStatus('error');
      setSpinSaveMsg(String(e));
    }
  };

  const modalInfo = modal ? vehicleMap[imageKeyFromFile(modal)] : null;
  const frameCount = modalInfo?.frameCount ?? 61;

  const previewSrc =
    modal && modalInfo?.has360Spin && selectedFrame !== null
      ? frameUrl(modalInfo.slug, selectedFrame)
      : modal
      ? `/cars/${modal}`
      : null;

  const previewLabel =
    modalInfo?.has360Spin && selectedFrame !== null
      ? `프레임 #${String(selectedFrame + 1).padStart(3, '0')}`
      : '현재 이미지';

  const canSaveSpinFrame =
    modalInfo?.has360Spin &&
    selectedFrame !== null &&
    selectedFrame !== savedSpinFrame &&
    spinSaveStatus !== 'loading';

  return (
    <>
      {/* 브랜드 필터 탭 */}
      <div className="flex gap-2 flex-wrap mb-6">
        {brands.map((b) => {
          const count = b === '전체' ? files.length : files.filter((f) => detectBrand(f) === b).length;
          return (
            <button
              key={b}
              onClick={() => setActiveBrand(b)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeBrand === b ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {b} <span className="opacity-60 text-xs">{count}</span>
            </button>
          );
        })}
      </div>

      {/* 이미지 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((file) => (
          <button key={file} onClick={() => openModal(file)} className="text-left group">
            <div className="aspect-[4/3] bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/cars/${file}${imageVersions[imageKeyFromFile(file)] ? `?t=${imageVersions[imageKeyFromFile(file)]}` : ''}`}
                alt={displayName(file)}
                className="object-contain p-2 w-full h-full"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-500 truncate px-0.5">{displayName(file)}</p>
          </button>
        ))}
      </div>

      {/* 모달 */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-900">{modalInfo?.model ?? displayName(modal)}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{imageKeyFromFile(modal)}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="p-5 space-y-6">

              {/* ─── 미리보기 ─── */}
              <div className="relative aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                {previewSrc && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={previewSrc}
                    src={previewSrc}
                    alt={displayName(modal)}
                    style={{
                      position: 'absolute',
                      width: `${widthRatio}%`,
                      height: 'auto',
                      left: '50%',
                      top: `${vPosition}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}
                <span className="absolute top-2 left-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full">
                  {previewLabel}
                </span>
                {savedSpinFrame !== null && selectedFrame === savedSpinFrame && (
                  <span className="absolute top-2 right-2 text-[10px] bg-green-600/80 text-white px-2 py-0.5 rounded-full">
                    저장된 시작 프레임
                  </span>
                )}
              </div>

              {/* ─── 섹션 1: 대표 이미지 설정 ─── */}
              <div className="space-y-4">
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-800 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  대표 이미지 설정
                </p>

                {/* 360° 프레임 선택 그리드 */}
                {modalInfo?.has360Spin ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      썸네일로 사용할 프레임을 선택하세요.
                      {selectedFrame !== null && (
                        <span className="ml-1 font-mono text-blue-600">
                          #{String(selectedFrame + 1).padStart(3, '0')} / {frameCount}
                        </span>
                      )}
                    </p>
                    <div className="grid grid-cols-8 gap-1 max-h-56 overflow-y-auto rounded-xl border border-gray-100 p-2 bg-gray-50">
                      {Array.from({ length: frameCount }, (_, i) => {
                        const isSelected = selectedFrame === i;
                        const isSaved = savedSpinFrame === i;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedFrame(i)}
                            className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                              isSelected && isSaved
                                ? 'border-green-500 shadow-md scale-105'
                                : isSelected
                                ? 'border-blue-500 shadow-md scale-105'
                                : isSaved
                                ? 'border-green-400'
                                : 'border-transparent hover:border-gray-300'
                            }`}
                            title={`프레임 ${i + 1}${isSaved ? ' ★시작프레임' : ''}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={frameUrl(modalInfo.slug, i)}
                              alt={`frame ${i + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] bg-black/40 text-white leading-tight py-0.5">
                              {String(i + 1).padStart(3, '0')}
                            </span>
                            {isSaved && (
                              <span className="absolute top-0.5 right-0.5 text-[7px] bg-green-600 text-white rounded-sm px-0.5 leading-tight">S</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
                    360 스핀 없음 — 백업 파일에서 크기·위치만 조정합니다.
                  </p>
                )}

                {/* 슬라이더 */}
                <div className="space-y-3">
                  <div>
                    <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                      <span>가로 비율 (차량 크기)</span>
                      <span className="text-blue-600 font-mono">{widthRatio}%</span>
                    </label>
                    <input
                      type="range" min={50} max={90} value={widthRatio}
                      onChange={(e) => setWidthRatio(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>50% (작게)</span><span>72% (현재)</span><span>90% (크게)</span>
                    </div>
                  </div>
                  <div>
                    <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                      <span>세로 위치 (차량 높이)</span>
                      <span className="text-blue-600 font-mono">{vPosition}%</span>
                    </label>
                    <input
                      type="range" min={40} max={70} value={vPosition}
                      onChange={(e) => setVPosition(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>40% (위쪽)</span><span>55% (현재)</span><span>70% (아래쪽)</span>
                    </div>
                  </div>
                </div>

                {/* 이미지 재생성·적용 버튼 */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleApply}
                    disabled={applyStatus === 'loading'}
                    className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {applyStatus === 'loading' ? '처리 중...' : '이미지 재생성 · 적용'}
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-5 py-2.5 rounded-xl bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    닫기
                  </button>
                </div>
                {applyMsg && (
                  <p className={`text-xs text-center ${applyStatus === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
                    {applyMsg}
                  </p>
                )}
              </div>

              {/* ─── 섹션 2: 360° 시작 프레임 설정 (360 차종만) ─── */}
              {modalInfo?.has360Spin && (
                <>
                  <hr className="border-gray-100" />
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                      360° 시작 프레임 설정
                    </p>
                    <p className="text-xs text-gray-500">
                      차량 상세 페이지 360° 뷰어가 처음 보여줄 프레임입니다. 위 그리드에서 프레임을 선택한 뒤 저장하세요.
                    </p>

                    <div className="flex items-center justify-between text-xs bg-gray-50 rounded-xl px-4 py-2.5">
                      <span className="text-gray-500">선택 중인 프레임</span>
                      <span className="font-mono font-semibold text-blue-600">
                        {selectedFrame !== null ? `#${String(selectedFrame + 1).padStart(3, '0')}` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs bg-green-50 rounded-xl px-4 py-2.5">
                      <span className="text-gray-500">현재 저장된 시작 프레임</span>
                      <span className="font-mono font-semibold text-green-700">
                        {savedSpinFrame !== null ? `#${String(savedSpinFrame + 1).padStart(3, '0')}` : '미설정 (기본값 사용)'}
                      </span>
                    </div>

                    <button
                      onClick={handleSaveSpinFrame}
                      disabled={!canSaveSpinFrame}
                      className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        canSaveSpinFrame
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {spinSaveStatus === 'loading'
                        ? '저장 중...'
                        : selectedFrame === savedSpinFrame
                        ? '이미 저장된 시작 프레임입니다'
                        : `#${String((selectedFrame ?? 0) + 1).padStart(3, '0')} 을 시작 프레임으로 저장`}
                    </button>
                    {spinSaveMsg && (
                      <p className={`text-xs text-center ${spinSaveStatus === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
                        {spinSaveMsg}
                      </p>
                    )}
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
