-- ============================================================
-- Migration — 모듈 1(상담 관리): assigned_to→manager_id 보존 이관 + consultations 역할분기 RLS 스테이징
-- 현황(2026-06-28): assigned_to/manager_id 모두 0행 → 데이터 이관은 사실상 no-op,
--   향후/레거시 값 대비 보존 매핑(managers.name 매칭) 포함. 코드는 manager_id 로 전환.
-- ============================================================

-- 1) assigned_to(varchar, 레거시) → manager_id(FK) 보존 매핑
--    assigned_to 가 매니저명과 일치하면 manager_id 채움(현재 0행, 멱등). assigned_to 컬럼은
--    레거시 cadam-web /admin 호환 위해 유지(드롭 안 함). ERP 는 manager_id 를 정본으로 사용.
update consultations c
set manager_id = m.id
from managers m
where c.manager_id is null
  and c.assigned_to is not null and c.assigned_to <> ''
  and (c.assigned_to = m.name or c.assigned_to = m.id::text);

comment on column consultations.assigned_to is 'DEPRECATED — manager_id(FK) 사용. 레거시 /admin 호환 위해 유지.';

-- 2) consultations 역할분기 RLS (스테이징 — 레거시 authenticated 정책과 공존)
--    ⚠️ 기존 인터림 유지: consultations_anon_insert(리드폼)·consultations_authenticated_select(using true)·
--       _update. anon SELECT 차단 불변. 아래는 '역할 인지' 정책을 미리 얹는 것(forward).
--    OR 의미상 레거시 using(true) 가 살아있는 동안은 staff 전체 허용이 우세 → 본 정책은
--    레거시 /admin 은퇴 후 broad 정책 제거 시 실효. ERP 자체는 service_role BFF(RLS 우회) 사용.
drop policy if exists consultations_erp_role_read on consultations;
create policy consultations_erp_role_read on consultations for select to authenticated
  using (erp_is_internal_lead() or manager_id in (select erp_my_manager_ids()));

-- 롤백: drop policy consultations_erp_role_read on consultations;
