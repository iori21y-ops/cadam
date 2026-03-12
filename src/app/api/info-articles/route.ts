import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

interface ArticleRow {
  id: string;
  title: string;
  excerpt: string | null;
  link_url: string;
  thumbnail_url: string | null;
  source_type: string | null;
  published_at: string | null;
  category: string | null;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('info_articles')
      .select('id, title, excerpt, link_url, thumbnail_url, source_type, published_at, category')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('published_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('info_articles query error:', error);
      return NextResponse.json({ articles: [] });
    }

    const articles = (data as ArticleRow[]).map(
      ({ id, title, excerpt, link_url, thumbnail_url, source_type, published_at, category }) => ({
        id,
        title,
        excerpt,
        linkUrl: link_url,
        thumbnailUrl: thumbnail_url,
        sourceType: source_type ?? 'blog',
        publishedAt: published_at,
        category: category ?? 'rental',
      })
    );

    return NextResponse.json({ articles });
  } catch (err) {
    console.error('Info articles API error:', err);
    return NextResponse.json({ articles: [] });
  }
}
