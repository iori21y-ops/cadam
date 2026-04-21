'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

const FRAME_COUNT = 61;
const PX_PER_FRAME = 5;
const STORAGE_BASE =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-360`;

interface CarSpinViewerProps {
  slug: string;
  onFailed: () => void;
}

function drawContained(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
  const x = (cw - img.naturalWidth * scale) / 2;
  const y = (ch - img.naturalHeight * scale) / 2;
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
}

export function CarSpinViewer({ slug, onFailed }: CarSpinViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const dragRef = useRef({ active: false, startX: 0, frameAtStart: 0 });
  const currentFrameRef = useRef(0);

  const [firstLoaded, setFirstLoaded] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [showHint, setShowHint] = useState(true);

  const frameUrl = (i: number) =>
    `${STORAGE_BASE}/${slug}/${String(i + 1).padStart(3, '0')}.webp`;

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    if (!canvas || !img?.complete) return;
    const ctx = canvas.getContext('2d');
    if (ctx) drawContained(ctx, img);
  }, []);

  useEffect(() => {
    let cancelled = false;
    framesRef.current = [];
    currentFrameRef.current = 0;
    setFirstLoaded(false);
    setAllLoaded(false);
    setLoadedCount(0);
    setShowHint(true);

    let loaded = 0;
    let firstFailed = false;

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new window.Image();
      img.src = frameUrl(i);
      img.onload = () => {
        if (cancelled) return;
        if (i === 0) {
          setFirstLoaded(true);
          requestAnimationFrame(() => drawFrame(0));
        }
        loaded++;
        setLoadedCount(loaded);
        if (loaded === FRAME_COUNT) setAllLoaded(true);
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

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!allLoaded) return;
      dragRef.current = { active: true, startX: e.clientX, frameAtStart: currentFrameRef.current };
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [allLoaded]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current.active || !allLoaded) return;
      setShowHint(false);
      const delta = e.clientX - dragRef.current.startX;
      const frameDelta = Math.round(delta / PX_PER_FRAME);
      const newFrame =
        ((dragRef.current.frameAtStart - frameDelta) % FRAME_COUNT + FRAME_COUNT) % FRAME_COUNT;
      if (newFrame !== currentFrameRef.current) {
        currentFrameRef.current = newFrame;
        drawFrame(newFrame);
      }
    },
    [allLoaded, drawFrame]
  );

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  const loadingPercent = Math.round((loadedCount / FRAME_COUNT) * 100);

  return (
    <div
      className="mx-4 mt-4 relative aspect-[4/3] bg-white rounded-2xl overflow-hidden shadow-sm select-none"
      style={{ touchAction: 'none', cursor: allLoaded ? 'grab' : 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {!firstLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-2xl" />
      )}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full p-4"
        style={{ opacity: firstLoaded ? 1 : 0 }}
        width={800}
        height={600}
      />

      {firstLoaded && !allLoaded && (
        <div className="absolute bottom-0 left-0 right-0">
          <div
            className="h-0.5 bg-primary transition-all duration-200"
            style={{ width: `${loadingPercent}%` }}
          />
        </div>
      )}

      {allLoaded && showHint && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/25 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
          ← 드래그하여 회전 →
        </div>
      )}

      {firstLoaded && (
        <div className="absolute top-2 right-3 text-[10px] text-text-sub/60 pointer-events-none">
          360°
        </div>
      )}
    </div>
  );
}
