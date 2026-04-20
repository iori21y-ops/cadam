'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import { YoutubeModal, extractYouTubeId } from '@/components/ui/YoutubeModal';

interface Article {
  id: string;
  title: string;
  linkUrl: string;
  thumbnailUrl: string | null;
  sourceType: string;
}

interface VehicleInfo {
  slug: string;
  brand: string;
  model: string;
  imageKey: string;
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
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
      <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-3">
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

const ArticleCard = memo(function ArticleCard({
  article,
  onYoutubeClick,
}: {
  article: Article;
  onYoutubeClick: (article: Article) => void;
}) {
  const isShorts = getDisplayType(article) === 'shorts';
  const cardClass = `shrink-0 flex flex-col rounded-2xl bg-white border border-accent hover:shadow-md transition-all overflow-hidden group ${isShorts ? 'w-[120px]' : 'w-[180px]'}`;

  const inner = (
    <>
      <div className={`w-full overflow-hidden relative ${isShorts ? 'aspect-[9/16]' : 'aspect-video'}`}>
        <ArticleThumb thumbnailUrl={article.thumbnailUrl} title={article.title} isShorts={isShorts} />
      </div>
      <div className="p-2.5">
        <h3 className="text-[11px] font-semibold text-text line-clamp-2 leading-snug">
          {article.title}
        </h3>
      </div>
    </>
  );

  if (isYouTubeUrl(article.linkUrl)) {
    return (
      <button onClick={() => onYoutubeClick(article)} className={`${cardClass} text-left`}>
        {inner}
      </button>
    );
  }

  return (
    <a href={article.linkUrl} target="_blank" rel="noopener noreferrer" className={cardClass}>
      {inner}
    </a>
  );
});

export const CarArticles = memo(function CarArticles({
  articles,
  vehicle,
}: {
  articles: Article[];
  vehicle?: VehicleInfo;
}) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [iframeSrc, setIframeSrc] = useState('');

  const handleYoutubeClick = (article: Article) => {
    const videoId = extractYouTubeId(article.linkUrl);
    setSelectedArticle(article);
    setIframeSrc(
      videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&mute=0`
        : ''
    );
  };

  const handleClose = () => {
    setSelectedArticle(null);
    setIframeSrc('');
  };

  if (articles.length === 0) return null;

  return (
    <>
      <section className="py-8">
        <h2 className="text-lg font-bold text-text mb-4 px-5">관련 정보</h2>
        <div className="overflow-x-auto">
          <div className="flex gap-3 px-5 pb-2" style={{ width: 'max-content' }}>
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onYoutubeClick={handleYoutubeClick}
              />
            ))}
          </div>
        </div>
      </section>

      {selectedArticle && (
        <YoutubeModal
          title={selectedArticle.title}
          iframeSrc={iframeSrc}
          onClose={handleClose}
          vehicle={vehicle}
        />
      )}
    </>
  );
});
