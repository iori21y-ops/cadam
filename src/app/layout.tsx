import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { NavBar } from '@/components/NavBar';
import { Toast } from '@/components/Toast';
import { GAPageView } from '@/components/GAPageView';

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
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="font-sans antialiased bg-white">
        <div className="min-w-[360px] max-w-[1024px] mx-auto w-full">
          <GAPageView />
          <NavBar />
          {children}
        </div>
        <Toast />
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
