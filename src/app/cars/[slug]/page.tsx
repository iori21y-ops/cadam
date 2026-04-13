import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { VEHICLE_LIST, getVehicleBySlug } from '@/constants/vehicles';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { CarHero } from '@/components/cars/CarHero';
import { PriceCompareTable } from '@/components/cars/PriceCompareTable';
import { RelatedCars } from '@/components/cars/RelatedCars';
import { CarCtaSection } from '@/components/cars/CarCtaSection';
import { CarSeoAnalytics } from '@/components/cars/CarSeoAnalytics';
import { CarArticles } from '@/components/cars/CarArticles';

export const revalidate = 3600;

export async function generateStaticParams() {
  return VEHICLE_LIST.map((v) => ({ slug: v.slug }));
}

interface PriceRangeRow {
  contract_months: number;
  annual_km: number;
  min_monthly: number;
  max_monthly: number;
}

interface VehicleDbRow {
  min_price: number | null;
  max_price: number | null;
}

interface ArticleRow {
  id: string;
  title: string;
  link_url: string;
  thumbnail_url: string | null;
  source_type: string | null;
  display_order: number;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) return { title: '차량을 찾을 수 없습니다' };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rentailor.co.kr';
  const imageUrl = `${baseUrl}/cars/${vehicle.imageKey}.webp`;

  return {
    title: vehicle.seoTitle,
    description: vehicle.seoDescription,
    openGraph: {
      title: vehicle.seoTitle,
      description: vehicle.seoDescription,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${baseUrl}/cars/${slug}`,
    },
  };
}

function PriceSkeleton() {
  return (
    <div className="animate-pulse space-y-3 px-5 py-8">
      <div className="h-5 bg-surface-secondary rounded w-1/3 mb-4" />
      <div className="h-10 bg-surface-secondary rounded" />
      <div className="h-10 bg-surface-secondary rounded" />
      <div className="h-10 bg-surface-secondary rounded" />
    </div>
  );
}

async function CarPageContent({ slug }: { slug: string }) {
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const supabase = await createServerSupabaseClient();

  const [{ data: priceRanges, error }, { data: articleRows }, { data: vehicleDb }] = await Promise.all([
    supabase
      .from('pricing')
      .select('contract_months, annual_km, min_monthly, max_monthly')
      .eq('car_brand', vehicle.brand)
      .eq('car_model', vehicle.model)
      .eq('is_active', true),
    supabase
      .from('info_articles')
      .select('id, title, link_url, thumbnail_url, source_type, display_order')
      .eq('vehicle_slug', vehicle.slug)
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('vehicles')
      .select('min_price, max_price')
      .eq('slug', vehicle.slug)
      .maybeSingle(),
  ]);

  const priceRows: PriceRangeRow[] = error ? [] : (priceRanges ?? []);
  const minPrice =
    priceRows.length > 0
      ? Math.min(...priceRows.map((r) => r.min_monthly))
      : null;

  const vs = vehicleDb as VehicleDbRow | null;
  const minCarPrice = vs?.min_price ? vs.min_price * 10000 : null;
  const maxCarPrice = vs?.max_price ? vs.max_price * 10000 : null;

  const articles = ((articleRows ?? []) as ArticleRow[]).map((r) => ({
    id: r.id,
    title: r.title,
    linkUrl: r.link_url,
    thumbnailUrl: r.thumbnail_url,
    sourceType: r.source_type ?? 'blog',
  }));

  return (
    <div className="max-w-lg mx-auto">
      <CarHero vehicle={vehicle} minPrice={minPrice} minCarPrice={minCarPrice} maxCarPrice={maxCarPrice} />

      <section className="px-5 py-8">
        <h2 className="text-lg font-bold text-primary mb-4">
          계약 조건별 월 납부금
        </h2>
        {priceRows.length > 0 ? (
          <PriceCompareTable priceRanges={priceRows} />
        ) : (
          <div className="py-8 text-center text-text-sub rounded-2xl border border-border-solid bg-white">
            상담 문의
          </div>
        )}
      </section>

      <CarArticles articles={articles} />

      <div className="px-5 pb-4">
        <CarCtaSection vehicle={vehicle} />
      </div>

      <RelatedCars currentVehicle={vehicle} />
    </div>
  );
}

export default async function CarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rentailor.co.kr';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${vehicle.brand} ${vehicle.model} 장기렌트`,
    description: vehicle.seoDescription,
    image: `${baseUrl}/cars/${vehicle.imageKey}.webp`,
    brand: {
      '@type': 'Brand',
      name: vehicle.brand,
    },
  };

  return (
    <>
      <CarSeoAnalytics carSlug={vehicle.slug} carBrand={vehicle.brand} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-surface-secondary pb-8">
        <Suspense fallback={<PriceSkeleton />}>
          <CarPageContent slug={slug} />
        </Suspense>
      </div>
    </>
  );
}
