-- ============================================================
-- Rentailor ERP — Migration 002 (마케팅 모듈 + info_articles 확장)
-- 기준: 구현 명세서 §4(마케팅 관리)·§13.2·§3.4A/B·§14.5
--       마케팅 컬럼은 프로토타입 정본 erp-marketing-data.jsx에서 도출
-- 멱등성: create table if not exists / add column if not exists
-- 파괴적 구문 없음(전부 추가형). 롤백 안내는 파일 하단 주석.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- PART A. info_articles 확장 컬럼 (다포맷 + 게스트가드 + 큐레이션)
--   기존 15컬럼 보존, 신규 9컬럼만 추가. 미지정 시 article/free 폴백.
-- ============================================================
alter table info_articles add column if not exists content_type text not null default 'article'
  check (content_type in ('article','clip','card'));      -- §3.4A 본문/쇼츠/카드뉴스
alter table info_articles add column if not exists access text not null default 'free'
  check (access in ('free','member'));                    -- §3.4B 비회원/회원전용
alter table info_articles add column if not exists duration text;        -- clip 영상 길이 "0:45"
alter table info_articles add column if not exists cards jsonb;          -- card 슬라이드 [{t,d}]
alter table info_articles add column if not exists tips jsonb;           -- clip 핵심 팁 3개 §3.4A-1
alter table info_articles add column if not exists hue text;             -- clip 썸네일 그라데이션 색상
alter table info_articles add column if not exists featured boolean not null default false; -- 에디터 추천
alter table info_articles add column if not exists click_count integer not null default 0;   -- 조회/클릭 집계
alter table info_articles add column if not exists vehicle_tags text[];   -- 연관 차종 다건(기존 vehicle_slug는 단건 유지)

create index if not exists idx_info_content_type on info_articles(content_type);
create index if not exists idx_info_access        on info_articles(access);
create index if not exists idx_info_featured      on info_articles(featured) where featured = true;

-- ============================================================
-- PART B. 마케팅 관리 모듈 (8테이블) — §13.2 #3
--   금액 단위: 원(bigint). 월: 'YYYY-MM' 텍스트(이력 보존).
--   채널/캠페인/키워드 성과는 월별 적재(MoM 비교) → (key, month) 유니크.
-- ============================================================

-- 1) marketing_channels — 채널 마스터 + 월별 성과 (MKT_CHANNELS)
create table if not exists marketing_channels (
  id           uuid primary key default gen_random_uuid(),
  channel_key  text not null,                  -- naver_sa/google_sa/meta/youtube/kakao/naver_gfa/organic
  month        text not null,                  -- 'YYYY-MM'
  name         text not null,
  type         text check (type in ('search','social','video','display','organic')),
  paid         boolean not null default true,
  color        text,
  cost         bigint default 0,
  imp          bigint default 0,
  clk          bigint default 0,
  sessions     bigint default 0,
  leads        int    default 0,
  contracts    int    default 0,
  revenue      bigint default 0,
  prev         jsonb,                           -- 전월 동기간 {cost,leads,contracts,revenue}
  is_active    boolean not null default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (channel_key, month)
);

-- 2) marketing_campaigns — 캠페인(채널 하위) (MKT_CAMPAIGNS)
create table if not exists marketing_campaigns (
  id           uuid primary key default gen_random_uuid(),
  campaign_key text,                            -- 프로토타입 id(c1..)
  channel_key  text not null,
  month        text not null,
  name         text not null,
  status       text not null default 'active'
                 check (status in ('active','paused','ended')),
  budget       bigint default 0,
  spent        bigint default 0,
  imp          bigint default 0,
  clk          bigint default 0,
  leads        int    default 0,
  contracts    int    default 0,
  revenue      bigint default 0,
  utm          text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 3) marketing_keywords — 검색광고 키워드 (MKT_KEYWORDS)
create table if not exists marketing_keywords (
  id           uuid primary key default gen_random_uuid(),
  keyword      text not null,
  channel_key  text not null,
  month        text not null,
  imp          bigint default 0,
  clk          bigint default 0,
  cost         bigint default 0,
  leads        int    default 0,
  contracts    int    default 0,
  bid          int    default 0,                -- 현재 입찰가(원)
  rank         numeric,                         -- 평균 노출순위
  memo         text,
  created_at   timestamptz default now(),
  unique (keyword, channel_key, month)
);

