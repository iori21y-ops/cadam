'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { YoutubeModal, extractYouTubeId } from '@/components/ui/YoutubeModal';
import { getVehicleBySlug } from '@/constants/vehicles';
import { CarouselNavButtons } from '@/components/info/CarouselNavButtons';
import { InfoSectionNav } from '@/components/info/InfoSectionNav';
import { Container } from '@/components/Container';

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

function CardLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const isInternal = href.startsWith('/');
  if (isInternal) return <Link href={href} className={className}>{children}</Link>;
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
}

function HorizontalScroll({ articles, emptyMessage = '콘텐츠가 없습니다', onActiveChange, aspectClass = 'aspect-video', objectClass = 'object-cover', showTitleOverlay = false, multiCol = false }: {
  articles: Article[];
  emptyMessage?: string;
  onActiveChange?: (index: number) => void;
  aspectClass?: string;
  objectClass?: string;
  showTitleOverlay?: boolean;
  multiCol?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = (el.children[0] as HTMLElement | undefined)?.offsetWidth ?? Math.min(window.innerWidth * 0.9, 632);
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
      <div className="flex items-center justify-center px-5">
        <div className="text-center py-12">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto w-full">
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
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-5 scroll-pl-5 pt-3 pb-6 scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {articles.map((article) => (
            <CardLink
              key={article.id}
              href={article.linkUrl}
              className={multiCol ? 'snap-start shrink-0 w-[min(90vw,632px)] md:w-[calc(50%-6px)] lg:w-[calc(50%-6px)]' : 'snap-start shrink-0 w-[min(90vw,632px)]'}
            >
              <div className={`${aspectClass} rounded-2xl overflow-hidden bg-gray-100 shadow-md relative`}>
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
                {showTitleOverlay && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                      <p className="text-white font-semibold text-lg md:text-xl line-clamp-2">{article.title}</p>
                    </div>
                  </>
                )}
              </div>
            </CardLink>
          ))}
          <div className="shrink-0 w-1" />
        </div>
      </div>
      {articles.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-4">
          {articles.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`${i + 1}번째 항목`}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIdx ? 'bg-primary w-4' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      )}
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
      <div className="flex items-center justify-center px-5">
        <div className="text-center py-12">
          <p className="text-gray-500">클립이 없습니다</p>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto w-full">
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
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-5 scroll-pl-5 pt-3 pb-6 scrollbar-hide"
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
      {articles.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-4">
          {articles.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`${i + 1}번째 항목`}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIdx ? 'bg-primary w-4' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionSpinner() {
  return (
    <div className="py-16 flex justify-center">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function InfoArticles({ initialArticles, prices = {} }: {
  initialArticles?: Article[];
  prices?: Record<string, number>;
}) {
  const [articles, setArticles] = useState<Article[]>(initialArticles ?? []);
  const [loading, setLoading] = useState(!initialArticles);
  const [selectedClip, setSelectedClip] = useState<Article | null>(null);
  const [iframeSrc, setIframeSrc] = useState('');

  // ?tab=xxx → 해당 섹션 앵커 스크롤 (mount only)
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    const TAB_TO_ID: Record<string, string> = {
      'card-news': 'cardnews',
      'clip': 'clips',
      'terms': 'terms',
    };
    const targetId = TAB_TO_ID[tab ?? ''];
    if (!targetId) return;
    const timer = setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialArticles) return;
    fetch('/api/info-articles')
      .then((r) => r.json())
      .then((d: { articles?: Article[] }) => setArticles(d.articles ?? []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [initialArticles]);

  const regularArticles = useMemo(
    () => articles.filter((a) => getDisplayType(a) === 'blog' && a.category !== 'card-news'),
    [articles]
  );

  const cardNewsArticles = useMemo(
    () => articles.filter((a) => getDisplayType(a) === 'blog' && a.category === 'card-news'),
    [articles]
  );

  const filteredClips = useMemo(
    () => articles.filter((a) => { const t = getDisplayType(a); return t === 'youtube' || t === 'shorts'; }),
    [articles]
  );

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

  return (
    <div className="min-h-[100dvh] bg-white pb-24">
      <InfoSectionNav />

      {/* 아티클 */}
      <section id="articles" className="scroll-mt-24 pt-10">
        <Container className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">아티클</h2>
        </Container>
        {loading ? <SectionSpinner /> : (
          <HorizontalScroll
            articles={regularArticles}
            emptyMessage="아티클이 없습니다"
            aspectClass="aspect-video"
            objectClass="object-cover"
            showTitleOverlay
          />
        )}
      </section>

      {/* 카드뉴스 */}
      <section id="cardnews" className="scroll-mt-24 mt-16">
        <Container className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">카드뉴스</h2>
        </Container>
        {loading ? <SectionSpinner /> : (
          <HorizontalScroll
            articles={cardNewsArticles}
            emptyMessage="카드뉴스가 없습니다"
            aspectClass="aspect-[4/5] max-h-[480px]"
            objectClass="object-contain"
            multiCol
          />
        )}
      </section>

      {/* 클립 */}
      <section id="clips" className="scroll-mt-24 mt-16">
        <Container className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">클립</h2>
        </Container>
        {loading ? <SectionSpinner /> : (
          <ClipsHorizontal
            articles={filteredClips}
            onCardClick={handleClipClick}
          />
        )}
      </section>

      {/* 약관비교 */}
      <section id="terms" className="scroll-mt-24 mt-16">
        <Container className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">약관비교</h2>
        </Container>
        <Container>
          <CardLink
            href="/compare/terms"
            className="block bg-white rounded-2xl border border-border-solid shadow-md p-5 hover:border-primary transition-colors"
          >
            <p className="text-lg font-bold text-primary mb-1.5">장기렌터카 약관 핵심조항 비교</p>
            <p className="text-sm text-text-sub leading-relaxed">
              5개사 약관 원문 기준 중도해지·초과주행·승계 조건 비교
            </p>
          </CardLink>
        </Container>
      </section>

      {selectedClip && (
        <YoutubeModal
          title={selectedClip.title}
          iframeSrc={iframeSrc}
          onClose={handleClipClose}
          vehicle={selectedVehicle}
        />
      )}
    </div>
  );
}
