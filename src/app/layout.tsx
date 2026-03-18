import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import './globals.css';
import { NavBar } from '@/components/NavBar';
import { GAPageView } from '@/components/GAPageView';
import { DynamicToast } from '@/components/DynamicToast';
import { PageTransition } from '@/components/PageTransition';

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '100 900',
  variable: '--font-pretendard',
});

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  title: '카담(CADAM) | 장기렌터카 맞춤 견적',
  description: '장기렌터카 맞춤 상담 DB 확보. 현대, 기아, 제네시스 45종 최저가 견적을 비교해 보세요.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className={`${pretendard.className} antialiased bg-surface-secondary`}>
        <div className="max-w-[1024px] mx-auto w-full min-w-0">
          <GAPageView />
          <NavBar />
          <PageTransition>{children}</PageTransition>
        </div>
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
