-- ============================================================
-- Migration — 회원 포인트(point_*) : 적립 규칙 + 사용 정책 + 원장 + RLS (웨이브3b B4)
-- 회원 접근은 BFF(service_role + 커스텀 세션) 경유. 원장은 deny-default(PII), 규칙/정책은 공개읽기.
-- ============================================================

-- 적립 규칙(가입·견적·상담·계약·후기·추천·무사고 등)
create table if not exists point_rules (
  id          uuid primary key default gen_random_uuid(),
  event_key   text unique not null,        -- signup/quote/consult/contract/review/referral/intake/noaccident
  label       text not null,
  points      int not null default 0,
  tier_mult   jsonb,                        -- 등급별 적립률 배수
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- 사용 정책(계약비용 지원 한도 등)
create table if not exists point_redeem_policy (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  label       text not null,
  max_per_contract int,                     -- 계약당 최대 사용
  min_balance int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- 포인트 원장(적립/사용)
create table if not exists point_transactions (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  type        text not null check (type in ('earn','redeem','expire','adjust')),
  label       text,
  amount      int not null,                 -- earn=+ / redeem=-
  balance_after int,
  method      text,                         -- 지급/사용 수단(kakaopay 등)
  ref         text,                         -- 계약/상담 참조
  status      text default 'confirmed' check (status in ('pending','confirmed','cancelled')),
  created_at  timestamptz default now()
);
create index if not exists idx_pt_member on point_transactions(member_id, created_at desc);

-- RLS
alter table point_rules           enable row level security;
alter table point_redeem_policy   enable row level security;
alter table point_transactions    enable row level security;

-- 적립 규칙·사용 정책 = 공개읽기(고객 화면 안내)
drop policy if exists pub_read on point_rules;
create policy pub_read on point_rules for select using (is_active = true);
drop policy if exists pub_read on point_redeem_policy;
create policy pub_read on point_redeem_policy for select using (is_active = true);
-- 원장 = 정책 없음 = service_role BFF 전용(회원 본인 조회는 BFF 세션 경유, PII 보호)

-- 기본 적립 규칙 시드(멱등)
insert into point_rules (event_key, label, points) values
  ('signup','회원가입',1000),('quote','견적 신청',500),('consult','상담 완료',1000),
  ('contract','계약 체결',5000),('review','후기 작성',2000),('referral','친구 추천',3000),
  ('intake','상담 인테이크',500),('noaccident','무사고 유지',1000)
on conflict (event_key) do nothing;
insert into point_redeem_policy (key, label, max_per_contract, min_balance) values
  ('contract_support','계약비용 지원',50000,5000)
on conflict (key) do nothing;

-- 롤백: drop table point_transactions, point_redeem_policy, point_rules;

-- grant(PostgREST 노출): 규칙/정책 공개읽기, 원장 authenticated
grant select on point_rules, point_redeem_policy to anon, authenticated;
grant select on point_transactions to authenticated;