-- 4) marketing_integrations — 채널 데이터소스 연동 상태 (MKT_INTEGRATIONS)
create table if not exists marketing_integrations (
  id           uuid primary key default gen_random_uuid(),
  channel_key  text not null unique,
  api          text,
  status       text not null default 'manual'
                 check (status in ('connected','error','manual','disconnected')),
  account      text,                            -- 마스킹된 계정 식별자
  last_sync    timestamptz,                     -- 수기 채널은 NULL(note에 표기)
  note         text,
  updated_at   timestamptz default now()
);

-- 5) marketing_goals — 월별 목표(CPL/CPA/ROAS) (MKT_GOALS)
create table if not exists marketing_goals (
  id           uuid primary key default gen_random_uuid(),
  month        text not null unique,
  cpl          bigint,                          -- 목표 리드단가(원)
  cpa          bigint,                          -- 목표 계약단가(원)
  roas         numeric,                         -- 목표 ROAS
  created_at   timestamptz default now()
);

-- 6) marketing_plans — 예산 플래너(예상 vs 실제) (MKT_LAST_PLAN)
create table if not exists marketing_plans (
  id           uuid primary key default gen_random_uuid(),
  month        text not null unique,
  goal         text,                            -- balanced/aggressive/efficient...
  budget       bigint,
  rows         jsonb,                           -- [{key,planBudget,planLeads,actualSpent,actualLeads,actualContracts}]
  status       text not null default 'draft'
                 check (status in ('draft','approved','active','closed')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 7) marketing_agent_jobs — AI 광고운영 에이전트 주기작업 (MKT_AGENT_JOBS)
create table if not exists marketing_agent_jobs (
  id           uuid primary key default gen_random_uuid(),
  job_key      text unique,                     -- j1..
  name         text not null,
  schedule     text,                            -- "매일 08:00" 등 사람표기
  does         text,
  last_run     timestamptz,
  next_run     timestamptz,
  on_enabled   boolean not null default true,
  created_at   timestamptz default now()
);

-- 8) marketing_agent_proposals — 에이전트 제안(결재 대기) (MKT_AGENT_PROPOSALS)
create table if not exists marketing_agent_proposals (
  id            uuid primary key default gen_random_uuid(),
  proposal_key  text,                           -- ap1..
  type          text check (type in ('negative','budget','keyword','creative')),
  icon          text,
  title         text not null,
  detail        text,
  impact        text,
  sev           text check (sev in ('high','mid','low')),
  job           text,                           -- 생성 주기작업 이름
  status        text not null default 'pending'
                  check (status in ('pending','approved','rejected')),
  cta           text,
  cta_tab       text,
  created_at    timestamptz default now(),
  decided_at    timestamptz
);

create index if not exists idx_mkt_camp_channel on marketing_campaigns(channel_key, month);
create index if not exists idx_mkt_kw_channel    on marketing_keywords(channel_key, month);
create index if not exists idx_mkt_prop_status   on marketing_agent_proposals(status);

-- ============================================================
-- 참고(이번 마이그레이션 제외 — 별도 모듈):
--   marketing_sends / member_tags / member_memo / member_consents → '회원 관리' 모듈
--   audit_log / community_* → 결재·커뮤니티 모듈
--   marketing_funnel(MKT_FUNNEL)은 채널 합산 파생값 → 저장 대신 집계로 산출
-- ============================================================

-- ============================================================
-- 롤백(필요 시):
--   drop table marketing_agent_proposals, marketing_agent_jobs, marketing_plans,
--     marketing_goals, marketing_integrations, marketing_keywords,
--     marketing_campaigns, marketing_channels;
--   alter table info_articles
--     drop column content_type, drop column access, drop column duration,
--     drop column cards, drop column tips, drop column hue,
--     drop column featured, drop column click_count, drop column vehicle_tags;
-- ============================================================
