'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { YoutubeModal, extractYouTubeId } from '@/components/ui/YoutubeModal';
import { getVehicleBySlug } from '@/constants/vehicles';
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

function getDisplayType(article: Article): 'blog' | 'youtube' | 'shorts' {
  if (article.linkUrl.includes('youtube.com/shorts/')) return 'shorts';
  if (article.sourceType === 'youtube') return 'youtube';
  return 'blog';
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

export function InfoClips({ initialArticles, prices = {} }: {
  initialArticles?: Article[];
  prices?: Record<string, number>;
}) {
  const [articles, setArticles] = useState<Article[]>(initialArticles ?? []);
  const [loading, setLoading] = useState(!initialArticles);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedClip, setSelectedClip] = useState<Article | null>(null);
  const [iframeSrc, setIframeSrc] = useState('');

  const handleCardClick = (clip: Article) => {
    const videoId = extractYouTubeId(clip.linkUrl);
    setSelectedClip(clip);
    setIframeSrc(
      videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&mute=0`
        : ''
    );
  };

  const handleClose = () => {
    setSelectedClip(null);
    setIframeSrc('');
  };

  const selectedVehicleBase = selectedClip?.vehicleSlug
    ? getVehicleBySlug(selectedClip.vehicleSlug) ?? undefined
    : undefined;
  const selectedVehicle = selectedVehicleBase
    ? { ...selectedVehicleBase, minMonthly: selectedClip?.vehicleSlug ? prices[selectedClip.vehicleSlug] : undefined }
    : undefined;

  useEffect(() => {
    if (initialArticles) return;
    fetch('/api/info-articles')
      .then((r) => r.json())
      .then((d: { articles?: Article[] }) => setArticles(d.articles ?? []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [initialArticles]);

  const filteredClips = useMemo(() => {
    return articles.filter((a) => {
      const type = getDisplayType(a);
      return type === 'youtube' || type === 'shorts';
    });
  }, [articles]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white pb-24">
      {/* 통합 탭: 아티클 | 클립 | 카드뉴스 | 약관비교 */}
      <div className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex max-w-2xl mx-auto px-5">
          <Link href="/info" className="px-4 py-3 text-sm font-semibold border-b-2 -mb-px border-transparent text-gray-400 hover:text-gray-900 transition-colors whitespace-nowrap">아티클</Link>
          <span className="px-4 py-3 text-sm font-semibold border-b-2 -mb-px border-gray-900 text-gray-900 whitespace-nowrap">클립</span>
          <Link href="/info?tab=card-news" className="px-4 py-3 text-sm font-semibold border-b-2 -mb-px border-transparent text-gray-400 hover:text-gray-900 transition-colors whitespace-nowrap">카드뉴스</Link>
          <Link href="/info?tab=terms" className="px-4 py-3 text-sm font-semibold border-b-2 -mb-px border-transparent text-gray-400 hover:text-gray-900 transition-colors whitespace-nowrap">약관비교</Link>
        </div>
      </div>

      {/* 타이틀 — 현재 보이는 카드 제목 */}
      <div className="max-w-2xl mx-auto w-full px-5 pt-6 pb-2">
        <h1 className="text-xl font-bold text-gray-900 line-clamp-2 leading-snug">
          {filteredClips[activeIndex]?.title ?? '렌테일러 클립'}
        </h1>
      </div>

      {/* 콘텐츠 — 가로 스크롤 카드 */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ClipsHorizontal articles={filteredClips} onCardClick={handleCardClick} onActiveChange={setActiveIndex} />
      )}

      {selectedClip && (
        <YoutubeModal
          title={selectedClip.title}
          iframeSrc={iframeSrc}
          onClose={handleClose}
          vehicle={selectedVehicle}
        />
      )}
    </div>
  );
}
