import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { getMemberId } from '@/lib/member-session';

// GET — 회원의 계약/보유 차량(contract_vehicles, PII). 회원 세션(커스텀 쿠키) 필요.
//   OTP live 전엔 항상 비회원 → {member:false, vehicles:[]} → 화면(garage)은 시드 폴백 유지.
//   실 로그인+계약 차량 적재 시 자동으로 실 차량 표시(코드 완비, 게이트만 대기).
export async function GET() {
  const memberId = await getMemberId();
  if (!memberId) return NextResponse.json({ member: false, vehicles: [] });
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from('contract_vehicles')
    .select('id, vin, plate, reg_date, odo, color, maker, model, model_slug, year, source')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  return NextResponse.json({ member: true, vehicles: data ?? [] });
}
