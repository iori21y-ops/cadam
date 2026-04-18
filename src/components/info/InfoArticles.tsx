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

function CardLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const isInternal = href.startsWith('/');
  if (isInternal) return <Link href={href} className={className}>{children}</Link>;
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
}

const ArticleListItem = memo(function ArticleListItem({ article }: { article: Article }) {
  return (
    <CardLink href={article.linkUrl} className="flex items-start gap-4 px-5 py-4 bg-white hover:bg-gray-50 transition-colors">
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
      <div className="shrink-0 w-[100px] h-[100px] rounded-2xl overflow-hidden bg-gray-100">
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
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-xs">RENTAILOR</span>
          </div>
        )}
      </div>
    </CardLink>
  );
});

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

export function InfoArticles({ initialArticles, categories = [] }: {
  initialArticles?: Article[];
  categories?: { value: string; label: string }[];
}) {
  const pathname = usePathname();
  const [articles, setArticles] = useState<Article[]>(initialArticles ?? []);
  const [loading, setLoading] = useState(!initialArticles);
  const [selectedKeyword, setSelectedKeyword] = useState('all');

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
    let result = articles.filter((a) => getDisplayType(a) === 'blog');
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
        <h1 className="text-xl font-bold text-gray-900">렌테일러 아티클</h1>
      </div>

      {/* 카테고리 필터 */}
      <div className="shrink-0 w-full max-w-lg mx-auto px-5 pt-3 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categoryFilters.map((f) => (
            <CategoryPill key={f.value} active={selectedKeyword === f.value} onClick={() => setSelectedKeyword(f.value)}>
              {f.label}
            </CategoryPill>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full"><div className="h-px bg-gray-100" /></div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="w-full max-w-lg text-center py-16">
            <p className="text-gray-500">아티클이 없습니다</p>
            <p className="text-gray-400 text-sm mt-1">다른 카테고리를 선택해보세요</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full">
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
