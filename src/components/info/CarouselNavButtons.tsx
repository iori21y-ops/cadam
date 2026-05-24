'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  onPrev: () => void;
  onNext: () => void;
  canPrev?: boolean;
  canNext?: boolean;
}

export function CarouselNavButtons({ onPrev, onNext, canPrev = true, canNext = true }: Props) {
  return (
    <div className="hidden md:block">
      <button
        onClick={onPrev}
        aria-label="이전"
        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 md:-translate-x-12 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg hover:bg-white border border-gray-200 flex items-center justify-center transition${!canPrev ? ' opacity-30 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <ChevronLeft size={18} className="text-gray-700" />
      </button>
      <button
        onClick={onNext}
        aria-label="다음"
        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 md:translate-x-12 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg hover:bg-white border border-gray-200 flex items-center justify-center transition${!canNext ? ' opacity-30 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <ChevronRight size={18} className="text-gray-700" />
      </button>
    </div>
  );
}
