import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { SafeHtml } from '@/components/SafeHtml';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const revalidate = 60;

interface ArticleRow {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  link_url: string;
  thumbnail_url: string | null;
  published_at: string | null;
}

async function getArticle(id: string): Promise<ArticleRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('info_articles')
    .select('id, title, excerpt, content, link_url, thumbnail_url, published_at')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data as ArticleRow;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: '글을 찾을 수 없어요' };

  const description = article.excerpt?.slice(0, 160) ?? undefined;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.rentailor.co.kr';

  return {
    title: article.title,
    description,
    alternates: {
      canonical: `${siteUrl}/info/${id}`,
    },
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      publishedTime: article.published_at ?? undefined,
      images: article.thumbnail_url ? [{ url: article.thumbnail_url }] : undefined,
    },
  };
}

export default async function InfoArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  if (!article.content) {
    redirect(article.link_url);
  }

  const date = article.published_at ? formatDate(article.published_at) : '';

  return (
    <article className="min-h-[100dvh] bg-white pb-24">
      <div className="max-w-lg mx-auto px-5 pt-6">
        <Link
          href="/info"
          className="inline-flex items-center gap-1 text-sm text-text-sub hover:text-text transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          콘텐츠 목록
        </Link>

        <header className="mt-6">
          <h1 className="text-[26px] font-bold leading-tight text-text">{article.title}</h1>
          {date && (
            <p className="mt-3 text-sm text-text-muted tabular-nums">{date}</p>
          )}
        </header>

        {article.thumbnail_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={article.thumbnail_url}
            alt={article.title}
            className="mt-6 w-full rounded-2xl object-cover"
            loading="eager"
          />
        )}

        <SafeHtml html={article.content} className="wp-content mt-8 text-text" />

        <div className="mt-12 rounded-3xl bg-white border border-accent p-6 text-center">
          <p className="text-base font-semibold text-text">
            내 차에 맞는 장기렌트 조건이 궁금하다면?
          </p>
          <p className="mt-1 text-sm text-text-sub">
            카담의 간편 진단으로 30초 안에 확인해보세요.
          </p>
          <Link
            href="/diagnosis"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            장기렌트 적합도 진단하기
          </Link>
        </div>
      </div>
    </article>
  );
}
