'use client';

import { useEffect } from 'react';
import { gtag } from '@/lib/gtag';

interface CarSeoAnalyticsProps {
  carSlug: string;
  carBrand: string;
}

export function CarSeoAnalytics({ carSlug, carBrand }: CarSeoAnalyticsProps) {
  useEffect(() => {
    gtag.seoPageView(carSlug, carBrand);
  }, [carSlug, carBrand]);

  return null;
}
