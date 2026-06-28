-- ============================================================
-- Migration — 모듈 9(통계 집계뷰 4종) + 모듈 10(audit_log + 트리거)
-- ============================================================

-- ── 모듈 9: 집계 뷰 ──────────────────────────────────────────
create or replace view v_funnel_monthly as
select date_trunc('month', created_at)::date as month,
  count(*) as leads,
  count(*) filter (where status in ('상담중','견적발송','계약')) as engaged,
  count(*) filter (where consult_result = '계약' or status = '계약') as contracted
from consultations group by 1 order by 1 desc;

create or replace view v_demand_by_model as
select car_brand, car_model, count(*) as leads,
  count(*) filter (where consult_result = '계약' or status = '계약') as contracts,
  round(avg(lead_score)) as avg_score
from consultations where car_model is not null
group by 1, 2 order by leads desc;

create or replace view v_manager_perf as
select m.id as manager_id, m.name, m.type, m.role,
  count(ls.id) as leads_sold,
  coalesce(sum(ls.sale_price), 0) as lead_sales_amount,
  coalesce((select sum(fee_amount) from success_fees sf where sf.manager_id = m.id and sf.status in ('confirmed','paid')), 0) as success_fee_total
from managers m
left join lead_sales ls on ls.manager_id = m.id and ls.status = 'sold'
group by m.id, m.name, m.type, m.role;

create or replace view v_lead_quality_monthly as
select date_trunc('month', created_at)::date as month,
  round(avg(lead_score)) as avg_score,
  count(*) filter (where lead_score >= 70) as hot,
  count(*) filter (where lead_score >= 40 and lead_score < 70) as warm,
  count(*) filter (where lead_score < 40 or lead_score is null) as cold
from consultations group by 1 order by 1 desc;

-- ── 모듈 10: 감사 로그 ───────────────────────────────────────
create table if not exists audit_log (
  id          bigint generated always as identity primary key,
  actor       text,        -- 행위자(이메일/매니저) — BFF 가 set_config('app.actor',...) 또는 JWT
  module      text,        -- consult/lead-market/settlement/members/...
  action      text,        -- insert/update/delete/approve/reject
  target_type text,
  target_id   text,
  detail      jsonb,
  created_at  timestamptz default now()
);
create index if not exists idx_audit_created on audit_log(created_at desc);
create index if not exists idx_audit_module on audit_log(module, created_at desc);

alter table audit_log enable row level security;
drop policy if exists audit_internal_read on audit_log;
create policy audit_internal_read on audit_log for select to authenticated using (erp_is_internal_lead());
-- 쓰기는 트리거(security definer)·BFF service_role.

-- 행위자 추출(BFF GUC app.actor 우선 → JWT email → system)
create or replace function audit_row_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_actor text;
begin
  v_actor := coalesce(
    nullif(current_setting('app.actor', true), ''),
    nullif(current_setting('request.jwt.claim.email', true), ''),
    'system');
  insert into audit_log(actor, module, action, target_type, target_id, detail)
  values (v_actor, tg_argv[0], lower(tg_op), tg_table_name,
    (case when tg_op = 'DELETE' then old.id else new.id end)::text,
    case when tg_op = 'UPDATE' then jsonb_build_object('old_status', old.status, 'new_status', new.status) else null end);
  return case when tg_op = 'DELETE' then old else new end;
end; $$;

-- 상담 상태변경 감사(핵심 이벤트). 확장 시 다른 테이블에 동일 트리거 부착.
drop trigger if exists trg_audit_consultations on consultations;
create trigger trg_audit_consultations after update on consultations
  for each row when (old.status is distinct from new.status)
  execute function audit_row_change('consult');

-- 롤백: drop trigger trg_audit_consultations on consultations; drop function audit_row_change; drop table audit_log; drop view v_*;
