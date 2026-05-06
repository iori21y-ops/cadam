'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  prevSlug: string | null;
  prevTitle: string | null;
  nextSlug: string | null;
  nextTitle: string | null;
}

export function CardNavSwipe({ prevSlug, prevTitle, nextSlug, nextTitle }: Props) {
  const router = useRouter();
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (document.body.dataset.modalOpen) return;
      startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onEnd = (e: TouchEvent) => {
      if (!startRef.current) return;
      const dx = e.changedTouches[0].clientX - startRef.current.x;
      const dy = e.changedTouches[0].clientY - startRef.current.y;
      startRef.current = null;
      // 수평 스와이프만 인식 (수직 스크롤과 구분)
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx > 0 && prevSlug) router.push(`/blog/${prevSlug}`);
      else if (dx < 0 && nextSlug) router.push(`/blog/${nextSlug}`);
    };
    const onCancel = () => { startRef.current = null; };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onCancel);
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onCancel);
    };
  }, [prevSlug, nextSlug, router]);

  return (
    <nav className="mt-10 flex items-stretch gap-3 border-t border-gray-100 pt-6">
      {prevSlug ? (
        <Link
          href={`/blog/${prevSlug}`}
          className="flex-1 flex flex-col gap-1 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors p-4"
        >
          <span className="text-xs text-gray-400 font-medium">← 이전 카드뉴스</span>
          <span className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
            {prevTitle ?? '이전'}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {nextSlug ? (
        <Link
          href={`/blog/${nextSlug}`}
          className="flex-1 flex flex-col gap-1 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors p-4 text-right"
        >
          <span className="text-xs text-gray-400 font-medium">다음 카드뉴스 →</span>
          <span className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
            {nextTitle ?? '다음'}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}
