-- ============================================================
-- Migration — 트랙 A 기반: managers.role(RBAC) + 핵심 테이블 partner 격리 RLS (§12.2)
-- 역할: managers.role = admin/manager/editor/dev (내부 staff). partner 는 type='partner'·role NULL.
-- RLS 분기: 내부 admin/manager = 전체 / 제휴 partner = 본인(manager_id) 행만 / 그 외(anon·미인증)=0.
-- ERP BFF 는 service_role(우회) — 이 RLS 는 인증 클라이언트(파트너 셀프서비스) 백스톱·격리 강제.
-- ============================================================

-- 1) managers.role (RBAC) — 내부 직원 역할. partner 는 NULL.
alter table managers add column if not exists role text
  check (role is null or role in ('admin','manager','editor','dev'));

-- 2) 판정 헬퍼: 현재 인증 사용자가 '내부 admin/manager'인가 (전체 열람 권한)
create or replace function erp_is_internal_lead() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from managers m
    where m.auth_user_id = auth.uid()
      and m.type = 'internal' and m.role in ('admin','manager')
  );
$$;

-- 3) 현재 인증 사용자의 manager id 집합 (본인 행 판정)
create or replace function erp_my_manager_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from managers where auth_user_id = auth.uid();
$$;

-- 4) 핵심 테이블 RLS — partner 격리 / internal 전체
--    (lead_sales·wallet_transactions·manager_lead_pricing: 레거시 앱 미사용 확인 → 안전)
alter table lead_sales            enable row level security;
alter table wallet_transactions   enable row level security;
alter table manager_lead_pricing  enable row level security;

drop policy if exists erp_partner_or_internal_read on lead_sales;
create policy erp_partner_or_internal_read on lead_sales for select
  using (erp_is_internal_lead() or manager_id in (select erp_my_manager_ids()));

drop policy if exists erp_partner_or_internal_read on wallet_transactions;
create policy erp_partner_or_internal_read on wallet_transactions for select
  using (erp_is_internal_lead() or manager_id in (select erp_my_manager_ids()));

drop policy if exists erp_partner_or_internal_read on manager_lead_pricing;
create policy erp_partner_or_internal_read on manager_lead_pricing for select
  using (erp_is_internal_lead() or manager_id in (select erp_my_manager_ids()));

-- ⚠️ consultations RLS 는 보류: cadam-web 레거시 /admin(callbacks·dashboard·ConsultationTable/Detail)이
--    인증 세션(비-service_role)으로 consultations 를 읽음 → RLS 켜면 admin 0행(미파손 위해 보류).
--    선행: 레거시 /admin 을 service_role BFF 로 전환 또는 admin auth_user_id 를 managers(internal/admin)에 매핑.
--    그 후 동일 정책(erp_is_internal_lead() or manager_id in erp_my_manager_ids()) 적용.

-- ⚠️ SELECT 격리만(쓰기·셀프구매 INSERT 는 BFF service_role + 코드 검증). 쓰기 정책은 후속.
-- ⚠️ ERP BFF(service_role)는 RLS 우회 — 내부 운영 화면은 코드 RBAC 로 권한 통제(이중 방어).
-- 롤백: 각 테이블 disable row level security; drop policy; drop function; alter managers drop column role;
