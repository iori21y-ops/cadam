import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '결제방식 비교 시뮬레이터 | 렌테일러',
  description: '할부·리스·렌트 3가지 방식의 총비용을 한 번에 비교하세요. 내 상황에 맞는 최적 방법을 AI가 추천합니다.',
  openGraph: {
    title: '결제방식 비교 시뮬레이터 | 렌테일러',
    description: '할부 vs 리스 vs 렌트 — 총비용·절세·편의성 완벽 비교',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
