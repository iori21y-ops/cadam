'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const FRAME_COUNT = 61;
const PX_PER_FRAME = 5;
const STORAGE_BASE =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-360`;

interface CarSpinViewerProps {
  slug: string;
  onFailed: () => void;
}

export function CarSpinViewer({ slug, onFailed }: CarSpinViewerProps) {
  const [firstSrc, setFirstSrc] = useState<string | null>(null); // 첫 프레임 즉시 표시용
  const [loadedCount, setLoadedCount] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const dragRef = useRef({ active: false, startX: 0, frameAtStart: 0 });

  const frameUrl = (i: number) =>
    `${STORAGE_BASE}/${slug}/${String(i + 1).padStart(3, '0')}.webp`;

  useEffect(() => {
    let cancelled = false;
    framesRef.current = [];
    setFirstSrc(null);
    setLoadedCount(0);
    setCurrentFrame(0);
    setShowHint(true);

    let loaded = 0;
    let firstFailed = false;

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new window.Image();
      img.src = frameUrl(i);
      img.onload = () => {
        if (cancelled) return;
        if (i === 0) setFirstSrc(img.src); // 첫 프레임 즉시 표시
        loaded++;
        setLoadedCount(loaded);
      };
      img.onerror = () => {
        if (!firstFailed) {
          firstFailed = true;
          onFailed();
        }
      };
      framesRef.current.push(img);
    }

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const allLoaded = loadedCount === FRAME_COUNT;
  const loadingPercent = Math.round((loadedCount / FRAME_COUNT) * 100);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!allLoaded) return;
      dragRef.current = { active: true, startX: e.clientX, frameAtStart: currentFrame };
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [allLoaded, currentFrame]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current.active || !allLoaded) return;
      if (showHint) setShowHint(false);
      const delta = e.clientX - dragRef.current.startX;
      const frameDelta = Math.round(delta / PX_PER_FRAME);
      const newFrame =
        ((dragRef.current.frameAtStart - frameDelta) % FRAME_COUNT + FRAME_COUNT) % FRAME_COUNT;
      setCurrentFrame(newFrame);
    },
    [allLoaded, showHint]
  );

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  return (
    <div
      className="mx-4 mt-4 relative aspect-[4/3] bg-white rounded-2xl overflow-hidden shadow-sm select-none"
      style={{ touchAction: 'none', cursor: allLoaded ? 'grab' : 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* 첫 프레임 로드 전: 가벼운 스켈레톤 */}
      {!firstSrc && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-2xl" />
      )}

      {/* 첫 프레임 로드 후: 즉시 이미지 표시 */}
      {firstSrc && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={allLoaded ? frameUrl(currentFrame) : firstSrc}
            alt="차량 360° 뷰"
            className="absolute inset-0 w-full h-full object-contain p-4 pointer-events-none"
            draggable={false}
          />

          {/* 나머지 로딩 중: 하단 프로그레스 바 */}
          {!allLoaded && (
            <div className="absolute bottom-0 left-0 right-0">
              <div
                className="h-0.5 bg-primary transition-all duration-200"
                style={{ width: `${loadingPercent}%` }}
              />
            </div>
          )}

          {/* 드래그 힌트 */}
          {allLoaded && showHint && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/25 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
              ← 드래그하여 회전 →
            </div>
          )}

          <div className="absolute top-2 right-3 text-[10px] text-text-sub/60 pointer-events-none">
            360°
          </div>
        </>
      )}
    </div>
  );
}
