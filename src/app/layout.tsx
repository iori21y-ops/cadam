import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { NavBar } from '@/components/NavBar';
import MobileTabBar from '@/components/MobileTabBar';
import { GAPageView } from '@/components/GAPageView';
import { DynamicToast } from '@/components/DynamicToast';
import { PageTransition } from '@/components/PageTransition';
import { BRAND } from '@/constants/brand';

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '100 900',
  variable: '--font-pretendard',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-outfit',
  display: 'swap',
});

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(`https://${BRAND.domain}`),
  title: BRAND.title,
  description: BRAND.description,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: BRAND.title,
    description: BRAND.description,
    url: `https://${BRAND.domain}`,
    siteName: BRAND.nameWithEn,
    images: [{ url: '/og-image-1200x630.png', width: 1200, height: 630 }],
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND.title,
    description: BRAND.description,
    images: ['/og-image-1200x630.png'],
  },
  verification: {
    google: 'p9FqEFlhxN6FsGGk26lnjwpAn6qKbctYTx48IkXZL4A',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${cormorant.variable} ${outfit.variable} bg-primary`}>
      <body className={`${pretendard.className} antialiased`}>
        <div className="max-w-[1024px] mx-auto w-full min-w-0 bg-surface-secondary shadow-2xl">
          <GAPageView />
          <NavBar />
          <PageTransition>{children}</PageTransition>
        </div>
        <MobileTabBar />
        <DynamicToast />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
