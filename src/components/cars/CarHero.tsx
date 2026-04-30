'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Vehicle } from '@/constants/vehicles';
import { IconCarSedan } from '@/components/icons/RentailorIcons';
import { CarSpinViewer } from './CarSpinViewer';
import { GallerySlider } from './GallerySlider';

interface CarHeroProps {
  vehicle: Vehicle;
  galleryPath?: string | null;
  galleryCount?: number | null;
}

export function CarHero({ vehicle, galleryPath, galleryCount }: CarHeroProps) {
  const [imageError, setImageError] = useState(false);
  const [spinFailed, setSpinFailed] = useState(false);

  const showSpin = vehicle.has360Spin && !spinFailed;
  const showGallery = !showSpin && !!galleryPath && !!galleryCount && galleryCount > 0;

  return (
    <section>
      {/* 차량 이미지 영역 */}
      {showSpin ? (
        <CarSpinViewer slug={vehicle.slug} startFrame={vehicle.spinStartFrame ?? 0} frameCount={vehicle.frameCount ?? 61} onFailed={() => setSpinFailed(true)} />
      ) : showGallery ? (
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm">
          <GallerySlider path={galleryPath!} count={galleryCount!} />
        </div>
      ) : (
        <div className="mx-4 mt-4 relative aspect-[4/3] bg-white rounded-2xl overflow-hidden shadow-sm">
          {imageError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <IconCarSedan size={56} className="opacity-20 text-text-sub" />
              <span className="text-sm text-text-sub">이미지 준비 중</span>
            </div>
          ) : (
            <Image
              src={`/cars/${vehicle.imageKey}.webp`}
              alt={`${vehicle.brand} ${vehicle.model}`}
              fill
              sizes="(max-width:768px) 100vw, 480px"
              className="object-contain p-4"
              priority
              onError={() => setImageError(true)}
            />
          )}
        </div>
      )}

      {/* 모델명 + 배지 */}
      <div className="px-5 pt-4 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-text-sub font-medium">{vehicle.brand}</span>
        </div>
        <h1 className="text-[26px] font-extrabold text-text tracking-tight leading-tight">
          {vehicle.model}
        </h1>

        {/* 세그먼트 + 연료 태그 */}
        <div className="flex gap-1.5 mt-3">
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary">
            {vehicle.segment}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-600">
            {vehicle.fuel}
          </span>
        </div>
      </div>
    </section>
  );
}
