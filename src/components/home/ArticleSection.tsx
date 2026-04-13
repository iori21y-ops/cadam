import Link from 'next/link';
import Image from 'next/image';
import { fetchWpPosts } from '@/lib/wp-client';

export async function ArticleSection() {
  const articles = await fetchWpPosts({ perPage: 4 });

  if (articles.length === 0) return null;

  return (
    <section className="bg-white py-12 px-5">
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
