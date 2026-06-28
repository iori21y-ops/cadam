import type { Metadata } from 'next';
import HomePreview from './HomePreview';

// Rentailor 랜딩 리뉴얼 + 견적 위저드 프리뷰 (타깃 운영 /).
// 실제 상담 API(/api/consultation)에 연결된 제출 배선 포함.
// 검색 비노출: 프리뷰가 색인되지 않도록 막는다.
export const metadata: Metadata = {
  title: 'Rentailor — 차는 사지 말고, 빌려서 타세요',
  robots: { index: false, follow: false },
};

export default function HomePreviewPage() {
  return <HomePreview />;
}
