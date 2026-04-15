const WP_BASE_URL = process.env.NEXT_PUBLIC_WP_API_URL;

const REVALIDATE_SECONDS = 60;

export interface InfoArticleShape {
  id: string;
  title: string;
  excerpt: string | null;
  content?: string | null;
  linkUrl: string;
  thumbnailUrl: string | null;
  sourceType: string;
  publishedAt: string | null;
  category: string;
  vehicleSlug: string | null;
}

export interface WpPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  slug: string;
  status: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  excerpt: { rendered: string; protected: boolean };
  author: number;
  featured_media: number;
  categories: number[];
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url?: string;
      media_details?: {
        sizes?: Record<string, { source_url?: string }>;
      };
    }>;
  };
}

function decodeEntities(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201c')
    .replace(/&#8221;/g, '\u201d')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#8230;/g, '\u2026')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
}

function extractFirstBodyImage(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function pickThumbnail(post: WpPost): string | null {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  if (media) {
    const sizes = media.media_details?.sizes;
    const fromMedia =
      sizes?.medium_large?.source_url ??
      sizes?.large?.source_url ??
      sizes?.medium?.source_url ??
      media.source_url ??
      null;
    if (fromMedia) return fromMedia;
  }
  return extractFirstBodyImage(post.content.rendered);
}

export function toInfoArticle(post: WpPost): InfoArticleShape {
  return {
    id: `wp-${post.id}`,
    title: decodeEntities(post.title.rendered),
    excerpt: stripTags(post.excerpt.rendered) || null,
    linkUrl: post.link,
    thumbnailUrl: pickThumbnail(post),
    sourceType: 'blog',
    publishedAt: post.date,
    category: 'rental',
    vehicleSlug: null,
  };
}

async function wpFetch<T>(path: string): Promise<T | null> {
  if (!WP_BASE_URL) return null;
  try {
    const res = await fetch(`${WP_BASE_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ['wp-posts'] },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchWpPosts({ perPage = 20 }: { perPage?: number } = {}): Promise<InfoArticleShape[]> {
  const data = await wpFetch<WpPost[]>(`/posts?_embed=wp:featuredmedia&per_page=${perPage}&status=publish`);
  if (!data) return [];
  return data.map(toInfoArticle);
}

export async function fetchWpPostBySlug(slug: string): Promise<WpPost | null> {
  const data = await wpFetch<WpPost[]>(`/posts?_embed=wp:featuredmedia&slug=${encodeURIComponent(slug)}`);
  if (!data || data.length === 0) return null;
  return data[0];
}
