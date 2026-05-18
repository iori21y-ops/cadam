import type { NextConfig } from "next";
import BundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = BundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/cars/grandeur-gn7',
        destination: '/cars/grandeur',
        permanent: true,
      },
      {
        source: '/simulator/compare',
        destination: '/diagnosis/compare',
        permanent: true,
      },
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
