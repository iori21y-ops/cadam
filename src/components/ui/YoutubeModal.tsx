'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/shorts\/([^?&#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

interface VehicleInfo {
  slug: string;
  brand: string;
  model: string;
  imageKey: string;
  minMonthly?: number;
}

interface YoutubeModalProps {
  title: string;
  iframeSrc: string;
  onClose: () => void;
  vehicle?: VehicleInfo;
}

export function YoutubeModal({ title, iframeSrc, onClose, vehicle }: YoutubeModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black h-[100dvh]"
      onClick={onClose}
    >
      <div
        className="relative h-[90dvh] aspect-[9/16] overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {iframeSrc ? (
          <iframe
            src={iframeSrc}
            className="w-full h-full"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <p className="text-gray-400 text-sm">영상을 불러올 수 없습니다</p>
          </div>
        )}

        {/* 상단 오버레이: 제목 + X버튼 */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
          <p className="text-white text-sm font-bold leading-snug pr-3 drop-shadow">{title}</p>
          <button
            onClick={onClose}
            className="shrink-0 text-white/80 hover:text-white transition-colors"
            aria-label="닫기"
          >
            <X className="w-6 h-6 drop-shadow" />
          </button>
        </div>

        {/* 하단 오버레이: 관련 차량 링크 */}
        {vehicle && (
          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white/60 text-xs mb-2">관련 차량</p>
            <Link
              href={`/cars/${vehicle.slug}`}
              onClick={onClose}
              className="vehicle-card-gold flex items-center gap-3 p-3 rounded-xl bg-white hover:bg-gray-50 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/cars/${vehicle.imageKey}.webp`}
                alt={vehicle.model}
                className="w-24 h-16 object-contain shrink-0"
              />
              <div className="flex-1 min-w-0 flex items-start gap-2">
                <p
                  className={`text-gray-900 font-bold leading-snug flex-1 min-w-0 ${vehicle.model.length > 8 ? 'text-xs' : 'text-sm'}`}
                  style={{ wordBreak: 'keep-all' }}
                >
                  {vehicle.model}
                </p>
                <div className="shrink-0 flex flex-col items-end leading-none">
                  {vehicle.minMonthly ? (
                    <p className="text-[#C9A84C] text-xl font-extrabold">
                      월 {vehicle.minMonthly.toLocaleString()}만원~
                    </p>
                  ) : (
                    <p className="text-[#C9A84C] text-sm font-bold">가격 문의</p>
                  )}
                  <p className="text-[#C9A84C] text-[11px] font-bold mt-1.5 opacity-80">견적 문의 →</p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
