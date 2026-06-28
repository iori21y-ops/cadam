import type { Metadata } from 'next';
import LegalContent from './LegalContent';

// 개인정보처리방침 리뉴얼 프리뷰 (시각 전용 · 운영 라우트와 분리, 검색 비노출)
export const metadata: Metadata = {
  title: '개인정보처리방침 — 리뉴얼 프리뷰',
  robots: { index: false, follow: false },
};

export default function PrivacyPreviewPage() {
  return <LegalContent which="privacy" />;
}
