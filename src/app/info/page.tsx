import { InfoArticles } from '@/components/info/InfoArticles';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { fetchWpPosts, type InfoArticleShape } from '@/lib/wp-client';

export const revalidate = 60;

async function getCategories(): Promise<{ value: string; label: string }[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('info_categories')
      .select('value, label')
      .order('display_order', { ascending: true });
    return (data ?? []) as { value: string; label: string }[];
  } catch {
    return [];
  }
}

async function getArticles(): Promise<InfoArticleShape[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('info_articles')
      .select('id, title, excerpt, content, link_url, thumbnail_url, source_type, published_at, category, vehicle_slug')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('published_at', { ascending: false, nullsFirst: false });

    if (error) return [];

    return data.map(
      ({
        id, title, excerpt, content, link_url, thumbnail_url,
        source_type, published_at, category, vehicle_slug,
      }: {
        id: string; title: string; excerpt: string | null;
        content: string | null; link_url: string; thumbnail_url: string | null;
        source_type: string | null; published_at: string | null;
        category: string | null; vehicle_slug: string | null;
      }) => ({
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
  } catch {
    return [];
  }
}

function mergeArticles(supabaseArticles: InfoArticleShape[], wpArticles: InfoArticleShape[]): InfoArticleShape[] {
  return [...wpArticles, ...supabaseArticles].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
}

export default async function InfoPage() {
  const [articles, categories, wpArticles] = await Promise.all([
    getArticles(),
    getCategories(),
    fetchWpPosts(),
  ]);
  return <InfoArticles initialArticles={mergeArticles(articles, wpArticles)} categories={categories} />;
}
