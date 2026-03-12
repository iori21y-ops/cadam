-- 테스트용 정보 포스팅 데이터 (블로그/유튜브)
-- Supabase SQL Editor에서 실행

INSERT INTO info_articles (title, excerpt, link_url, thumbnail_url, source_type, published_at, display_order) VALUES
(
  '장기렌터카 vs 리스, 뭐가 다를까?',
  '장기렌터카와 리스의 차이점, 세금 처리, 비용 비교를 쉽게 설명합니다.',
  'https://www.youtube.com/watch?v=9bZkp7q19f0',
  'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg',
  'youtube',
  NOW() - INTERVAL '5 days',
  1
),
(
  '2025년 장기렌터카 인기 차종 TOP 5',
  '올해 가장 인기 있는 장기렌터카 차종과 월 납부금 대략을 알아봅니다.',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
  'youtube',
  NOW() - INTERVAL '12 days',
  2
),
(
  '법인 장기렌터카 비용 처리 완벽 가이드',
  '법인사업자가 장기렌터카 비용을 어떻게 처리하는지, 세금 혜택을 정리했습니다.',
  'https://brunch.co.kr',
  NULL,
  'blog',
  NOW() - INTERVAL '20 days',
  3
),
(
  '보증금 0원 장기렌트, 괜찮을까?',
  '보증금 없이 장기렌트하는 조건과 주의사항을 알아봅니다.',
  'https://blog.naver.com',
  NULL,
  'blog',
  NOW() - INTERVAL '30 days',
  4
);
