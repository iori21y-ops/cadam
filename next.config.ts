import type { NextConfig } from "next";
import BundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = BundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// 프리뷰→운영 라우트 승격(플립). 운영 URL = 리디자인 콘텐츠. (순서: 구체 경로 먼저)
const FLIP: [string, string][] = [
  ['/', '/home-preview'],
  ['/popular-estimates', '/popular-estimates-preview'],
  ['/cars/:slug/options', '/car-options-preview/:slug'],
  ['/cars/:slug', '/cars-detail-preview/:slug'],
  ['/diagnosis/vehicle', '/diagnosis-vehicle-preview'],
  ['/diagnosis/finance', '/diagnosis-finance-preview'],
  ['/diagnosis/compare', '/diagnosis-compare-preview'],
  ['/diagnosis/report', '/diagnosis-report-preview'],
  ['/diagnosis', '/diagnosis-preview'],
  ['/info/:id', '/info-preview/:id'],
  ['/info', '/info-preview'],
  ['/promotions', '/promotions-preview'],
  ['/terms', '/terms-preview'],
  ['/privacy', '/privacy-preview'],
  ['/login', '/login-preview'],
  ['/mypage', '/mypage-preview'],
  ['/reviews/write', '/reviews-write-preview'],
  ['/reviews', '/reviews-preview'],
  ['/community', '/community-preview'],
];

const nextConfig: NextConfig = {
  async rewrites() {
    // beforeFiles: 운영 URL 요청 → 리디자인 프리뷰 콘텐츠(내부 리라이트, URL 유지)
    return {
      beforeFiles: FLIP.map(([op, pv]) => ({ source: op, destination: pv })),
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      // -preview 직접 접근 → 운영 URL 301(중복색인 방지)
      ...FLIP.map(([op, pv]) => ({ source: pv, destination: op, permanent: true })),
      { source: '/cars/grandeur-gn7', destination: '/cars/grandeur', permanent: true },
      { source: '/simulator/compare', destination: '/diagnosis/compare', permanent: true },
      // 구 약관비교 고아 스텁 → 검수 연동된 신규 비교표로 301 통합 (SEO 분산 방지)
      { source: '/info/terms-comparison', destination: '/compare/terms', statusCode: 301 },
    ];
  },
  compress: true,
  images: {
    unoptimized: true,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'cadam21y.mycafe24.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
};

export default withBundleAnalyzer(nextConfig);
