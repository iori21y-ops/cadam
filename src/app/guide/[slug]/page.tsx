import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Footer } from '@/components/Footer';
import { getAllGuides, getGuideBySlug, guideCategoryLabel } from '@/lib/guide';

export async function generateStaticParams() {
  const guides = await getAllGuides();
  return guides.map((g) => ({ slug: g.slug }));
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) return { title: '가이드를 찾을 수 없어요' };

  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guide/${slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: 'article',
      publishedTime: guide.publishedAt || undefined,
    },
  };
}

// react-markdown 요소별 스타일 (typography 플러그인 미사용 → 직접 매핑)
const mdComponents = {
  h2: (props: React.ComponentProps<'h2'>) => (
    <h2 className="mt-10 mb-3 text-xl font-bold text-text" {...props} />
  ),
  h3: (props: React.ComponentProps<'h3'>) => (
    <h3 className="mt-6 mb-2 text-lg font-semibold text-text" {...props} />
  ),
  p: (props: React.ComponentProps<'p'>) => (
    <p className="my-4 text-[15px] leading-relaxed text-text-sub" {...props} />
  ),
  ul: (props: React.ComponentProps<'ul'>) => (
    <ul className="my-4 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-text-sub" {...props} />
  ),
  ol: (props: React.ComponentProps<'ol'>) => (
    <ol className="my-4 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-text-sub" {...props} />
  ),
  strong: (props: React.ComponentProps<'strong'>) => (
    <strong className="font-semibold text-text" {...props} />
  ),
  a: (props: React.ComponentProps<'a'>) => (
    <a className="text-accent underline underline-offset-2" {...props} />
  ),
  table: (props: React.ComponentProps<'table'>) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-[13px]" {...props} />
    </div>
  ),
  thead: (props: React.ComponentProps<'thead'>) => (
    <thead className="border-b border-border" {...props} />
  ),
  th: (props: React.ComponentProps<'th'>) => (
    <th className="px-3 py-2 text-left font-semibold text-text" {...props} />
  ),
  td: (props: React.ComponentProps<'td'>) => (
    <td className="border-b border-border px-3 py-2 align-top leading-relaxed text-text-sub" {...props} />
  ),
};

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) notFound();

  const date = formatDate(guide.publishedAt);

  return (
    <>
      <article className="min-h-[100dvh] bg-white pb-24">
        <div className="max-w-lg mx-auto px-5 pt-6">
          <Link
            href="/guide"
            className="inline-flex items-center gap-1 text-sm text-text-sub transition-colors hover:text-text"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            가이드 목록
          </Link>

          <header className="mt-6">
            <p className="text-sm font-semibold text-accent">{guideCategoryLabel(guide.category)}</p>
            <h1 className="mt-2 text-[26px] font-bold leading-tight text-text">{guide.title}</h1>
            {date && <p className="mt-3 text-sm text-text-muted tabular-nums">{date}</p>}
          </header>

          <div className="mt-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {guide.content}
            </ReactMarkdown>
          </div>

          <div className="mt-12 rounded-3xl border border-accent bg-white p-6 text-center">
            <p className="text-base font-semibold text-text">내 차에 맞는 장기렌트 조건이 궁금하다면?</p>
            <p className="mt-1 text-sm text-text-sub">카담의 간편 진단으로 30초 안에 확인해보세요.</p>
            <Link
              href="/diagnosis"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              장기렌트 적합도 진단하기
            </Link>
          </div>
        </div>
      </article>
      <Footer />
    </>
  );
}
