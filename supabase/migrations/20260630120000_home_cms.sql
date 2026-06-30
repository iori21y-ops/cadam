-- ============================================================
-- Migration — 홈 CMS: 빌보드 슬라이드 + 섹션 행 구성 테이블 + RLS
-- 목적: home-cinematic 홈의 빌보드 슬라이드/섹션 행을 하드코딩 → DB 구동으로 전환하기 위한 백킹 테이블.
-- 멱등: create table if not exists / create policy 는 drop 후 재생성(if exists).
-- 보안 posture: 두 테이블 RLS ENABLE. 쓰기는 ERP service_role BFF 경유(service_role 은 RLS bypass → 별도 write 정책 불필요).
--   anon/authenticated 브라우저엔 'is_active=true 읽기'만 허용(promotions/vehicles_anon_read 패턴 동일).
-- updated_at: default now() 컬럼만 둠(전역 트리거 없음 — 기존 관례대로 BFF가 갱신).
-- home_sections.title 은 nullable — 섹션 제목은 옵셔널, null 이면 프론트가 컴포넌트 장식 기본 제목 사용
--   (sales_rank='TOP 10' 골드, deals='이번 주 특가' 코랄, clip/article 기본 제목). billboard_slides.title 은 필수.
-- ============================================================
create extension if not exists pgcrypto;

-- ── [1] billboard_slides — 빌보드 캐러셀 슬라이드 ─────────────
-- 슬라이드 1개 = 차종(car_id) + 저자 작성 카피(kicker/title/sub).
-- 이미지·가격·차종라벨은 런타임에 RT_CATALOG[car_id]에서 파생(여기 저장 안 함).
create table if not exists billboard_slides (
  id            uuid primary key default gen_random_uuid(),
  car_id        text not null,                    -- RT_CATALOG 차종 id (예 'grandeur','ev9','gv70','ioniq5')
  kicker        text not null,                    -- 뱃지 텍스트 (예 '이달의 베스트셀러')
  title         text not null,                    -- 제목 (\n 줄바꿈 허용)
  sub           text,                             -- 설명
  display_order int  not null default 0,          -- 슬라이드 노출 순서(오름차순)
  is_active     boolean not null default true,    -- 노출 여부(anon 은 true 만 read)
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── [2] home_sections — 가로 스크롤 섹션 행 구성 ─────────────
-- section_type 별 params(jsonb) 구조:
--   car_filter  → { "segment":"suv"|"sedan"|"premium", "fuel":"ev"|"gasoline"|"diesel"|"hybrid",
--                   "best":true, "isNew":true, "fromMax":64, "sort":"from_asc", "limit":12 }
--                 (지정된 키만 AND 필터로 적용. 예: {"segment":"suv","limit":12})
--   car_manual  → { "car_ids":["ioniq5","ev6","gv70"] }   -- RT_CATALOG 차종 id 배열, 배열 순서 = 노출 순서
--   sales_rank  → { "limit":10 }                          -- car_sales_monthly 실판매 TOP N
--   deals       → { "limit":8 }                           -- 특가(현재 하드코딩, 추후 특가테이블 연동)
--   article     → { "contentType":"clip"|"article", "limit":10 }  -- /api/info-articles 분류별
create table if not exists home_sections (
  id            uuid primary key default gen_random_uuid(),
  title         text,                             -- 행 제목(옵셔널, null=프론트 장식 기본 제목 사용. 예 '인기 SUV')
  section_type  text not null
                  check (section_type in ('car_filter','car_manual','sales_rank','deals','article')),
  params        jsonb not null default '{}',      -- 타입별 파라미터(위 주석 참고)
  display_order int  not null default 0,          -- 행 노출 순서(오름차순)
  is_active     boolean not null default true,    -- 노출 여부(anon 은 true 만 read)
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── display_order 인덱스 ─────────────────────────────────────
create index if not exists idx_billboard_slides_order on billboard_slides(display_order);
create index if not exists idx_home_sections_order   on home_sections(display_order);

-- ── RLS — promotions 패턴(B안): anon=활성행 읽기만 / authenticated=전체권한. write 는 service_role bypass ──
alter table billboard_slides enable row level security;
alter table home_sections    enable row level security;

-- billboard_slides
drop policy if exists billboard_slides_pub_read_active   on billboard_slides; -- 구 정책(있으면) 제거
drop policy if exists billboard_slides_anon_select        on billboard_slides;
drop policy if exists billboard_slides_authenticated_all  on billboard_slides;
create policy billboard_slides_anon_select on billboard_slides
  for select to anon using (is_active = true);
create policy billboard_slides_authenticated_all on billboard_slides
  for all to authenticated using (true) with check (true);

-- home_sections
drop policy if exists home_sections_pub_read_active   on home_sections; -- 구 정책(있으면) 제거
drop policy if exists home_sections_anon_select       on home_sections;
drop policy if exists home_sections_authenticated_all on home_sections;
create policy home_sections_anon_select on home_sections
  for select to anon using (is_active = true);
create policy home_sections_authenticated_all on home_sections
  for all to authenticated using (true) with check (true);

-- 롤백:
--   drop policy if exists billboard_slides_anon_select on billboard_slides;
--   drop policy if exists billboard_slides_authenticated_all on billboard_slides;
--   drop policy if exists home_sections_anon_select on home_sections;
--   drop policy if exists home_sections_authenticated_all on home_sections;
--   drop index if exists idx_billboard_slides_order; drop index if exists idx_home_sections_order;
--   drop table if exists billboard_slides; drop table if exists home_sections;
