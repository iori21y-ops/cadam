-- ============================================================
-- Migration — 모듈 2(리드 마켓·지갑): 원자 RPC(구매·충전) + 음수잔액 금지 + 파트너 RLS(구매 모델)
-- 원칙: 지갑 차감/판매는 단일 함수 1트랜잭션. 단순 UPDATE 금지. 음수 잔액 금지. 동일 리드 중복판매 금지.
-- ============================================================

-- 0) 음수 잔액 금지(방어)
alter table managers drop constraint if exists managers_wallet_nonneg;
alter table managers add constraint managers_wallet_nonneg check (wallet_balance >= 0);

-- 1) 리드 구매(셀프구매) — 원자: 잔액잠금→검증→lead_sales→wallet_tx(purchase)→잔액차감
create or replace function buy_lead(
  p_manager_id uuid, p_consultation_id uuid, p_sale_price bigint, p_grade text default null
) returns json language plpgsql security definer set search_path = public as $$
declare v_balance bigint; v_new_balance bigint; v_lead_sale_id uuid;
begin
  if p_sale_price is null or p_sale_price <= 0 then raise exception 'invalid_price'; end if;

  -- 매니저 잔액 행 잠금(동시성 직렬화)
  select wallet_balance into v_balance from managers where id = p_manager_id for update;
  if not found then raise exception 'manager_not_found'; end if;

  -- 잔액 검증(부족 시 예외 → 전체 롤백)
  if v_balance < p_sale_price then
    raise exception 'insufficient_balance' using detail = format('balance=%s price=%s', v_balance, p_sale_price);
  end if;
  v_new_balance := v_balance - p_sale_price;

  -- lead_sales insert — unique(consultation_id) 가 동일 리드 중복판매 차단
  begin
    insert into lead_sales(consultation_id, manager_id, channel, sale_price, grade, status)
    values (p_consultation_id, p_manager_id, 'self_purchase', p_sale_price, p_grade, 'sold')
    returning id into v_lead_sale_id;
  exception when unique_violation then
    raise exception 'already_sold';
  end;

  -- wallet_transactions(purchase) — 음수 amount, balance_after 기록
  insert into wallet_transactions(manager_id, type, amount, balance_after, ref_lead_sale_id, status)
  values (p_manager_id, 'purchase', -p_sale_price, v_new_balance, v_lead_sale_id, 'completed');

  -- 잔액 차감(잠근 행)
  update managers set wallet_balance = v_new_balance, updated_at = now() where id = p_manager_id;

  return json_build_object('lead_sale_id', v_lead_sale_id, 'new_balance', v_new_balance);
end; $$;

-- 2) 지갑 충전 — 동일 패턴. ⚠️ 실 PG(결제대행) 연동 자리: 현재 운영자 수동충전.
--    추후 PG 승인 콜백에서 topup_wallet 호출(서버, 검증된 금액).
create or replace function topup_wallet(
  p_manager_id uuid, p_amount bigint, p_method text default 'manual', p_memo text default null
) returns json language plpgsql security definer set search_path = public as $$
declare v_balance bigint; v_new bigint;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount'; end if;
  select wallet_balance into v_balance from managers where id = p_manager_id for update;
  if not found then raise exception 'manager_not_found'; end if;
  v_new := v_balance + p_amount;
  insert into wallet_transactions(manager_id, type, amount, balance_after, method, memo, status)
  values (p_manager_id, 'topup', p_amount, v_new, p_method, p_memo, 'completed');
  update managers set wallet_balance = v_new, updated_at = now() where id = p_manager_id;
  return json_build_object('new_balance', v_new);
end; $$;

-- RPC 는 BFF(service_role) 에서만 호출. anon/authenticated 직접 실행 차단.
revoke all on function buy_lead(uuid, uuid, bigint, text) from anon, authenticated;
revoke all on function topup_wallet(uuid, bigint, text, text) from anon, authenticated;

-- 3) 파트너 consultations 가시성 = 본인이 '구매한' 리드(lead_sales)만 (manager_id 소유 아님).
--    모듈 1 스테이징 정책을 구매 모델로 재설계. (내부 admin/manager=전체, anon 차단 불변)
drop policy if exists consultations_erp_role_read on consultations;
create policy consultations_erp_role_read on consultations for select to authenticated
  using (
    erp_is_internal_lead()
    or id in (
      select ls.consultation_id from lead_sales ls
      where ls.manager_id in (select erp_my_manager_ids()) and ls.status = 'sold'
    )
  );
-- lead_sales/wallet_transactions/manager_lead_pricing 파트너 RLS 는 모듈0 정책(manager_id=본인) 유지.

-- 롤백: drop function buy_lead, topup_wallet; alter table managers drop constraint managers_wallet_nonneg;
