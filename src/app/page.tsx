// 홈 '/' — 시네마틱 허브로 승격 (a방식).
// HomeCinematic 은 'use client' — 빌보드/섹션 데이터를 클라에서 /api/home-cms·useSalesRank·/api/info-articles 로
//   자체 fetch (폴백 초기값 보유 → 첫 페인트 빈 화면 없음). 서버 프리페치 불필요해 제거.
// 색인: layout 기본 metadata(BRAND.title) 그대로 사용 — noindex 미적용(프리뷰의 robots/제목 metadata 미복사).
// 롤백: 이 파일을 HomeClient 렌더(직전 커밋 4c90351 page.tsx)로 되돌리면 됨. HomeClient.tsx 는 보존(미삭제).
import HomeCinematic from './(redesign)/home-cinematic-preview/HomeCinematic';

export default function HomePage() {
  return <HomeCinematic />;
}
