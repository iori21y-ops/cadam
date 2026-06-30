import type { Metadata } from 'next';
import HomeCinematic from './HomeCinematic';

// 홈 = 넷플릭스식 시네마틱 허브 (디자인 프로젝트 홈.html 이식 · 프리뷰).
// 검색 비노출: 프리뷰가 색인되지 않도록 막는다. 운영(/) 승격은 §6.12F 라우팅 확정 후 별도 단계.
export const metadata: Metadata = {
  title: '홈 · Rentailor — 시네마틱 허브 (프리뷰)',
  robots: { index: false, follow: false },
};

export default function HomeCinematicPreviewPage() {
  return <HomeCinematic />;
}
