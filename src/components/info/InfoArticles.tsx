'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { YoutubeModal, extractYouTubeId } from '@/components/ui/YoutubeModal';
import { getVehicleBySlug } from '@/constants/vehicles';
import { TermsComparisonTable } from '@/components/info/TermsComparisonTable';
import { TermsComparisonCards } from '@/components/info/TermsComparisonCards';
import { CarouselNavButtons } from '@/components/info/CarouselNavButtons';

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

type Section = 'article' | 'clip' | 'card-news' | 'terms';

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

function HorizontalScroll({ articles, emptyMessage = '콘텐츠가 없습니다', onActiveChange, aspectClass = 'aspect-video', objectClass = 'object-cover' }: {
  articles: Article[];
  emptyMessage?: string;
  onActiveChange?: (index: number) => void;
  aspectClass?: string;
  objectClass?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = Math.min(window.innerWidth * 0.9, 632);
    const clamped = Math.max(0, Math.min(Math.round(el.scrollLeft / (cardWidth + 12)), articles.length - 1));
    setActiveIdx(clamped);
    onActiveChange?.(clamped);
  };

  const goTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft - 20, behavior: 'smooth' });
    setActiveIdx(index);
    onActiveChange?.(index);
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
    <div className="flex-1 min-h-0 max-w-2xl mx-auto w-full">
      <div className="relative">
        {articles.length > 1 && (
          <CarouselNavButtons
            onPrev={() => goTo(activeIdx - 1)}
            onNext={() => goTo(activeIdx + 1)}
            canPrev={activeIdx > 0}
            canNext={activeIdx < articles.length - 1}
          />
        )}
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
              className="snap-start shrink-0 w-[min(90vw,632px)]"
            >
              <div className={`${aspectClass} rounded-2xl overflow-hidden bg-gray-100 shadow-md`}>
                {article.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.thumbnailUrl}
                    alt={article.title}
                    loading="lazy"
                    className={`w-full h-full ${objectClass}`}
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
              </div>
            </CardLink>
          ))}
          <div className="shrink-0 w-1" />
        </div>
      </div>
    </div>
  );
}

function ClipsHorizontal({ articles, onCardClick, onActiveChange }: {
  articles: Article[];
  onCardClick: (article: Article) => void;
  onActiveChange?: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = Math.min(window.innerWidth * 0.9, 632);
    const clamped = Math.max(0, Math.min(Math.round(el.scrollLeft / (cardWidth + 12)), articles.length - 1));
    setActiveIdx(clamped);
    onActiveChange?.(clamped);
  };

  const goTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft - 20, behavior: 'smooth' });
    setActiveIdx(index);
    onActiveChange?.(index);
  };

  if (articles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-5">
        <div className="text-center py-16">
          <p className="text-gray-500">클립이 없습니다</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 min-h-0 max-w-2xl mx-auto w-full">
      <div className="relative">
        {articles.length > 1 && (
          <CarouselNavButtons
            onPrev={() => goTo(activeIdx - 1)}
            onNext={() => goTo(activeIdx + 1)}
            canPrev={activeIdx > 0}
            canNext={activeIdx < articles.length - 1}
          />
        )}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-5 scroll-pl-5 pt-5 pb-8 scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {articles.map((article) => (
            <button
              key={article.id}
              onClick={() => onCardClick(article)}
              className="snap-start shrink-0 w-[min(90vw,632px)] text-left"
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 shadow-md">
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
                  <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #FF3B30 0%, #FF9500 100%)' }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
              </div>
            </button>
          ))}
          <div className="shrink-0 w-1" />
        </div>
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

export function InfoArticles({ initialArticles, prices = {} }: {
  initialArticles?: Article[];
  prices?: Record<string, number>;
}) {
  const [articles, setArticles] = useState<Article[]>(initialArticles ?? []);
  const [loading, setLoading] = useState(!initialArticles);
  const [section, setSection] = useState<Section>('article');
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedClip, setSelectedClip] = useState<Article | null>(null);
  const [iframeSrc, setIframeSrc] = useState('');

  // URL params로 초기 섹션 설정
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'card-news') setSection('card-news');
    else if (tab === 'clip') setSection('clip');
    else if (tab === 'terms') setSection('terms');
  }, []);

  // 탭 전환 시 카드 인덱스 초기화
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

  const filteredClips = useMemo(() => {
    return articles.filter((a) => {
      const type = getDisplayType(a);
      return type === 'youtube' || type === 'shorts';
    });
  }, [articles]);

  const handleClipClick = (clip: Article) => {
    const videoId = extractYouTubeId(clip.linkUrl);
    setSelectedClip(clip);
    setIframeSrc(videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&mute=0` : '');
  };

  const handleClipClose = () => {
    setSelectedClip(null);
    setIframeSrc('');
  };

  const selectedVehicleBase = selectedClip?.vehicleSlug
    ? getVehicleBySlug(selectedClip.vehicleSlug) ?? undefined
    : undefined;
  const selectedVehicle = selectedVehicleBase
    ? { ...selectedVehicleBase, minMonthly: selectedClip?.vehicleSlug ? prices[selectedClip.vehicleSlug] : undefined }
    : undefined;

  const activeTitle = section === 'clip'
    ? filteredClips[activeIndex]?.title
    : filteredArticles[activeIndex]?.title;

  const defaultTitle =
    section === 'card-news' ? '렌테일러 카드뉴스' :
    section === 'clip' ? '렌테일러 클립' :
    '렌테일러 아티클';

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white pb-24">
      {/* 통합 탭: 아티클 | 클립 | 카드뉴스 | 약관비교 */}
      <div className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex max-w-2xl mx-auto px-5">
          <ContentTab active={section === 'article'} onClick={() => setSection('article')}>아티클</ContentTab>
          <ContentTab active={section === 'clip'} onClick={() => setSection('clip')}>클립</ContentTab>
          <ContentTab active={section === 'card-news'} onClick={() => setSection('card-news')}>카드뉴스</ContentTab>
          <ContentTab active={section === 'terms'} onClick={() => setSection('terms')}>약관비교</ContentTab>
        </div>
      </div>

      {section === 'terms' ? (
        <TermsComparisonCards />
      ) : (
        <>
          {/* 타이틀 — 현재 보이는 카드 제목 */}
          <div className="max-w-2xl mx-auto w-full px-5 pt-6 pb-2">
            <h1 className="text-xl font-bold text-gray-900 line-clamp-2 leading-snug">
              {activeTitle ?? defaultTitle}
            </h1>
          </div>

          {/* 콘텐츠 */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : section === 'clip' ? (
            <ClipsHorizontal
              articles={filteredClips}
              onCardClick={handleClipClick}
              onActiveChange={setActiveIndex}
            />
          ) : (
            <HorizontalScroll
              articles={filteredArticles}
              emptyMessage={section === 'card-news' ? '카드뉴스가 없습니다' : '아티클이 없습니다'}
              onActiveChange={setActiveIndex}
              aspectClass={section === 'card-news' ? 'aspect-[4/5]' : 'aspect-video'}
              objectClass={section === 'card-news' ? 'object-contain' : 'object-cover'}
            />
          )}

          {selectedClip && (
            <YoutubeModal
              title={selectedClip.title}
              iframeSrc={iframeSrc}
              onClose={handleClipClose}
              vehicle={selectedVehicle}
            />
          )}
        </>
      )}
    </div>
  );
}
