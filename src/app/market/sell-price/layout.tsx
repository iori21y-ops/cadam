import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '내 차 시세 조회 | 렌테일러',
  description: '엔카 실거래 기준 내 차 예상 시세를 즉시 확인하세요. 연식·주행거리별 중고차 시세를 브랜드·모델별로 조회할 수 있습니다.',
  openGraph: {
    title: '내 차 시세 조회 | 렌테일러',
    description: '엔카 실거래 기준 내 차 예상 시세를 즉시 확인하세요.',
    type: 'website',
  },
};

export default function SellPriceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
