import HomeCinematic from './HomeCinematic';

// 홈 = 넷플릭스식 시네마틱 허브. next.config FLIP rewrite로 운영 '/'가 이 라우트를 서빙.
// metadata 미지정 → layout 기본 metadata(BRAND.title) 상속 = 색인 허용(noindex 제거).
//   ('/home-cinematic-preview' 직접 접근은 FLIP redirect로 '/' 301)

export default function HomeCinematicPreviewPage() {
  return <HomeCinematic />;
}
