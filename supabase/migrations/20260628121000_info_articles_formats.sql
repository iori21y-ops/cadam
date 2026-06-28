-- ============================================================
-- Migration 003 — info_articles 다포맷/회원 컬럼 (§14.5 · 트랙 B 1조 선행)
-- 대상: content_type(article/clip/card) · duration · cards(jsonb) · access(free/member)
-- 멱등성: add column if not exists. 미보강 시 렌더는 article·free 폴백.
-- ⚠️ 참고: 이 4개 컬럼은 migration_002(PART A)에서 이미 선반영됨 →
--          본 파일은 1조 작업의 명시적 선행 문서이자 재적용 시 no-op(안전).
-- ============================================================

alter table info_articles add column if not exists content_type text not null default 'article'
  check (content_type in ('article','clip','card'));   -- 본문 글 / 세로 쇼츠 / 카드뉴스
alter table info_articles add column if not exists access text not null default 'free'
  check (access in ('free','member'));                 -- 비회원 열람 / 회원 전용
alter table info_articles add column if not exists duration text;   -- clip 영상 길이 "0:45"
alter table info_articles add column if not exists cards jsonb;     -- card 슬라이드 [{t,d}]

create index if not exists idx_info_content_type on info_articles(content_type);
create index if not exists idx_info_access on info_articles(access);

-- 롤백(필요 시):
--   alter table info_articles drop column content_type, drop column access,
--     drop column duration, drop column cards;
