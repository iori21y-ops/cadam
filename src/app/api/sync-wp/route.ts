import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const wpApiUrl = process.env.NEXT_PUBLIC_WP_API_URL!;
const syncSecret = process.env.SYNC_WP_SECRET || 'cadam-sync-2026';

interface WpPost {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  link: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url?: string;
    }>;
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8218;/g, ',')
    .replace(/&#8220;/g, '\u201c')
    .replace(/&#8221;/g, '\u201d')
    .replace(/&#8230;/g, '…')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n/g, ' ')
    .trim();
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-sync-secret');
  if (secret !== syncSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!wpApiUrl || !supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // WP에서 최신 글 가져오기 (최대 50개)
    const wpRes = await fetch(`${wpApiUrl}/posts?_embed=wp:featuredmedia&per_page=50&status=publish`, {
      next: { revalidate: 0 },
    });
    if (!wpRes.ok) {
      return NextResponse.json({ error: `WP API error: ${wpRes.status}` }, { status: 502 });
    }
    const wpPosts: WpPost[] = await wpRes.json();

    // 이미 등록된 WP 글 확인 (link_url 기준)
    const { data: existing } = await supabase
      .from('info_articles')
      .select('link_url')
      .like('link_url', '%/blog/%');

    const existingUrls = new Set((existing ?? []).map((row: { link_url: string }) => row.link_url));

    // 새 글만 필터링
    const newPosts = wpPosts.filter((post) => {
      const blogUrl = `/blog/${post.slug}`;
      return !existingUrls.has(blogUrl);
    });

    if (newPosts.length === 0) {
      return NextResponse.json({ message: 'No new posts', synced: 0 });
    }

    // 현재 최대 display_order 조회
    const { data: maxOrderRow } = await supabase
      .from('info_articles')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();
    let nextOrder = (maxOrderRow?.display_order ?? 0) + 1;

    // 새 글들을 Supabase에 삽입
    const inserts = newPosts.map((post) => {
      const thumbnailUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null;
      return {
        title: stripHtml(post.title.rendered),
        excerpt: stripHtml(post.excerpt.rendered).slice(0, 200) || null,
        link_url: `/blog/${post.slug}`,
        thumbnail_url: thumbnailUrl,
        source_type: 'blog',
        published_at: post.date,
        is_active: true,
        display_order: nextOrder++,
        category: '',
      };
    });

    const { data: inserted, error } = await supabase
      .from('info_articles')
      .insert(inserts)
      .select('id, title');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `Synced ${inserted?.length ?? 0} new posts`,
      synced: inserted?.length ?? 0,
      posts: inserted?.map((p: { id: string; title: string }) => p.title) ?? [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET도 지원 (브라우저에서 테스트용)
export async function GET(request: Request) {
  return POST(request);
}
