'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo, useEffect, useMemo, useState, type ReactNode } from 'react';
import { YoutubeModal, extractYouTubeId } from '@/components/ui/YoutubeModal';
import { getVehicleBySlug } from '@/constants/vehicles';

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

function CategoryPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap',
        active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

const ClipCard = memo(function ClipCard({ article, onClick }: { article: Article; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="block group text-left w-full"
    >
      <div className="relative aspect-[9/14] rounded-2xl overflow-hidden bg-gray-100">
        {article.thumbnailUrl ? (
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
          <div className="w-full h-full" style={{
            background: 'linear-gradient(135deg, #FF3B30 0%, #FF9500 100%)',
          }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-[13px] font-bold leading-snug line-clamp-2 drop-shadow">
            {article.title}
          </p>
        </div>
      </div>
      {article.excerpt && (
        <p className="text-gray-600 text-[12px] leading-relaxed line-clamp-2 mt-2 px-0.5">
          {article.excerpt}
        </p>
      )}
    </button>
  );
});

export function InfoClips({ initialArticles, categories = [], prices = {} }: {
  initialArticles?: Article[];
  categories?: { value: string; label: string }[];
  prices?: Record<string, number>;
}) {
  const pathname = usePathname();
  const [articles, setArticles] = useState<Article[]>(initialArticles ?? []);
  const [loading, setLoading] = useState(!initialArticles);
  const [selectedKeyword, setSelectedKeyword] = useState('all');
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

  const categoryFilters = useMemo(() => [{ value: 'all', label: '전체' }, ...categories], [categories]);

  const filteredClips = useMemo(() => {
    let result = articles.filter((a) => {
      const type = getDisplayType(a);
      return type === 'youtube' || type === 'shorts';
    });
    if (selectedKeyword !== 'all') result = result.filter((a) => a.category === selectedKeyword);
    return result;
  }, [articles, selectedKeyword]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white pb-24">
      {/* 이용정보 ↔ 약관 비교 탭 */}
      <div className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex max-w-lg mx-auto px-5">
          {[
            { href: '/info',                  label: '이용정보' },
            { href: '/info/terms-comparison',  label: '약관 비교' },
          ].map((t) => {
            const isActive = t.href === '/info'
              ? pathname?.startsWith('/info') && !pathname?.startsWith('/info/terms')
              : pathname === t.href;
            return (
              <Link key={t.href} href={t.href} className={[
                'px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap',
                isActive ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-900',
              ].join(' ')}>
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 아티클 ↔ 클립 탭 */}
      <div className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex max-w-lg mx-auto px-5">
          {[
            { href: '/info',        label: '아티클' },
            { href: '/info/clips',  label: '클립' },
          ].map((t) => (
            <Link key={t.href} href={t.href} className={[
              'px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap',
              pathname === t.href ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-900',
            ].join(' ')}>
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 타이틀 */}
      <div className="max-w-lg mx-auto w-full px-5 pt-6 pb-2">
        <h1 className="text-xl font-bold text-gray-900">클립</h1>
      </div>

      {/* 카테고리 필터 */}
      <div className="shrink-0 w-full max-w-lg mx-auto px-5 pt-3 pb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categoryFilters.map((f) => (
            <CategoryPill key={f.value} active={selectedKeyword === f.value} onClick={() => setSelectedKeyword(f.value)}>
              {f.label}
            </CategoryPill>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredClips.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="w-full max-w-lg text-center py-16">
            <p className="text-gray-500">클립이 없습니다</p>
            <p className="text-gray-400 text-sm mt-1">다른 카테고리를 선택해보세요</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-5 pt-2">
          <div className="grid grid-cols-2 gap-3">
            {filteredClips.map((article) => (
              <ClipCard key={article.id} article={article} onClick={() => handleCardClick(article)} />
            ))}
          </div>
        </div>
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
