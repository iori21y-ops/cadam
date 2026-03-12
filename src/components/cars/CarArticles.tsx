'use client';

interface Article {
  id: string;
  title: string;
  linkUrl: string;
  thumbnailUrl: string | null;
  sourceType: string;
}

function getDisplayType(article: Article): 'shorts' | 'video' {
  if (article.linkUrl.includes('youtube.com/shorts/')) return 'shorts';
  return 'video';
}

export function CarArticles({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="text-lg font-bold text-primary mb-4 px-5">
        관련 정보
      </h2>
      <div className="overflow-x-auto">
        <div className="flex gap-3 px-5 pb-2" style={{ width: 'max-content' }}>
          {articles.map((article) => {
            const isShorts = getDisplayType(article) === 'shorts';
            return (
              <a
                key={article.id}
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
          })}
        </div>
      </div>
    </section>
  );
}
