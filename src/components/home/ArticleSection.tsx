import Link from 'next/link';
import Image from 'next/image';
import { fetchWpPosts, type InfoArticleShape } from '@/lib/wp-client';

const FALLBACK_ARTICLES: InfoArticleShape[] = [
  {
    id: 'fallback-1',
    title: '장기렌트 vs 리스 vs 할부, 뭐가 다를까?',
    excerpt: '자동차 금융상품의 차이를 한눈에 비교해드립니다',
    linkUrl: '/blog/rent-vs-lease',
    thumbnailUrl: null,
    sourceType: 'blog',
    publishedAt: null,
    category: 'rental',
    vehicleSlug: null,
  },
  {
    id: 'fallback-2',
    title: '장기렌트 보험, 이것만 알면 됩니다',
    excerpt: '보험료 포함 여부부터 사고 처리까지 핵심 정리',
    linkUrl: '/blog/rent-insurance-guide',
    thumbnailUrl: null,
    sourceType: 'blog',
    publishedAt: null,
    category: 'rental',
    vehicleSlug: null,
  },
  {
    id: 'fallback-3',
    title: '하허호 번호판, 정말 신경 쓰여야 할까?',
    excerpt: '렌트 번호판에 대한 오해와 진실',
    linkUrl: '/blog/license-plate-myth',
    thumbnailUrl: null,
    sourceType: 'blog',
    publishedAt: null,
    category: 'rental',
    vehicleSlug: null,
  },
  {
    id: 'fallback-4',
    title: '신차 장기렌트, 선납금 얼마가 적당할까?',
    excerpt: '선납금 비율에 따른 월 렌트료 변화 분석',
    linkUrl: '/blog/deposit-guide',
    thumbnailUrl: null,
    sourceType: 'blog',
    publishedAt: null,
    category: 'rental',
    vehicleSlug: null,
  },
];

export async function ArticleSection() {
  const wpArticles = await fetchWpPosts({ perPage: 4 });
  const articles = wpArticles.length > 0 ? wpArticles : FALLBACK_ARTICLES;

  return (
    <section className="bg-background py-12 px-5">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-primary font-bold text-xl mb-2">
          알아두면 유용한 렌트 가이드
        </h2>

        <div>
          {articles.map((article, i) => (
            <Link
              key={article.id}
              href={article.linkUrl}
              className={`flex items-start gap-4 py-5 transition-colors active:bg-gray-50 ${
                i < articles.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-primary font-bold text-base line-clamp-2">
                  {article.title}
                </p>
                {article.excerpt && (
                  <p className="text-gray-500 text-sm line-clamp-2 mt-1">
                    {article.excerpt}
                  </p>
                )}
              </div>
              <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100 relative">
                {article.thumbnailUrl ? (
                  <Image
                    src={article.thumbnailUrl}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-text-muted text-xs">RENTAILOR</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/info"
          className="block mt-4 bg-gray-50 rounded-xl py-4 text-center text-gray-600 text-sm font-medium transition-colors hover:bg-gray-100 active:bg-gray-200"
        >
          가이드 더 보기 &gt;
        </Link>
      </div>
    </section>
  );
}
