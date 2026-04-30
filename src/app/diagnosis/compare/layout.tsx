import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '결제방식 비교 | 렌테일러 AI 진단',
  description: '할부·리스·렌트 3가지 방식의 총비용을 한 번에 비교하세요. 엔카 시세·금융감독원 통계·법적 세율로 계산합니다.',
  openGraph: {
    title: '할부 vs 리스 vs 렌트 — 렌테일러 비교 진단',
    description: '5번의 선택으로 내 상황에 맞는 최적 방법을 확인하세요',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
