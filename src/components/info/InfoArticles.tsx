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

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function getSourceLabel(sourceType: string): string {
  switch (sourceType) {
    case 'youtube':
      return '유튜브';
    case 'blog':
      return '블로그';
    default:
      return '정보';
  }
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
    <section className="px-5 py-12 bg-gray-50">
      <h2 className="text-xl font-bold text-primary mb-2 text-center">
        장기렌터카 정보
      </h2>
      <p className="text-sm text-gray-500 mb-8 text-center">
        블로그, 유튜브 등에서 유용한 정보를 모았습니다
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="py-12 text-center rounded-xl bg-white border border-gray-200">
          <p className="text-gray-500">아직 등록된 정보가 없습니다</p>
          <p className="text-gray-400 text-sm mt-1">
            추후 블로그·유튜브 콘텐츠가 연결됩니다
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {articles.map((article) => (
            <a
              key={article.id}
              href={article.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:border-accent hover:shadow-md transition-all"
            >
              <div className="shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-200">
                {article.thumbnailUrl ? (
                  <img
                    src={article.thumbnailUrl}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    {article.sourceType === 'youtube' ? '▶' : '📄'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[#EBF5FB] text-accent mb-1.5">
                  {getSourceLabel(article.sourceType)}
                </span>
                <h3 className="font-semibold text-gray-900 line-clamp-2">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {article.excerpt}
                  </p>
                )}
                {article.publishedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(article.publishedAt)}
                  </p>
                )}
              </div>
              <span className="shrink-0 self-center text-accent text-sm font-medium">
                보기 →
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
