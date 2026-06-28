import type { Metadata } from 'next';
import SupportApp from './SupportApp';

// 고객센터·FAQ 리뉴얼 미리보기 (시각 전용 · 운영 라우트와 분리, 검색 비노출)
export const metadata: Metadata = {
  title: '고객센터 — 리뉴얼 미리보기',
  robots: { index: false, follow: false },
};

export default function SupportPreviewPage() {
  return <SupportApp />;
}
