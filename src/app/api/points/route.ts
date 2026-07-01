import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { getMemberId } from '@/lib/member-session';

// GET — 회원 포인트(원장+잔액) + 적립규칙. 회원 세션(커스텀 쿠키) 필요.
//   실 로그인은 MEMBER_OTP_MODE=live 시 활성 — 코드 완성, 게이트만 대기.
export async function GET() {
  const supabase = createServiceRoleSupabaseClient();
  const [{ data: rules }, { data: redeemPolicy }] = await Promise.all([
    supabase.from('point_rules').select('event_key, label, points').eq('is_active', true),
    supabase.from('point_redeem_policy').select('key, label, max_pct, sub, min_balance').eq('is_active', true),
  ]);
  const memberId = await getMemberId();
  if (!memberId) {
    // 비로그인: 규칙·정책만(안내). 원장은 미반환.
    return NextResponse.json({ member: false, rules: rules ?? [], redeem_policy: redeemPolicy ?? [], balance: 0, ledger: [] });
  }
  const { data: ledger } = await supabase
    .from('point_transactions')
    .select('id, type, label, amount, balance_after, status, created_at')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(100);
  const balance = (ledger ?? []).reduce((s, t) => s + (t.status === 'confirmed' ? (t.amount ?? 0) : 0), 0);
  return NextResponse.json({ member: true, rules: rules ?? [], redeem_policy: redeemPolicy ?? [], balance, ledger: ledger ?? [] });
}

// POST — 포인트 사용(redeem) 신청. 서버가 정책·잔액 검증 후 pending 원장 기록(클라 계산 불신).
//   body: { key: 정책키(4종), cost: 지원비용(원) }. 사용액은 서버가 min(정책상한, 가용잔액)으로 산정.
export async function POST(req: Request) {
  const memberId = await getMemberId();
  if (!memberId) return NextResponse.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { key?: unknown; cost?: unknown } | null;
  const key = typeof body?.key === 'string' ? body.key : '';
  const cost = typeof body?.cost === 'number' ? body.cost : NaN;
  if (!key || !Number.isFinite(cost) || cost <= 0) {
    return NextResponse.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: policy } = await supabase
    .from('point_redeem_policy')
    .select('key, label, max_pct, min_balance')
    .eq('key', key)
    .eq('is_active', true)
    .maybeSingle();
  if (!policy || policy.max_pct == null) {
    return NextResponse.json({ ok: false, error: '유효하지 않은 지원 항목입니다.' }, { status: 400 });
  }

  // 현재 잔액 = confirmed 원장 합산(pending redeem은 미반영)
  const { data: ledger } = await supabase
    .from('point_transactions')
    .select('amount, status')
    .eq('member_id', memberId);
  const balance = (ledger ?? []).reduce((s, t) => s + (t.status === 'confirmed' ? (t.amount ?? 0) : 0), 0);

  const minBalance = policy.min_balance ?? 0;
  const cap = Math.floor((cost * policy.max_pct) / 100);          // 지원비용의 max_pct% 상한
  const usable = balance - minBalance;                            // 사용 가능 잔액
  const redeemed = Math.min(cap, usable);                        // 부분사용: 둘 중 작은 값
  if (redeemed <= 0) {
    return NextResponse.json({ ok: false, error: '사용 가능한 포인트가 없습니다.' }, { status: 400 });
  }

  const { error: insErr } = await supabase.from('point_transactions').insert({
    member_id: memberId,
    type: 'redeem',
    label: `${policy.label} 지원 신청`,
    amount: -redeemed,
    balance_after: balance,   // pending은 confirmed 잔액 미차감 → 현재값 기록
    method: 'kakaopay',
    ref: key,
    status: 'pending',
  });
  if (insErr) {
    console.error('[points POST]', insErr);
    return NextResponse.json({ ok: false, error: '지원 신청에 실패했습니다.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, redeemed });
}
