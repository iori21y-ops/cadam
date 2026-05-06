'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageZoom({ src, alt, className }: ImageZoomProps) {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    document.body.dataset.modalOpen = '1';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      delete document.body.dataset.modalOpen;
    };
  }, [open, close]);

  return (
    <>
      {/* 썸네일 — 탭하면 모달 오픈 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={className}
        onClick={() => setOpen(true)}
        style={{ cursor: 'zoom-in' }}
        loading="eager"
      />

      {/* 풀스크린 모달 */}
      {open && (
        <div
          ref={overlayRef}
          onClick={(e) => { if (e.target === overlayRef.current) close(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'none',
          }}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={close}
            aria-label="닫기"
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: 'none', color: '#fff', fontSize: 22,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              zIndex: 1,
            }}
          >
            ✕
          </button>

          {/* 이미지 — 핀치 줌은 브라우저 네이티브 처리 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: '95vw',
              maxHeight: '95vh',
              objectFit: 'contain',
              borderRadius: 12,
              touchAction: 'pinch-zoom',
              userSelect: 'none',
            }}
            draggable={false}
          />
        </div>
      )}
    </>
  );
}
