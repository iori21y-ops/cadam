'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CarImageFallbackProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
}

export function CarImageFallback({ src, alt, sizes = '140px', className = '' }: CarImageFallbackProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="text-3xl opacity-20">🚗</span>
        <span className="text-[10px] text-text-sub">이미지 준비 중</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setError(true)}
    />
  );
}
