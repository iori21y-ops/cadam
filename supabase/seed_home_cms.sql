-- ============================================================
-- Seed — 홈 CMS 폴백 데이터(HomeCinematic.tsx FALLBACK_FEATURED_SLIDES / FALLBACK_SECTIONS 와 1:1).
-- 전제: 20260630120000_home_cms.sql 마이그레이션이 먼저 적용되어 두 테이블이 존재해야 함.
-- ⚠️ 재적용 시 전체 교체 — 아래 delete 로 기존 행을 모두 비우고 다시 넣는다(idempotent).
--    수동 편집/ERP로 추가한 행도 같이 지워지니 주의(시드는 '폴백과 동일한 초기 상태' 복원 용도).
-- 적용 예: psql/Studio 에서 이 파일 실행. (이 작업에선 적용 안 함 — 파일만)
-- ============================================================

-- ── 전체 교체 ────────────────────────────────────────────────
delete from billboard_slides;
delete from home_sections;

-- ── [1] billboard_slides — FALLBACK_FEATURED_SLIDES (TAGLINES 4종, display_order 순) ──
insert into billboard_slides (car_id, kicker, title, sub, display_order, is_active) values
  ('grandeur', '이달의 베스트셀러', E'대한민국이 가장\n많이 타는 세단', '신차 등록 1위 그랜저, 보험·세금 포함 월 렌트료로 시작하세요.', 0, true),
  ('ev9',      '지금 뜨는 신차',   E'7인승 대형 전기,\n새로 나왔습니다', 'EV9 — 1회 충전 501km, 보조금 반영 렌트료로 더 가볍게.',     1, true),
  ('gv70',     '프리미엄 추천',    E'프리미엄 SUV를\n월 단위로 누리다', '제네시스 GV70, 초기 비용 0원으로 시작하는 프리미엄.',         2, true),
  ('ioniq5',   '전기차 특가',      E'전기차, 렌트가\n더 쌀 수 있어요', '아이오닉 5 — 보조금이 렌트료에 반영돼 부담을 확 낮췄어요.',   3, true);

-- ── [2] home_sections — FALLBACK_SECTIONS (8행, display_order 순) ──
-- title 이 NULL 인 행(sales_rank/deals/clip/article)은 프론트가 컴포넌트 기본 장식 제목 사용.
-- params 는 타입별 구조 그대로(car_manual 없음 — 폴백엔 car_manual 행이 없음).
insert into home_sections (title, section_type, params, display_order, is_active) values
  (null,             'sales_rank', '{"limit":10}'::jsonb,                          0, true),
  (null,             'deals',      '{}'::jsonb,                                    1, true),
  ('새로 나온 전기차', 'car_filter', '{"fuel":"ev","isNew":true}'::jsonb,            2, true),
  (null,             'article',    '{"contentType":"clip"}'::jsonb,                3, true),
  ('추천 인기 차종',   'car_filter', '{"best":true}'::jsonb,                         4, true),
  (null,             'article',    '{"contentType":"article"}'::jsonb,             5, true),
  ('가성비 좋은 차',   'car_filter', '{"fromMax":64,"sort":"from_asc"}'::jsonb,       6, true),
  ('프리미엄 · 대형',  'car_filter', '{"segment":"premium"}'::jsonb,                 7, true);

-- 비고:
--  · 'car_filter' best/isNew 행은 폴백 그대로 넣음. 현재 RT_CATALOG 는 best/isNew 가 전부 false 라
--    프론트에서 빈 행으로 처리(미렌더)되지만, 시드는 임의로 값을 채우지 않고 폴백 정의를 그대로 보존.
--  · 'more'(전체 → 링크)는 프론트 SectionRenderer 기본값('/popular-estimates')을 쓰므로 테이블에 저장 안 함.
