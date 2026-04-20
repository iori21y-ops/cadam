import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { fetchWpPosts, type InfoArticleShape } from '@/lib/wp-client';
import { ClipsCarousel } from './ClipsCarousel';

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

interface ArticleRow {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  link_url: string;
  thumbnail_url: string | null;
  source_type: string | null;
  published_at: string | null;
  category: string | null;
  vehicle_slug: string | null;
}

function getDisplayType(article: InfoArticleShape): 'blog' | 'youtube' | 'shorts' {
  if (article.linkUrl.includes('youtube.com/shorts/')) return 'shorts';
  if (article.sourceType === 'youtube') return 'youtube';
  return 'blog';
}

async function getSupabaseArticles(): Promise<InfoArticleShape[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('info_articles')
      .select('id, title, excerpt, content, link_url, thumbnail_url, source_type, published_at, category, vehicle_slug')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data) return [];

    return (data as ArticleRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      linkUrl: row.content ? `/info/${row.id}` : row.link_url,
      thumbnailUrl: row.thumbnail_url,
      sourceType: row.source_type ?? 'blog',
      publishedAt: row.published_at,
      category: row.category ?? '',
      vehicleSlug: row.vehicle_slug,
    }));
  } catch {
    return [];
  }
}

export async function ArticleSection() {
  const [wpArticles, supabaseArticles] = await Promise.all([
    fetchWpPosts({ perPage: 10 }),
    getSupabaseArticles(),
  ]);

  const wpLinks = new Set(wpArticles.map(a => a.linkUrl));
  const uniqueSupabase = supabaseArticles.filter(a => !wpLinks.has(a.linkUrl));
  const allArticles = [...wpArticles, ...uniqueSupabase].sort((a, b) => {
    const da = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const db = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return db - da;
  });

  const blogArticles = allArticles.filter((a) => getDisplayType(a) === 'blog');
  const clipArticles = allArticles.filter((a) => {
    const t = getDisplayType(a);
    return t === 'youtube' || t === 'shorts';
  });

  const displayBlogs = blogArticles.length > 0 ? blogArticles.slice(0, 4) : FALLBACK_ARTICLES;
  const displayClips = clipArticles.slice(0, 6);

  return (
    <>
      {/* 아티클 섹션 */}
      <section className="bg-white py-12 px-5">
        <div className="max-w-lg mx-auto">
          <h2 className="font-bold text-xl text-gray-900 mb-1">렌테일러 아티클</h2>
          <p className="text-gray-500 text-sm mb-4">알아두면 유용한 렌트 가이드</p>

          <div>
            {displayBlogs.map((article, i) => (
              <Link
                key={article.id}
                href={article.linkUrl}
                className={`flex items-start gap-4 py-4 transition-colors active:bg-gray-50 ${
                  i < displayBlogs.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-bold text-[15px] line-clamp-2">{article.title}</p>
                  {article.excerpt && (
                    <p className="text-gray-500 text-[13px] line-clamp-2 mt-1">{article.excerpt}</p>
                  )}
                </div>
                <div className="w-[88px] h-[88px] shrink-0 rounded-2xl overflow-hidden bg-gray-100">
                  {article.thumbnailUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={article.thumbnailUrl} alt={article.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400 text-xs">RENTAILOR</span>
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
            아티클 더 보기 &gt;
          </Link>
        </div>
      </section>

      {/* 클립 섹션 */}
      <section className="bg-white py-10">
        <div className="max-w-lg mx-auto">
          <div className="px-5 mb-4">
            <h2 className="font-bold text-xl text-gray-900 mb-1">클립</h2>
            <p className="text-gray-500 text-sm">영상으로 쉽게 알아보세요</p>
          </div>

          <ClipsCarousel clips={displayClips} />

          <div className="px-5 mt-3">
            <Link
              href="/info/clips"
              className="block bg-gray-50 rounded-xl py-3.5 text-center text-gray-600 text-sm font-medium transition-colors hover:bg-gray-100 active:bg-gray-200"
            >
              클립 더 보기 &gt;
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
