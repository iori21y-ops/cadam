import { InfoClips } from '@/components/info/InfoClips';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { fetchWpPosts, type InfoArticleShape } from '@/lib/wp-client';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '클립 | 렌테일러',
  description: '장기렌터카 관련 유용한 영상과 쇼츠를 모아봤습니다.',
};

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

async function getArticles(): Promise<InfoArticleShape[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('info_articles')
      .select('id, title, excerpt, content, link_url, thumbnail_url, source_type, published_at, category, vehicle_slug')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data) return [];

    return (data as ArticleRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      linkUrl: row.content ? `/info/${row.id}` : row.link_url,
      thumbnailUrl: row.thumbnail_url,
      sourceType: row.source_type ?? 'blog',
      publishedAt: row.published_at,
      category: row.category ?? '',
      vehicleSlug: row.vehicle_slug,
    }));
  } catch {
    return [];
  }
}

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

async function getPrices(): Promise<Record<string, number>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, slug');
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
      if (!priceMap[slug] || row.min_monthly < priceMap[slug]) {
        priceMap[slug] = row.min_monthly;
      }
    }
    return priceMap;
  } catch {
    return {};
  }
}

export default async function ClipsPage() {
  const [articles, categories, wpArticles, prices] = await Promise.all([
    getArticles(),
    getCategories(),
    fetchWpPosts({ perPage: 50 }),
    getPrices(),
  ]);

  const wpLinks = new Set(wpArticles.map(a => a.linkUrl));
  const uniqueSupabase = articles.filter(a => !wpLinks.has(a.linkUrl));
  const allArticles = [...wpArticles, ...uniqueSupabase].sort((a, b) => {
    const da = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const db = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return db - da;
  });

  return <InfoClips initialArticles={allArticles} categories={categories} prices={prices} />;
}
