-- ============================================================
-- Rentailor ERP — Migration 001 (신규 운영 테이블)
-- 기준: 결정사항(2026-06-20) · 기존 66개 테이블/크롤 데이터는 건드리지 않음
-- 실행: Supabase SQL Editor 또는 Management API
-- 멱등성: create table if not exists / add column if not exists 사용
-- ============================================================

-- pgcrypto (gen_random_uuid) — Supabase 기본 제공
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1) managers — 매니저 마스터 (내부 상담사 + 외부 제휴 매니저)
-- ------------------------------------------------------------
create table if not exists managers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  type           text not null default 'internal'
                   check (type in ('internal','partner')),   -- 내부직원 / 외부제휴
  team           text,
  phone          text,
  email          text,
  status         text not null default 'active'
                   check (status in ('active','rest','suspended')),
  capacity       int default 30,                 -- 내부: 동시 보유 리드 한도
  wallet_balance bigint not null default 0,      -- 제휴: 충전 잔액(원)
  auth_user_id   uuid,                           -- Supabase Auth 연동(ERP 로그인)
  joined_at      timestamptz default now(),
  memo           text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ------------------------------------------------------------
-- 2) manager_lead_pricing — 매니저/구매사별 협의 단가 (등급별)
-- ------------------------------------------------------------
create table if not exists manager_lead_pricing (
  id           uuid primary key default gen_random_uuid(),
  manager_id   uuid not null references managers(id) on delete cascade,
  grade        text not null default 'default'
                 check (grade in ('hot','warm','cold','default')),
  agreed_price bigint not null,                  -- 리드 1건 단가(원)
  valid_from   date default current_date,
  valid_to     date,
  created_at   timestamptz default now(),
  unique (manager_id, grade)
);

-- ------------------------------------------------------------
-- 3) lead_sales — 리드 판매/배포 원장 (배포 단가 매출)
--    channel: distribute=운영자 배포 / self_purchase=제휴 매니저 직접 결제 구매
-- ------------------------------------------------------------
create table if not exists lead_sales (
  id              uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references consultations(id) on delete restrict,
  manager_id      uuid not null references managers(id) on delete restrict,
  channel         text not null default 'distribute'
                    check (channel in ('distribute','self_purchase')),
  sale_price      bigint not null,               -- 판매 단가(원)
  grade           text,                          -- 판매 시점 등급 스냅샷
  status          text not null default 'sold'
                    check (status in ('sold','refunded','void')),
  sold_at         timestamptz default now(),
  created_by      text,
  unique (consultation_id)        -- 리드 1건 1회 판매(중복 방지). 멀티판매 허용 시 제거.
);

-- ------------------------------------------------------------
-- 4) success_fees — 계약 성공보수 (계약 성사 시 매출)
-- ------------------------------------------------------------
create table if not exists success_fees (
  id              uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references consultations(id) on delete restrict,
  manager_id      uuid not null references managers(id) on delete restrict,
  lead_sale_id    uuid references lead_sales(id) on delete set null,
  fee_amount      bigint not null,               -- 성공보수(원)
  contract_ref    text,                          -- 계약 식별자
  status          text not null default 'pending'
                    check (status in ('pending','confirmed','paid','cancelled')),
  confirmed_at    timestamptz,
  created_at      timestamptz default now()
);

-- ------------------------------------------------------------
-- 5) wallet_transactions — 매니저 지갑 거래 (충전/구매차감/환불/정산)
-- ------------------------------------------------------------
create table if not exists wallet_transactions (
  id               uuid primary key default gen_random_uuid(),
  manager_id       uuid not null references managers(id) on delete cascade,
  type             text not null
                     check (type in ('topup','purchase','refund','adjustment','payout')),
  amount           bigint not null,              -- +충전 / -차감 (원)
  balance_after    bigint not null,
  ref_lead_sale_id uuid references lead_sales(id) on delete set null,
  method           text,                         -- card/bank/manual
  status           text not null default 'completed'
                     check (status in ('pending','completed','failed')),
  memo             text,
  created_at       timestamptz default now()
);

-- ------------------------------------------------------------
-- 6) members — 회원(고객) · 최소 정보 가입 (휴대폰 + 이름 + 동의)
-- ------------------------------------------------------------
create table if not exists members (
  id               uuid primary key default gen_random_uuid(),
  phone            text unique not null,
  name             text,
  email            text,
  consent_marketing boolean default false,
  signup_source    text,                         -- landing/diag/...
  auth_user_id     uuid,                         -- Supabase Auth(휴대폰 OTP) 연동
  created_at       timestamptz default now(),
  last_active_at   timestamptz
);

