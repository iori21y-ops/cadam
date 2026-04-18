import type { MetadataRoute } from 'next';
import { VEHICLE_LIST } from '@/constants/vehicles';
import { fetchWpPostsForSitemap } from '@/lib/wp-client';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.rentailor.co.kr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/diagnosis`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/diagnosis/finance`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/diagnosis/vehicle`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/diagnosis/calculator`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/quote`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/info`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/popular-estimates`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/promotions`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/direct`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
  ];

  // 동적 페이지: 차량 상세
  const vehiclePages: MetadataRoute.Sitemap = VEHICLE_LIST.map((v) => ({
    url: `${BASE_URL}/cars/${v.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 동적 페이지: 블로그 포스트 (WordPress)
  const wpPosts = await fetchWpPostsForSitemap();
  const blogPages: MetadataRoute.Sitemap = wpPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.modified,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...vehiclePages, ...blogPages];
}
