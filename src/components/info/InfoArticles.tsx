'use client';

import { useEffect, useState } from 'react';

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  linkUrl: string;
  thumbnailUrl: string | null;
  sourceType: string;
  publishedAt: string | null;
}

function getSourceLabel(sourceType: string): string {
  switch (sourceType) {
    case 'youtube': return '유튜브';
    case 'blog': return '블로그';
    default: return '정보';
  }
}

function getDisplayType(article: Article): 'blog' | 'youtube' | 'shorts' {
  if (article.linkUrl.includes('youtube.com/shorts/')) return 'shorts';
  if (article.sourceType === 'youtube') return 'youtube';
  return 'blog';
}

const MOCK_ARTICLES: Article[] = [
  {
    id: 'mock-1',
    title: '장기렌터카 vs 리스, 뭐가 다를까?',
    excerpt: '장기렌터카와 리스의 차이점, 세금 처리, 비용 비교를 쉽게 설명합니다.',
    linkUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    thumbnailUrl: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg',
    sourceType: 'youtube',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    title: '2025년 장기렌터카 인기 차종 TOP 5',
    excerpt: '올해 가장 인기 있는 장기렌터카 차종과 월 납부금 대략을 알아봅니다.',
    linkUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    sourceType: 'youtube',
    publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-3',
    title: '법인 장기렌터카 비용 처리 완벽 가이드',
    excerpt: '법인사업자가 장기렌터카 비용을 어떻게 처리하는지, 세금 혜택을 정리했습니다.',
    linkUrl: 'https://brunch.co.kr',
    thumbnailUrl: null,
    sourceType: 'blog',
    publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-4',
    title: '보증금 0원 장기렌트, 괜찮을까?',
    excerpt: '보증금 없이 장기렌트하는 조건과 주의사항을 알아봅니다.',
    linkUrl: 'https://blog.naver.com',
    thumbnailUrl: null,
    sourceType: 'blog',
    publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const GROUPS = [
  { type: 'blog' as const, label: '블로그', isShorts: false },
  { type: 'shorts' as const, label: '쇼츠', isShorts: true },
  { type: 'youtube' as const, label: '유튜브', isShorts: false },
];

function ArticleCard({ article, isShorts }: { article: Article; isShorts: boolean }) {
  return (
    <a
      href={article.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`shrink-0 flex flex-col rounded-xl bg-white border border-gray-200 hover:border-accent hover:shadow-md transition-all overflow-hidden group ${
        isShorts ? 'w-[120px]' : 'w-[180px]'
      }`}
    >
      <div className={`w-full overflow-hidden ${isShorts ? 'aspect-[9/16]' : 'aspect-video'}`}>
        {article.thumbnailUrl ? (
          <img
            src={article.thumbnailUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const el = e.currentTarget;
              if (el.src.includes('maxresdefault')) {
                el.src = el.src.replace('maxresdefault', 'hqdefault');
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center p-3">
            <p className="text-white text-xs font-bold line-clamp-4 leading-snug text-center">
              {article.title}
            </p>
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="text-[11px] font-semibold text-gray-900 line-clamp-2 leading-snug">
          {article.title}
        </h3>
      </div>
    </a>
  );
}

export function InfoArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/info-articles')
      .then((res) => res.json())
      .then((data: { articles?: Article[] }) => {
        const fetched = data.articles ?? [];
        setArticles(fetched.length > 0 ? fetched : MOCK_ARTICLES);
      })
      .catch(() => setArticles(MOCK_ARTICLES))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-8 flex-1">
      <h2 className="text-xl font-bold text-primary mb-1 text-center px-5">
        장기렌터카 정보
      </h2>
      <p className="text-sm text-gray-500 mb-6 text-center px-5">
        블로그, 유튜브 등에서 유용한 정보를 모았습니다
      </p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="mx-5 py-16 text-center rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-gray-500">아직 등록된 정보가 없습니다</p>
          <p className="text-gray-400 text-sm mt-1">추후 블로그·유튜브 콘텐츠가 연결됩니다</p>
        </div>
      ) : (
        <div className="space-y-8">
          {GROUPS.map((group) => {
            const items = articles.filter((a) => getDisplayType(a) === group.type);
            if (items.length === 0) return null;
            return (
              <div key={group.type}>
                <div className="flex items-center gap-2 px-5 mb-3">
                  <h3 className="text-sm font-bold text-gray-700">{group.label}</h3>
                  <span className="text-xs text-gray-400">{items.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <div className="flex gap-3 px-5 pb-2" style={{ width: 'max-content' }}>
                    {items.map((a) => (
                      <ArticleCard key={a.id} article={a} isShorts={group.isShorts} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
