'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { pageView } from '@/lib/gtag';

export function GAPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      pageView(pathname);
    }
  }, [pathname]);

  return null;
}
