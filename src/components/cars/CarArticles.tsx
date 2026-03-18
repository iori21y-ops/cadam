'use client';

import { memo, useState } from 'react';
import Image from 'next/image';

interface Article {
  id: string;
  title: string;
  linkUrl: string;
  thumbnailUrl: string | null;
  sourceType: string;
}

function getDisplayType(article: Article): 'shorts' | 'video' {
  if (article.linkUrl.includes('youtube.com/shorts/')) return 'shorts';
  return 'video';
}

function ArticleThumb({
  thumbnailUrl,
  title,
  isShorts,
}: {
  thumbnailUrl: string | null;
  title: string;
  isShorts: boolean;
}) {
  const [src, setSrc] = useState<string | null>(thumbnailUrl);

  if (!src) {
    return (
      <div className="w-full h-full bg-[#007AFF] flex items-center justify-center p-3">
        <p className="text-white text-xs font-bold line-clamp-4 leading-snug text-center">
          {title}
        </p>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={title}
      fill
      sizes={isShorts ? '120px' : '180px'}
      className="object-cover group-hover:scale-105 transition-transform duration-300"
      onError={() => {
        if (src.includes('maxresdefault')) {
          setSrc(src.replace('maxresdefault', 'hqdefault'));
        } else {
          setSrc(null);
        }
      }}
    />
  );
}

const ArticleCard = memo(function ArticleCard({ article }: { article: Article }) {
  const isShorts = getDisplayType(article) === 'shorts';
  return (
    <a
      href={article.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`shrink-0 flex flex-col rounded-2xl bg-white border border-[#E5E5EA] hover:border-[#007AFF] hover:shadow-md transition-all overflow-hidden group ${
        isShorts ? 'w-[120px]' : 'w-[180px]'
      }`}
    >
      <div className={`w-full overflow-hidden relative ${isShorts ? 'aspect-[9/16]' : 'aspect-video'}`}>
        <ArticleThumb thumbnailUrl={article.thumbnailUrl} title={article.title} isShorts={isShorts} />
      </div>
      <div className="p-2">
        <h3 className="text-[11px] font-semibold text-[#1D1D1F] line-clamp-2 leading-snug">
          {article.title}
        </h3>
      </div>
    </a>
  );
});

export const CarArticles = memo(function CarArticles({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="text-lg font-bold text-[#1D1D1F] mb-4 px-5">
        관련 정보
      </h2>
      <div className="overflow-x-auto">
        <div className="flex gap-3 px-5 pb-2" style={{ width: 'max-content' }}>
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
});
