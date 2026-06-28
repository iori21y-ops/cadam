import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { getMemberId } from '@/lib/member-session';

// GET — 회원 포인트(원장+잔액) + 적립규칙. 회원 세션(커스텀 쿠키) 필요.
//   실 로그인은 MEMBER_OTP_MODE=live 시 활성 — 코드 완성, 게이트만 대기.
export async function GET() {
  const supabase = createServiceRoleSupabaseClient();
  const { data: rules } = await supabase.from('point_rules').select('event_key, label, points').eq('is_active', true);
  const memberId = await getMemberId();
  if (!memberId) {
    // 비로그인: 규칙만(안내). 원장은 미반환.
    return NextResponse.json({ member: false, rules: rules ?? [], balance: 0, ledger: [] });
  }
  const { data: ledger } = await supabase
    .from('point_transactions')
    .select('id, type, label, amount, balance_after, status, created_at')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(100);
  const balance = (ledger ?? []).reduce((s, t) => s + (t.status === 'confirmed' ? (t.amount ?? 0) : 0), 0);
  return NextResponse.json({ member: true, rules: rules ?? [], balance, ledger: ledger ?? [] });
}