-- consultations <-> members / managers 연결 (기존 컬럼 보존, 신규 FK 추가)
alter table consultations add column if not exists member_id  uuid references members(id);
alter table consultations add column if not exists manager_id uuid references managers(id);
-- 기존 assigned_to(varchar)는 레거시 유지 → manager_id로 점진 이관

-- ------------------------------------------------------------
-- 7) reviews — 고객 후기 (사용자 페이지 '고객 후기' 소스)
-- ------------------------------------------------------------
create table if not exists reviews (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid references members(id) on delete set null,
  display_name  text,                            -- 마스킹 표시명
  car           text,
  method        text,                            -- 장기렌트 48개월 등
  rating        smallint check (rating between 1 and 5),
  title         text,
  body          text,
  saved_was     int,
  saved_now     int,
  status        text not null default 'pending'
                  check (status in ('pending','published','hidden')),
  created_at    timestamptz default now(),
  published_at  timestamptz
);

-- ------------------------------------------------------------
-- 8) expenses — 비용 원장 (통합 비용·손익용)
--    매출 = lead_sales + success_fees, 비용 = expenses
-- ------------------------------------------------------------
create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  category    text not null
                check (category in ('infra','ad','llm_api','server','payroll','tool','etc')),
  label       text not null,
  amount      bigint not null,                   -- 지출(원)
  occurred_on date not null default current_date,
  recurring   text,                              -- monthly/once
  memo        text,
  created_at  timestamptz default now()
);

-- ------------------------------------------------------------
-- 인덱스
-- ------------------------------------------------------------
create index if not exists idx_lead_sales_manager  on lead_sales(manager_id);
create index if not exists idx_lead_sales_sold_at   on lead_sales(sold_at);
create index if not exists idx_lead_sales_consult   on lead_sales(consultation_id);
create index if not exists idx_wallet_mgr           on wallet_transactions(manager_id, created_at);
create index if not exists idx_success_mgr          on success_fees(manager_id);
create index if not exists idx_consult_manager      on consultations(manager_id);
create index if not exists idx_consult_member       on consultations(member_id);
create index if not exists idx_reviews_status       on reviews(status);
create index if not exists idx_expenses_date        on expenses(occurred_on);

-- ------------------------------------------------------------
-- 9) v_pnl_monthly — 월별 손익(P&L) 뷰
-- ------------------------------------------------------------
create or replace view v_pnl_monthly as
with rev_sale as (
  select date_trunc('month', sold_at)::date m, sum(sale_price) amt
  from lead_sales where status = 'sold' group by 1),
rev_fee as (
  select date_trunc('month', confirmed_at)::date m, sum(fee_amount) amt
  from success_fees where status in ('confirmed','paid') group by 1),
cost as (
  select date_trunc('month', occurred_on)::date m, sum(amount) amt
  from expenses group by 1)
select
  coalesce(rs.m, rf.m, c.m)                                   as month,
  coalesce(rs.amt,0)                                          as lead_sales_revenue,
  coalesce(rf.amt,0)                                          as success_fee_revenue,
  coalesce(rs.amt,0) + coalesce(rf.amt,0)                     as total_revenue,
  coalesce(c.amt,0)                                           as total_cost,
  coalesce(rs.amt,0) + coalesce(rf.amt,0) - coalesce(c.amt,0) as net_profit
from rev_sale rs
full join rev_fee rf on rs.m = rf.m
full join cost   c  on coalesce(rs.m, rf.m) = c.m
order by month desc;

-- ------------------------------------------------------------
-- 10) (선택) RLS — 제휴 매니저는 본인 데이터만.  ERP BFF는 service_role로 우회.
--     Supabase Auth 연동 확정 후 활성화 권장. 아래는 예시(주석 처리).
-- ------------------------------------------------------------
-- alter table lead_sales          enable row level security;
-- alter table wallet_transactions enable row level security;
-- alter table success_fees        enable row level security;
-- create policy mgr_own_sales on lead_sales
--   for select using (
--     manager_id in (select id from managers where auth_user_id = auth.uid())
--   );
-- create policy mgr_own_wallet on wallet_transactions
--   for select using (
--     manager_id in (select id from managers where auth_user_id = auth.uid())
--   );

-- ============================================================
-- 끝. 롤백이 필요하면 아래 순서로 drop (역순):
--   drop view v_pnl_monthly;
--   drop table expenses, reviews, wallet_transactions, success_fees,
--              lead_sales, manager_lead_pricing;
--   alter table consultations drop column member_id, drop column manager_id;
--   drop table members, managers;
-- ============================================================
