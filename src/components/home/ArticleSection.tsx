import Link from 'next/link';
import Image from 'next/image';
import { fetchWpPosts } from '@/lib/wp-client';

export async function ArticleSection() {
  const articles = await fetchWpPosts({ perPage: 4 });

  if (articles.length === 0) return null;

  return (
    <section className="bg-background py-12 px-5">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-primary font-bold text-xl">
            알아두면 유용한 렌트 가이드
          </h2>
          <Link href="/info" className="text-accent text-sm font-medium">
            더보기 &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={article.linkUrl}
              className="bg-surface rounded-2xl overflow-hidden shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="aspect-[16/9] relative bg-background">
                {article.thumbnailUrl ? (
                  <Image
                    src={article.thumbnailUrl}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-text-muted text-sm">RENTAILOR</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className="inline-block bg-accent/10 text-accent text-xs px-2 py-1 rounded mb-2">
                  렌트 가이드
                </span>
                <p className="text-primary font-bold text-sm line-clamp-2">
                  {article.title}
                </p>
                {article.publishedAt && (
                  <p className="text-text-muted text-xs mt-2">
                    {new Date(article.publishedAt).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
