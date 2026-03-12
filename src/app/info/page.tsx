'use client';

import { useEffect } from 'react';
import { Footer } from '@/components/Footer';
import { InfoArticles } from '@/components/info/InfoArticles';

export default function InfoPage() {
  useEffect(() => {
    document.cookie = 'inflow_page=/info; path=/; max-age=86400';
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <InfoArticles />
      <Footer />
    </div>
  );
}
