import { InfoArticles } from '@/components/info/InfoArticles';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { fetchWpPosts, type InfoArticleShape } from '@/lib/wp-client';

export const revalidate = 60;


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

async function getPrices(): Promise<Record<string, number>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: vehicles } = await supabase.from('vehicles').select('id, slug');
    if (!vehicles?.length) return {};
    const idToSlug = new Map((vehicles as { id: string; slug: string }[]).map(v => [v.id, v.slug]));
    const vehicleIds = (vehicles as { id: string; slug: string }[]).map(v => v.id);
    const { data: pricing } = await supabase
      .from('pricing')
      .select('vehicle_id, min_monthly')
      .in('vehicle_id', vehicleIds)
      .eq('is_active', true)
      .gt('min_monthly', 0);
    const priceMap: Record<string, number> = {};
    for (const row of (pricing ?? []) as { vehicle_id: string; min_monthly: number }[]) {
      const slug = idToSlug.get(row.vehicle_id);
      if (!slug) continue;
      if (!priceMap[slug] || row.min_monthly < priceMap[slug]) priceMap[slug] = row.min_monthly;
    }
    return priceMap;
  } catch {
    return {};
  }
}

function mergeArticles(supabaseArticles: InfoArticleShape[], wpArticles: InfoArticleShape[]): InfoArticleShape[] {
  // DB category가 WP 기본값보다 정확하므로 DB 값을 우선 적용
  const dbCategoryMap = new Map(supabaseArticles.map(a => [a.linkUrl, a.category]));
  const wpLinks = new Set(wpArticles.map(a => a.linkUrl));
  const uniqueSupabase = supabaseArticles.filter(a => !wpLinks.has(a.linkUrl));
  const mergedWp = wpArticles.map(a => ({
    ...a,
    category: dbCategoryMap.get(a.linkUrl) ?? a.category,
  }));
  return [...mergedWp, ...uniqueSupabase].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
}

export default async function InfoPage() {
  const [articles, wpArticles, prices] = await Promise.all([
    getArticles(),
    fetchWpPosts({ perPage: 50 }),
    getPrices(),
  ]);
  return <InfoArticles initialArticles={mergeArticles(articles, wpArticles)} prices={prices} />;
}
