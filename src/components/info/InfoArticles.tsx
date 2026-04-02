'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FilterPill } from '@/components/ui/FilterPill';

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  linkUrl: string;
  thumbnailUrl: string | null;
  sourceType: string;
  publishedAt: string | null;
  category: string;
  vehicleSlug: string | null;
}

function getDisplayType(article: Article): 'blog' | 'youtube' | 'shorts' {
  if (article.linkUrl.includes('youtube.com/shorts/')) return 'shorts';
  if (article.sourceType === 'youtube') return 'youtube';
  return 'blog';
}

const TYPE_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'blog', label: '블로그' },
  { value: 'shorts', label: '쇼츠' },
  { value: 'youtube', label: '영상' },
] as const;

type ContentType = typeof TYPE_FILTERS[number]['value'];

const TYPE_META: Record<'blog' | 'youtube' | 'shorts', { label: string; color: string }> = {
  blog: { label: '블로그', color: '#2563EB' },
  youtube: { label: '영상', color: '#FF3B30' },
  shorts: { label: '쇼츠', color: '#FF2D55' },
};

const ArticleSlide = memo(function ArticleSlide({
  article,
  index,
  total,
}: {
  article: Article;
  index: number;
  total: number;
}) {
  const type = getDisplayType(article);
  const meta = TYPE_META[type];

  return (
    <div className="h-full flex flex-col py-3">
      <a
        href={article.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 relative rounded-3xl overflow-hidden block min-h-0 group bg-[#1C1C1E]"
      >
        {/* 배경 이미지 또는 그라디언트 */}
        {article.thumbnailUrl ? (
          <img
            src={article.thumbnailUrl}
            alt={article.title}
            loading="lazy"
            className={`absolute inset-0 w-full h-full ${type === 'shorts' ? 'object-cover' : 'object-contain'}`}
            onError={(e) => {
              const el = e.currentTarget;
              if (el.src.includes('maxresdefault')) {
                el.src = el.src.replace('maxresdefault', 'hqdefault');
              }
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: type === 'blog'
                ? 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)'
                : 'linear-gradient(135deg, #FF3B30 0%, #FF9500 100%)',
            }}
          />
        )}

        {/* 어두운 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />

        {/* 타입 배지 + 카운터 */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
            style={{ backgroundColor: meta.color }}
          >
            {meta.label}
          </span>
          <span className="text-xs text-white/60 font-medium tabular-nums">
            {index + 1} / {total}
          </span>
        </div>

        {/* 영상 재생 버튼 */}
        {type !== 'blog' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/60 transition-colors">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* 하단 텍스트 */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-white font-bold text-base leading-snug mb-1.5 line-clamp-2 drop-shadow">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-white/65 text-sm line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}
        </div>
      </a>

      {/* 다음 컨텐츠 인디케이터 */}
      {index < total - 1 && (
        <div className="shrink-0 flex justify-center items-center gap-1 py-2 text-text-muted">
          <span className="text-[11px]">다음</span>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1.5l5 5 5-5" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
});

export function InfoArticles({
  initialArticles,
  categories = [],
}: {
  initialArticles?: Article[];
  categories?: { value: string; label: string }[];
}) {
  const [articles, setArticles] = useState<Article[]>(initialArticles ?? []);
  const [loading, setLoading] = useState(!initialArticles);
  const [selectedKeyword, setSelectedKeyword] = useState('all');
  const [selectedType, setSelectedType] = useState<ContentType>('all');
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialArticles) return;
    fetch('/api/info-articles')
      .then((r) => r.json())
      .then((d: { articles?: Article[] }) => {
        setArticles(d.articles ?? []);
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [initialArticles]);

  const categoryFilters = useMemo(() => [
    { value: 'all', label: '전체' },
    ...categories,
  ], [categories]);

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (selectedKeyword !== 'all') result = result.filter((a) => a.category === selectedKeyword);
    if (selectedType !== 'all') result = result.filter((a) => getDisplayType(a) === selectedType);
    return result;
  }, [articles, selectedKeyword, selectedType]);

  // 필터 변경 시 피드 맨 위로
  const resetFeed = useCallback(() => {
    if (feedRef.current) feedRef.current.scrollTo({ top: 0 });
  }, []);

  const handleKeyword = (v: string) => {
    setSelectedKeyword(v);
    resetFeed();
  };

  const handleType = (v: ContentType) => {
    setSelectedType(v);
    resetFeed();
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-surface-secondary pb-16">
      {/* 필터 */}
      <div className="shrink-0 w-full max-w-lg mx-auto px-5 pt-4 pb-3">
        {/* 카테고리 필터 (동적, 오른쪽 fade) */}
        <div className="relative mb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pr-6">
            {categoryFilters.map((f) => (
              <FilterPill
                key={f.value}
                active={selectedKeyword === f.value}
                onClick={() => handleKeyword(f.value)}
              >
                {f.label}
              </FilterPill>
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface-secondary to-transparent pointer-events-none" />
        </div>

        {/* 컨텐츠 타입 필터 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {TYPE_FILTERS.map((f) => (
            <FilterPill
              key={f.value}
              active={selectedType === f.value}
              onClick={() => handleType(f.value)}
            >
              {f.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* 피드 영역 */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="w-full max-w-lg text-center py-16 rounded-2xl bg-white border border-border-solid">
            <p className="text-text-sub">해당 콘텐츠가 없습니다</p>
            <p className="text-text-muted text-sm mt-1">다른 필터를 선택해보세요</p>
          </div>
        </div>
      ) : (
        <div
          ref={feedRef}
          className="flex-1 min-h-0 overflow-y-scroll snap-y snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {filteredArticles.map((article, idx) => (
            <div
              key={article.id}
              className="h-full snap-start flex items-stretch"
            >
              <div className="max-w-lg mx-auto w-full px-4">
                <ArticleSlide
                  article={article}
                  index={idx}
                  total={filteredArticles.length}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
