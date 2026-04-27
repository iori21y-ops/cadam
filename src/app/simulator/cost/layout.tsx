import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '내 차 유지비 진단 | 렌테일러',
  description: '차량 연식·가격·주행거리를 입력하면 숨은 비용까지 포함한 진짜 유지비를 계산해 드립니다. 할부·보험·세금·정비비 전부 포함.',
  openGraph: {
    title: '내 차 유지비 진단 | 렌테일러',
    description: '숨은 비용까지 포함한 진짜 내 차 유지비를 1분 안에 확인하세요.',
  },
};

export default function CostSimulatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
