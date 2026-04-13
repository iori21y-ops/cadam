import { Suspense } from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { QuickAccessGrid } from '@/components/home/QuickAccessGrid';
import { PopularVehiclesSection } from '@/components/home/PopularVehiclesSection';
import { DiagnosisBanner } from '@/components/home/DiagnosisBanner';
import { ArticleSection } from '@/components/home/ArticleSection';
import { TrustSection } from '@/components/home/TrustSection';
import { Footer } from '@/components/Footer';

function VehiclesSkeleton() {
  return (
    <section className="bg-background py-12 px-5">
      <div className="max-w-2xl mx-auto">
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
      <div className="max-w-2xl mx-auto">
        <div className="h-7 bg-surface rounded w-56 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl animate-pulse">
              <div className="aspect-[16/9] bg-surface-secondary rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-surface-secondary rounded w-20" />
                <div className="h-4 bg-surface-secondary rounded w-full" />
                <div className="h-3 bg-surface-secondary rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="pb-20">
      <HeroSection />
      <QuickAccessGrid />
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
