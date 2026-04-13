import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { SafeHtml } from '@/components/SafeHtml';
import { fetchWpPostBySlug } from '@/lib/wp-client';

export const revalidate = 60;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function decodeTitle(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(html: string): string {
  return decodeTitle(html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchWpPostBySlug(slug);
  if (!post) return { title: '글을 찾을 수 없어요' };

  const title = decodeTitle(post.title.rendered);
  const description = stripTags(post.excerpt.rendered).slice(0, 160);
  const image = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.date,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchWpPostBySlug(slug);
  if (!post) notFound();

  const title = decodeTitle(post.title.rendered);
  const date = formatDate(post.date);
  const featured = post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null;
  return (
    <article className="min-h-[100dvh] bg-surface-secondary pb-24">
      <div className="max-w-[720px] mx-auto px-5 pt-6">
        <Link
          href="/info"
          className="inline-flex items-center gap-1 text-sm text-text-sub hover:text-text transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          블로그 목록
        </Link>

        <header className="mt-6">
          <h1 className="text-[26px] font-bold leading-tight text-text">{title}</h1>
          {date && (
            <p className="mt-3 text-sm text-text-muted tabular-nums">{date}</p>
          )}
        </header>

        {featured && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={featured}
            alt={title}
            className="mt-6 w-full rounded-2xl object-cover"
            loading="eager"
          />
        )}

        <SafeHtml html={post.content.rendered} className="wp-content mt-8 text-text" />

        <div className="mt-12 rounded-3xl bg-white border border-border-solid p-6 text-center">
          <p className="text-base font-semibold text-text">
            내 차에 맞는 장기렌트 조건이 궁금하다면?
          </p>
          <p className="mt-1 text-sm text-text-sub">
            렌테일러의 간편 진단으로 30초 안에 확인해보세요.
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
