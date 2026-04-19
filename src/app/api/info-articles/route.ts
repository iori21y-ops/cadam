import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { fetchWpPosts, type InfoArticleShape } from '@/lib/wp-client';

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

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const [supabaseResult, wpArticles] = await Promise.all([
      supabase
        .from('info_articles')
        .select('id, title, excerpt, content, link_url, thumbnail_url, source_type, published_at, category, vehicle_slug')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('published_at', { ascending: false, nullsFirst: false }),
      fetchWpPosts(),
    ]);

    const { data, error } = supabaseResult;

    if (error) {
      console.error('info_articles query error:', error);
    }

    const supabaseArticles: InfoArticleShape[] = (error ? [] : (data as ArticleRow[])).map(
      ({ id, title, excerpt, content, link_url, thumbnail_url, source_type, published_at, category, vehicle_slug }) => ({
        id,
        title,
        excerpt,
        linkUrl: content ? `/info/${id}` : link_url,
        thumbnailUrl: thumbnail_url,
        sourceType: source_type ?? 'blog',
        publishedAt: published_at,
        category: category ?? 'rental',
        vehicleSlug: vehicle_slug ?? null,
      })
    );

    const wpLinks = new Set(wpArticles.map(a => a.linkUrl));
    const uniqueSupabase = supabaseArticles.filter(a => !wpLinks.has(a.linkUrl));
    const articles = [...wpArticles, ...uniqueSupabase].sort((a, b) => {
      const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return tb - ta;
    });

    return NextResponse.json({ articles }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('Info articles API error:', err);
    return NextResponse.json({ articles: [] });
  }
}
