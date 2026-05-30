'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

interface Props {
  path: string;   // e.g. "car-360/genesis-gallery/g80" (bucket 포함)
  count: number;  // 7
}

export function GallerySlider({ path, count }: Props) {
  const [idx, setIdx] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const images = Array.from({ length: count }, (_, i) =>
    `${supabaseUrl}/storage/v1/object/public/${path}/${String(i + 1).padStart(2, '0')}.webp`,
  );

  function prev() { setIdx((i) => Math.max(i - 1, 0)); }
  function next() { setIdx((i) => Math.min(i + 1, count - 1)); }

  return (
    <div
      className="relative aspect-[4/3] bg-white overflow-hidden select-none"
      onTouchStart={(e) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        if (!touchStart.current) return;
        const dx = touchStart.current.x - e.changedTouches[0].clientX;
        const dy = touchStart.current.y - e.changedTouches[0].clientY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) next(); else prev();
        }
        touchStart.current = null;
      }}
    >
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="(max-width:768px) 100vw, 480px"
          className={`object-contain p-4 transition-opacity duration-200 ${i === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          priority={i === 0}
        />
      ))}

      {/* prev / next 버튼 */}
      {idx > 0 && (
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/10 text-gray-700 text-lg leading-none"
          aria-label="이전"
        >
          ‹
        </button>
      )}
      {idx < count - 1 && (
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/10 text-gray-700 text-lg leading-none"
          aria-label="다음"
        >
          ›
        </button>
      )}

    </div>
  );
}
