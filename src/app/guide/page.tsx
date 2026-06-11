import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { getAllGuides, guideCategoryLabel, type GuideArticle } from '@/lib/guide';

export const metadata: Metadata = {
  title: '장기렌트 가이드',
  description: '장기렌트 계약·비용·만기까지, 꼭 알아야 할 내용을 카담이 정리했습니다.',
  alternates: { canonical: '/guide' },
};

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default async function GuideHubPage() {
  const guides = await getAllGuides();

  // 카테고리별 그룹화 (등장 순서 유지)
  const groups: { category: string; items: GuideArticle[] }[] = [];
  for (const g of guides) {
    let group = groups.find((x) => x.category === g.category);
    if (!group) {
      group = { category: g.category, items: [] };
      groups.push(group);
    }
    group.items.push(g);
  }

  return (
    <>
      <main className="min-h-[100dvh] bg-white pb-24">
        <div className="max-w-lg mx-auto px-5 pt-8">
          <header>
            <h1 className="text-[28px] font-bold leading-tight text-text">장기렌트 가이드</h1>
            <p className="mt-3 text-sm text-text-sub leading-relaxed">
              계약부터 비용, 만기 선택까지 — 장기렌트를 결정하기 전에 꼭 알아야 할 내용을 정리했어요.
            </p>
          </header>

          {groups.length === 0 ? (
            <p className="mt-12 text-sm text-text-muted">아직 등록된 가이드가 없어요.</p>
          ) : (
            <div className="mt-10 space-y-10">
              {groups.map((group) => (
                <section key={group.category}>
                  <h2 className="text-sm font-semibold text-accent">
                    {guideCategoryLabel(group.category)}
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {group.items.map((g) => (
                      <li key={g.slug}>
                        <Link
                          href={`/guide/${g.slug}`}
                          className="block rounded-2xl border border-border p-5 transition-colors hover:border-accent"
                        >
                          <h3 className="text-base font-semibold text-text leading-snug">{g.title}</h3>
                          {g.description && (
                            <p className="mt-2 text-sm text-text-sub leading-relaxed line-clamp-2">
                              {g.description}
                            </p>
                          )}
                          {g.publishedAt && (
                            <p className="mt-3 text-xs text-text-muted tabular-nums">
                              {formatDate(g.publishedAt)}
                            </p>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
