import type { Metadata } from 'next';
import LegalContent from '../privacy-preview/LegalContent';

// 이용약관 리뉴얼 프리뷰 (시각 전용 · 운영 라우트와 분리, 검색 비노출)
// 본문 컴포넌트/스타일/데이터는 privacy-preview 와 공유한다.
export const metadata: Metadata = {
  title: '이용약관 — 리뉴얼 프리뷰',
  robots: { index: false, follow: false },
};

export default function TermsPreviewPage() {
  return <LegalContent which="terms" />;
}
