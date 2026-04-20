'use client';

import { useState } from 'react';
import { getVehicleBySlug } from '@/constants/vehicles';
import { YoutubeModal, extractYouTubeId } from '@/components/ui/YoutubeModal';
import type { InfoArticleShape } from '@/lib/wp-client';

export function ClipsCarousel({ clips }: { clips: InfoArticleShape[] }) {
  const [selected, setSelected] = useState<InfoArticleShape | null>(null);
  const [iframeSrc, setIframeSrc] = useState('');

  const handleCardClick = (clip: InfoArticleShape) => {
    const videoId = extractYouTubeId(clip.linkUrl);
    setSelected(clip);
    setIframeSrc(
      videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&mute=0`
        : ''
    );
  };

  const handleClose = () => {
    setSelected(null);
    setIframeSrc('');
  };

  if (clips.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-5">
        <div className="rounded-2xl bg-gray-50 py-10 text-center">
          <p className="text-gray-400 text-sm">준비 중입니다</p>
        </div>
      </div>
    );
  }

  const selectedVehicle = selected?.vehicleSlug
    ? getVehicleBySlug(selected.vehicleSlug) ?? undefined
    : undefined;

  return (
    <>
      <div className="max-w-lg mx-auto">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-5 pb-2">
          {clips.map((article) => (
            <button
              key={article.id}
              onClick={() => handleCardClick(article)}
              className="block group shrink-0 snap-start w-[160px] text-left"
            >
              <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-gray-200">
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
      </div>

      {selected && (
        <YoutubeModal
          title={selected.title}
          iframeSrc={iframeSrc}
          onClose={handleClose}
          vehicle={selectedVehicle}
        />
      )}
    </>
  );
}
