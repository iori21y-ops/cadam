'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { getVehicleBySlug } from '@/constants/vehicles';
import type { InfoArticleShape } from '@/lib/wp-client';

function extractYouTubeId(url: string): string | null {
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

function ClipModal({ clip, onClose }: { clip: InfoArticleShape; onClose: () => void }) {
  const videoId = extractYouTubeId(clip.linkUrl);
  const vehicle = clip.vehicleSlug ? getVehicleBySlug(clip.vehicleSlug) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100">
          <p className="font-bold text-gray-900 text-sm leading-snug pr-3">{clip.title}</p>
          <button
            onClick={onClose}
            className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* YouTube 임베드 */}
        {videoId ? (
          <div className="aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
              className="w-full h-full"
              allow="autoplay; fullscreen; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 flex items-center justify-center">
            <p className="text-gray-400 text-sm">영상을 불러올 수 없습니다</p>
          </div>
        )}

        {/* 관련 차량 카드 */}
        {vehicle && (
          <div className="p-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">관련 차량</p>
            <Link
              href={`/cars/${vehicle.slug}`}
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-xl border border-accent bg-white hover:bg-gray-50 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/cars/${vehicle.imageKey}.webp`}
                alt={vehicle.model}
                className="w-16 h-12 object-contain shrink-0"
              />
              <div>
                <p className="text-[11px] text-gray-500">{vehicle.brand}</p>
                <p className="text-sm font-bold text-gray-900">{vehicle.model}</p>
                <p className="text-xs text-accent mt-0.5">장기렌트 견적 보기 →</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function ClipsCarousel({ clips }: { clips: InfoArticleShape[] }) {
  const [selected, setSelected] = useState<InfoArticleShape | null>(null);

  if (clips.length === 0) {
    return (
      <div className="px-5">
        <div className="rounded-2xl bg-gray-50 py-10 text-center">
          <p className="text-gray-400 text-sm">준비 중입니다</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-2">
        {clips.map((article) => (
          <button
            key={article.id}
            onClick={() => setSelected(article)}
            className="block group shrink-0 w-[260px] text-left"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-200">
              {article.thumbnailUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={article.thumbnailUrl}
                  alt={article.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: 'linear-gradient(135deg, #1C1C1E 0%, #3A3A3C 100%)' }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-gray-900 border-b-[8px] border-b-transparent ml-1" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <p className="text-white text-[13px] font-bold leading-snug line-clamp-2 drop-shadow">
                  {article.title}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <ClipModal clip={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
