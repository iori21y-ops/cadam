'use client';

import { useState } from 'react';
import Image from 'next/image';

type Brand = '전체' | '현대' | '기아' | '제네시스' | '르노' | 'KGM' | '수입';

const BRAND_PREFIXES: Record<Exclude<Brand, '전체' | '수입'>, string> = {
  현대: 'hyundai-',
  기아: 'kia-',
  제네시스: 'genesis-',
  르노: 'renault-',
  KGM: 'kgm-',
};

const DOMESTIC_PREFIXES = Object.values(BRAND_PREFIXES);

function detectBrand(filename: string): Brand {
  for (const [brand, prefix] of Object.entries(BRAND_PREFIXES)) {
    if (filename.startsWith(prefix)) return brand as Brand;
  }
  return '수입';
}

export function ImageGrid({ files }: { files: string[] }) {
  const [activeBrand, setActiveBrand] = useState<Brand>('전체');
  const [modal, setModal] = useState<string | null>(null);

  const brands: Brand[] = ['전체', '현대', '기아', '제네시스', '르노', 'KGM', '수입'];

  const filtered = files.filter((f) => {
    if (activeBrand === '전체') return true;
    return detectBrand(f) === activeBrand;
  });

  const displayName = (f: string) => f.replace('-v2.webp', '');

  return (
    <>
      {/* 브랜드 필터 탭 */}
      <div className="flex gap-2 flex-wrap mb-6">
        {brands.map((b) => {
          const count = b === '전체'
            ? files.length
            : files.filter((f) => detectBrand(f) === b).length;
          return (
            <button
              key={b}
              onClick={() => setActiveBrand(b)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeBrand === b
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {b} <span className="opacity-60 text-xs">{count}</span>
            </button>
          );
        })}
      </div>

      {/* 이미지 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((file) => (
          <button
            key={file}
            onClick={() => setModal(file)}
            className="text-left group"
          >
            <div className="relative aspect-[4/3] bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
              <Image
                src={`/cars/${file}`}
                alt={displayName(file)}
                fill
                className="object-contain p-2"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-500 truncate px-0.5">
              {displayName(file)}
            </p>
          </button>
        ))}
      </div>

      {/* 확대 모달 */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-4 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3] bg-white">
              <Image
                src={`/cars/${modal}`}
                alt={displayName(modal)}
                fill
                className="object-contain p-4"
                sizes="500px"
              />
            </div>
            <p className="text-center text-sm text-gray-600 mt-2 font-mono">
              {displayName(modal)}
            </p>
            <button
              onClick={() => setModal(null)}
              className="mt-3 w-full py-2 rounded-xl bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
