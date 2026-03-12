'use client';

import { useEffect, useMemo, useState } from 'react';
import { VEHICLE_LIST } from '@/constants/vehicles';

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

const MOCK_ARTICLES: Article[] = [
  {
    id: 'mock-1',
    title: '장기렌터카 vs 리스, 뭐가 다를까?',
    excerpt: '장기렌터카와 리스의 차이점, 세금 처리, 비용 비교를 쉽게 설명합니다.',
    linkUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    thumbnailUrl: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg',
    sourceType: 'youtube',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'rental',
    vehicleSlug: null,
  },
  {
    id: 'mock-2',
    title: '2025년 장기렌터카 인기 차종 TOP 5',
    excerpt: '올해 가장 인기 있는 장기렌터카 차종과 월 납부금 대략을 알아봅니다.',
    linkUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    sourceType: 'youtube',
    publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'rental',
    vehicleSlug: null,
  },
  {
    id: 'mock-3',
    title: '법인 장기렌터카 비용 처리 완벽 가이드',
    excerpt: '법인사업자가 장기렌터카 비용을 어떻게 처리하는지, 세금 혜택을 정리했습니다.',
    linkUrl: 'https://brunch.co.kr',
    thumbnailUrl: null,
    sourceType: 'blog',
    publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'rental',
    vehicleSlug: null,
  },
  {
    id: 'mock-4',
    title: '2025 신차 TOP 10 완전 정복',
    excerpt: '올해 주목해야 할 신차 라인업을 소개합니다.',
    linkUrl: 'https://blog.naver.com',
    thumbnailUrl: null,
    sourceType: 'blog',
    publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'car',
    vehicleSlug: null,
  },
];

const GROUPS = [
  { type: 'blog' as const, label: '블로그', isShorts: false },
  { type: 'shorts' as const, label: '쇼츠', isShorts: true },
  { type: 'youtube' as const, label: '유튜브', isShorts: false },
];

const CATEGORY_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'rental', label: '장기렌터카' },
  { value: 'car', label: '자동차' },
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
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'rental' | 'car'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');

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

  // 자동차 카테고리에서 실제 등록된 차종 목록 추출
  const availableVehicles = useMemo(() => {
    const carArticles = articles.filter((a) => a.category === 'car');
    const slugs = [...new Set(carArticles.map((a) => a.vehicleSlug).filter(Boolean))] as string[];
    return slugs
      .map((slug) => VEHICLE_LIST.find((v) => v.slug === slug))
      .filter(Boolean) as typeof VEHICLE_LIST;
  }, [articles]);

  // 카테고리 변경 시 차종 필터 초기화
  const handleCategoryChange = (cat: 'all' | 'rental' | 'car') => {
    setSelectedCategory(cat);
    setSelectedVehicle('all');
  };

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (selectedCategory !== 'all') {
      result = result.filter((a) => a.category === selectedCategory);
    }
    if (selectedCategory === 'car' && selectedVehicle !== 'all') {
      result = result.filter((a) =>
        selectedVehicle === '_none'
          ? !a.vehicleSlug
          : a.vehicleSlug === selectedVehicle
      );
    }
    return result;
  }, [articles, selectedCategory, selectedVehicle]);

  return (
    <section className="py-8 flex-1">
      <h2 className="text-xl font-bold text-primary mb-1 text-center px-5">
        장기렌터카 정보
      </h2>
      <p className="text-sm text-gray-500 mb-5 text-center px-5">
        블로그, 유튜브 등에서 유용한 정보를 모았습니다
      </p>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 px-5 mb-3">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => handleCategoryChange(f.value as 'all' | 'rental' | 'car')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              selectedCategory === f.value
                ? 'bg-accent text-white border-accent'
                : 'bg-white text-gray-600 border-gray-300 hover:border-accent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 차종 필터 (자동차 선택 시, 등록된 차종이 있을 때) */}
      {selectedCategory === 'car' && availableVehicles.length > 0 && (
        <div className="overflow-x-auto mb-5">
          <div className="flex gap-2 px-5 pb-1" style={{ width: 'max-content' }}>
            <button
              type="button"
              onClick={() => setSelectedVehicle('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                selectedVehicle === 'all'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-600'
              }`}
            >
              전체
            </button>
            {availableVehicles.map((v) => (
              <button
                key={v.slug}
                type="button"
                onClick={() => setSelectedVehicle(v.slug)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                  selectedVehicle === v.slug
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-600'
                }`}
              >
                {v.model}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && selectedCategory === 'car' && availableVehicles.length === 0 && (
        <div className="mb-5" />
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="mx-5 py-16 text-center rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-gray-500">아직 등록된 정보가 없습니다</p>
          <p className="text-gray-400 text-sm mt-1">추후 블로그·유튜브 콘텐츠가 연결됩니다</p>
        </div>
      ) : (
        <div className="space-y-8">
          {GROUPS.map((group) => {
            const items = filteredArticles.filter((a) => getDisplayType(a) === group.type);
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
