'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo, useEffect, useMemo, useState, type ReactNode } from 'react';

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
  blog:    { label: '블로그', color: '#0D1B2A' },
  youtube: { label: '영상',   color: '#FF3B30' },
  shorts:  { label: '쇼츠',  color: '#FF2D55' },
};

function CardLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const isInternal = href.startsWith('/');
  if (isInternal) return <Link href={href} className={className}>{children}</Link>;
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
}

/* ── 차즘 스타일 리스트 아이템 ── */
const ArticleListItem = memo(function ArticleListItem({ article }: { article: Article }) {
  const type = getDisplayType(article);

  return (
    <CardLink href={article.linkUrl} className="flex items-start gap-4 px-5 py-4 bg-white hover:bg-gray-50 transition-colors">
      {/* 왼쪽: 텍스트 영역 */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mt-1.5">
            {article.excerpt}
          </p>
        )}
      </div>

      {/* 오른쪽: 썸네일 */}
      <div className="shrink-0 w-[100px] h-[100px] rounded-2xl overflow-hidden bg-gray-100 relative">
        {article.thumbnailUrl ? (
          <>
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
            {type !== 'blog' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full" style={{
            background: type === 'blog'
              ? 'linear-gradient(135deg, #0D1B2A 0%, #7C3AED 100%)'
              : 'linear-gradient(135deg, #FF3B30 0%, #FF9500 100%)',
          }} />
        )}
      </div>
    </CardLink>
  );
});

/* ── 필터 pill 버튼 ── */
function CategoryPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap',
        active
          ? 'bg-gray-900 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function InfoArticles({ initialArticles, categories = [] }: {
  initialArticles?: Article[];
  categories?: { value: string; label: string }[];
}) {
  const pathname = usePathname();
  const [articles, setArticles] = useState<Article[]>(initialArticles ?? []);
  const [loading, setLoading] = useState(!initialArticles);
  const [selectedKeyword, setSelectedKeyword] = useState('all');
  const [selectedType, setSelectedType] = useState<ContentType>('all');

  useEffect(() => {
    if (initialArticles) return;
    fetch('/api/info-articles')
      .then((r) => r.json())
      .then((d: { articles?: Article[] }) => setArticles(d.articles ?? []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [initialArticles]);

  const categoryFilters = useMemo(() => [{ value: 'all', label: '전체' }, ...categories], [categories]);

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (selectedKeyword !== 'all') result = result.filter((a) => a.category === selectedKeyword);
    if (selectedType !== 'all')    result = result.filter((a) => getDisplayType(a) === selectedType);
    return result;
  }, [articles, selectedKeyword, selectedType]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white pb-24">
      {/* 이용정보 ↔ 약관 비교 탭 */}
      <div className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex max-w-lg mx-auto px-5">
          {[
            { href: '/info',                  label: '이용정보' },
            { href: '/info/terms-comparison', label: '약관 비교' },
          ].map((t) => (
            <Link key={t.href} href={t.href} className={[
              'px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap',
              pathname === t.href
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-900',
            ].join(' ')}>
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 페이지 타이틀 */}
      <div className="max-w-lg mx-auto w-full px-5 pt-6 pb-2">
        <h1 className="text-xl font-bold text-gray-900">렌테일러 아티클</h1>
      </div>

      {/* 카테고리 필터 */}
      <div className="shrink-0 w-full max-w-lg mx-auto px-5 pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categoryFilters.map((f) => (
            <CategoryPill key={f.value} active={selectedKeyword === f.value} onClick={() => setSelectedKeyword(f.value)}>
              {f.label}
            </CategoryPill>
          ))}
        </div>
      </div>

      {/* 콘텐츠 타입 필터 */}
      <div className="shrink-0 w-full max-w-lg mx-auto px-5 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {TYPE_FILTERS.map((f) => (
            <CategoryPill key={f.value} active={selectedType === f.value} onClick={() => setSelectedType(f.value)}>
              {f.label}
            </CategoryPill>
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="max-w-lg mx-auto w-full">
        <div className="h-px bg-gray-100" />
      </div>

      {/* 아티클 리스트 */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="w-full max-w-lg text-center py-16">
            <p className="text-gray-500">해당 콘텐츠가 없습니다</p>
            <p className="text-gray-400 text-sm mt-1">다른 필터를 선택해보세요</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-lg mx-auto w-full">
          <div className="divide-y divide-gray-100">
            {filteredArticles.map((article) => (
              <ArticleListItem key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
