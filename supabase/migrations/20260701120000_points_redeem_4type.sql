-- ============================================================
-- Migration — 포인트 사용정책 4종 확장 (%기반 통일)
--   point_redeem_policy: max_per_contract(원 절대캡) → max_pct(%한도) 모델로 전환.
--   기존 contract_support 는 삭제 않고 보존(is_active=false).
--   신규 4종(deductible/earlyterm/excess/buyout) 추가, min_balance 공통 5000.
--   원장(point_transactions)·규칙(point_rules) 테이블은 무변경. RLS/grant 기존 유지.
-- ============================================================

-- 1) 컬럼 추가 (%한도 + 부연설명). ADD COLUMN IF NOT EXISTS 로 멱등.
alter table point_redeem_policy add column if not exists max_pct int;   -- 지원 비용 대비 최대 사용률(%)
alter table point_redeem_policy add column if not exists sub     text;  -- 부연 설명(비용 항목 안내)

comment on column point_redeem_policy.max_pct is '지원 비용 대비 최대 사용률(%). %모델에서 사용, 절대캡(max_per_contract) 대체';
comment on column point_redeem_policy.sub     is '비용 항목 부연 설명(고객 화면 안내)';

-- 2) 기존 contract_support 행 비활성(삭제 아닌 보존 — 이력·롤백 대비)
update point_redeem_policy set is_active = false where key = 'contract_support';

-- 3) 4종 정책 시드 (%모델: max_per_contract NULL, min_balance 5000 공통). on conflict 멱등.
insert into point_redeem_policy (key, label, max_pct, sub, max_per_contract, min_balance, is_active) values
  ('deductible','사고 면책금',    50,  '사고 수리 자기부담금', null, 5000, true),
  ('earlyterm', '중도해지 수수료', 50,  '중도상환 위약금',      null, 5000, true),
  ('excess',    '초과주행금',      100, '약정 초과 주행 정산',   null, 5000, true),
  ('buyout',    '만기 인수가',     30,  '만기 인수 시 차감',     null, 5000, true)
on conflict (key) do nothing;

-- 롤백:
--   delete from point_redeem_policy where key in ('deductible','earlyterm','excess','buyout');
--   update point_redeem_policy set is_active = true where key = 'contract_support';
--   alter table point_redeem_policy drop column if exists max_pct;
--   alter table point_redeem_policy drop column if exists sub;
