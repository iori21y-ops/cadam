'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

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

type Section = 'article' | 'card-news';

function getDisplayType(article: Article): 'blog' | 'youtube' | 'shorts' {
  if (article.linkUrl.includes('youtube.com/shorts/')) return 'shorts';
  if (article.sourceType === 'youtube') return 'youtube';
  return 'blog';
}

function CardLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const isInternal = href.startsWith('/');
  if (isInternal) return <Link href={href} className={className}>{children}</Link>;
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
}

function HorizontalScroll({ articles, emptyMessage = '콘텐츠가 없습니다', titleMode = 'overlay', onActiveChange }: {
  articles: Article[];
  emptyMessage?: string;
  titleMode?: 'overlay' | 'below' | 'none';
  onActiveChange?: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !onActiveChange) return;
    const cardWidth = window.innerWidth * 0.9;
    const index = Math.round(el.scrollLeft / (cardWidth + 12));
    onActiveChange(Math.max(0, Math.min(index, articles.length - 1)));
  };

  if (articles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-5">
        <div className="text-center py-16">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-5 scroll-pl-5 pt-5 pb-8 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {articles.map((article) => (
          <CardLink
            key={article.id}
            href={article.linkUrl}
            className={titleMode === 'below' ? 'snap-start shrink-0 w-[90vw] flex flex-col' : 'snap-start shrink-0 w-[90vw]'}
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-md">
              {article.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.thumbnailUrl}
                  alt={article.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (el.src.includes('maxresdefault')) el.src = el.src.replace('maxresdefault', 'hqdefault');
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400 text-sm">RENTAILOR</span>
                </div>
              )}
              {titleMode === 'overlay' && (
                <>
                  <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-black/75 to-transparent pointer-events-none" />
                  <p className="absolute inset-x-0 top-0 px-4 pt-4 text-white text-base font-semibold line-clamp-2 leading-snug">
                    {article.title}
                  </p>
                </>
              )}
            </div>
            {titleMode === 'below' && (
              <p className="mt-3 text-lg font-semibold text-gray-900 line-clamp-2 leading-snug">
                {article.title}
              </p>
            )}
          </CardLink>
        ))}
        <div className="shrink-0 w-1" />
      </div>
    </div>
  );
}

function ContentTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap',
        active ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-900',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function InfoArticles({ initialArticles }: {
  initialArticles?: Article[];
}) {
  const [articles, setArticles] = useState<Article[]>(initialArticles ?? []);
  const [loading, setLoading] = useState(!initialArticles);
  const [section, setSection] = useState<Section>('article');
  const [activeIndex, setActiveIndex] = useState(0);

  // URL ?tab=card-news 파라미터로 초기 섹션 설정 (클립 탭에서 넘어올 때)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'card-news') setSection('card-news');
  }, []);

  // 탭 전환 시 활성 카드 인덱스 초기화
  useEffect(() => {
    setActiveIndex(0);
  }, [section]);

  useEffect(() => {
    if (initialArticles) return;
    fetch('/api/info-articles')
      .then((r) => r.json())
      .then((d: { articles?: Article[] }) => setArticles(d.articles ?? []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [initialArticles]);

  const filteredArticles = useMemo(() => {
    if (section === 'card-news') {
      return articles.filter((a) => getDisplayType(a) === 'blog' && a.category === 'card-news');
    }
    return articles.filter((a) => getDisplayType(a) === 'blog' && a.category !== 'card-news');
  }, [articles, section]);

  const activeTitle = filteredArticles[activeIndex]?.title;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white pb-24">
      {/* 이용정보 | 약관 비교 */}
      <div className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex max-w-lg mx-auto px-5">
          <Link href="/info" className="px-4 py-3 text-sm font-semibold border-b-2 -mb-px border-gray-900 text-gray-900 whitespace-nowrap">
            이용정보
          </Link>
          <Link href="/info/terms-comparison" className="px-4 py-3 text-sm font-semibold border-b-2 -mb-px border-transparent text-gray-400 hover:text-gray-900 transition-colors whitespace-nowrap">
            약관 비교
          </Link>
        </div>
      </div>

      {/* 아티클 | 클립 | 카드뉴스 */}
      <div className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex max-w-lg mx-auto px-5">
          <ContentTab active={section === 'article'} onClick={() => setSection('article')}>
            아티클
          </ContentTab>
          <Link
            href="/info/clips"
            className="px-4 py-3 text-sm font-semibold border-b-2 -mb-px border-transparent text-gray-400 hover:text-gray-900 transition-colors whitespace-nowrap"
          >
            클립
          </Link>
          <ContentTab active={section === 'card-news'} onClick={() => setSection('card-news')}>
            카드뉴스
          </ContentTab>
        </div>
      </div>

      {/* 타이틀 — 현재 보이는 카드 제목 */}
      <div className="max-w-lg mx-auto w-full px-5 pt-6 pb-2">
        <h1 className="text-xl font-bold text-gray-900 line-clamp-2 leading-snug">
          {activeTitle ?? (section === 'card-news' ? '렌테일러 카드뉴스' : '렌테일러 아티클')}
        </h1>
      </div>

      {/* 콘텐츠 — 가로 스크롤 카드 */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <HorizontalScroll
          articles={filteredArticles}
          emptyMessage={section === 'card-news' ? '카드뉴스가 없습니다' : '아티클이 없습니다'}
          titleMode={section === 'card-news' ? 'none' : 'overlay'}
          onActiveChange={setActiveIndex}
        />
      )}
    </div>
  );
}
