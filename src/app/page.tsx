import { Suspense } from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { PopularVehiclesSection } from '@/components/home/PopularVehiclesSection';
import { DiagnosisBanner } from '@/components/home/DiagnosisBanner';
import { PromotionBanner } from '@/components/home/PromotionBanner';
import { ArticleSection } from '@/components/home/ArticleSection';
import { TrustSection } from '@/components/home/TrustSection';
import { Footer } from '@/components/Footer';

function VehiclesSkeleton() {
  return (
    <section className="bg-background py-12 px-5">
      <div className="max-w-lg mx-auto">
        <div className="h-7 bg-surface rounded w-48 mb-6" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-[200px] bg-surface rounded-2xl animate-pulse">
              <div className="aspect-[4/3] bg-surface-secondary rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-surface-secondary rounded w-2/3" />
                <div className="h-5 bg-surface-secondary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArticlesSkeleton() {
  return (
    <section className="bg-background py-12 px-5">
      <div className="max-w-lg mx-auto">
        <div className="h-7 bg-surface rounded w-56 mb-2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-start gap-4 py-5 animate-pulse ${
              i < 3 ? 'border-b border-border' : ''
            }`}
          >
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-surface rounded w-3/4" />
              <div className="h-4 bg-surface rounded w-full" />
            </div>
            <div className="w-24 h-24 shrink-0 rounded-xl bg-surface" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="pb-24">
      <HeroSection />
      <PromotionBanner />
      <Suspense fallback={<VehiclesSkeleton />}>
        <PopularVehiclesSection />
      </Suspense>
      <DiagnosisBanner />
      <Suspense fallback={<ArticlesSkeleton />}>
        <ArticleSection />
      </Suspense>
      <TrustSection />
      <Footer />
    </main>
  );
}
