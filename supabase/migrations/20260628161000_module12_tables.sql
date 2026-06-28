-- ============================================================
-- Migration — 모듈 12(§6.12E) 신규 테이블 + RLS
--   capital_directory·car_model_alias·contract_vehicles·recalls·site_pages·market_rates
--   RLS: 고객 노출(공개읽기) vs 운영전용(service_role) vs PII(본인) 구분.
-- ============================================================

-- 캐피탈 디렉토리(계약 케어 — 고객 노출). capital_id 텍스트 PK.
create table if not exists capital_directory (
  capital_id     text primary key,
  name           text not null,            -- 한글명
  cs_phone       text, cs_hours text, accident_phone text,
  issue_menus    jsonb,                     -- 부채증명·상환스케줄·사업자서류 발급경로
  early_term_rate numeric,                  -- 중도상환수수료율
  excess_km_rate  bigint,                   -- 초과운행 km 단가
  homepage       text, updated_by text, updated_at timestamptz default now()
);

-- 판매순위 차종 매핑(크롤 문자열 → 우리 slug). 운영 전용.
create table if not exists car_model_alias (
  id           uuid primary key default gen_random_uuid(),
  sales_brand  text, sales_model text,
  vehicle_slug text,                         -- nullable(미보유=정보만)
  confidence   numeric, updated_by text, created_at timestamptz default now(),
  unique (sales_brand, sales_model)
);

-- 계약/자가 차량(내 차고·리콜 영향). PII(VIN·plate).
create table if not exists contract_vehicles (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid references members(id) on delete set null,
  consultation_id uuid references consultations(id) on delete set null,
  vin           text, plate text, reg_date date, odo int, color text,
  maker         text, model text, model_slug text, year int,
  source        text default 'contract' check (source in ('contract','molit','manual')),
  created_at    timestamptz default now()
);

-- 리콜(data.go.kr 수집 → 매칭 → 알림). 고객 노출(공개읽기).
create table if not exists recalls (
  id          uuid primary key default gen_random_uuid(),
  maker       text, model text, model_slug text, year int,
  part        text, title text, action text, recall_no text,
  source      text default 'data.go.kr', collected_at timestamptz default now(),
  unique (recall_no)
);

-- 사이트 노출 제어(고객 사이트 게이트가 읽음 — 공개읽기).
create table if not exists site_pages (
  page_key    text primary key,
  status      text not null default 'live' check (status in ('live','hidden','maintenance','wip','error')),
  reason      text, updated_by text, updated_at timestamptz default now()
);

-- 시장금리 스냅샷(고객 마켓 인사이트 — 공개읽기 활성건).
create table if not exists market_rates (
  id            uuid primary key default gen_random_uuid(),
  indicator     text not null,              -- base_rate / auto_loan_avg
  rate          numeric not null, effective_date date,
  source        text check (source in ('ecos','manual','vendor')),
  memo          text, display_comment text, -- 고객 노출 해석 한 줄
  is_active     boolean default true, collected_at timestamptz default now()
);

create index if not exists idx_recalls_slug on recalls(model_slug);
create index if not exists idx_cv_member on contract_vehicles(member_id);
create index if not exists idx_market_active on market_rates(indicator, is_active, effective_date desc);

-- ── RLS ──────────────────────────────────────────────────────
alter table capital_directory enable row level security;
alter table car_model_alias   enable row level security;
alter table contract_vehicles enable row level security;
alter table recalls           enable row level security;
alter table site_pages        enable row level security;
alter table market_rates      enable row level security;

-- 공개읽기(고객 사이트 anon): capital_directory·recalls·site_pages·활성 market_rates
drop policy if exists pub_read on capital_directory;
create policy pub_read on capital_directory for select using (true);
drop policy if exists pub_read on recalls;
create policy pub_read on recalls for select using (true);
drop policy if exists pub_read on site_pages;
create policy pub_read on site_pages for select using (true);
drop policy if exists pub_read_active on market_rates;
create policy pub_read_active on market_rates for select using (is_active = true);

-- car_model_alias: 정책 없음 = service_role(운영 BFF) 전용.
-- contract_vehicles: PII → 본인(회원 Auth 세션) 또는 내부 admin/manager. 쓰기·운영은 service_role BFF.
drop policy if exists cv_owner_or_internal on contract_vehicles;
create policy cv_owner_or_internal on contract_vehicles for select to authenticated
  using (erp_is_internal_lead() or member_id in (select id from members where auth_user_id = auth.uid()));

-- 롤백: drop table market_rates, site_pages, recalls, contract_vehicles, car_model_alias, capital_directory;
