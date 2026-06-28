import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { getMemberId, refreshMemberSession } from '@/lib/member-session';

// 현재 세션 회원 조회. 비로그인이면 member=null. 유효 세션은 만료 임박 시 슬라이딩 갱신.
export async function GET() {
  const memberId = await getMemberId();
  if (!memberId) return NextResponse.json({ member: null });
  await refreshMemberSession();
  const supabase = createServiceRoleSupabaseClient();
  const { data: member } = await supabase
    .from('members')
    .select('id, phone, name, email, consent_marketing')
    .eq('id', memberId)
    .maybeSingle();
  return NextResponse.json({ member: member ?? null });
}
