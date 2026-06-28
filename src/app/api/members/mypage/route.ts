import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { getMemberId } from '@/lib/member-session';

// 마이페이지 데이터(회원 전용): 회원 정보 + 내 상담 내역(consultations) + 내 후기(reviews).
// 상담은 member_id 연결분(OTP 검증 시 phone 매칭으로 자동 연결됨, §3.4C).
export async function GET() {
  const memberId = await getMemberId();
  if (!memberId) return NextResponse.json({ member: null }, { status: 401 });
  const supabase = createServiceRoleSupabaseClient();

  const [{ data: member }, { data: consultations }, { data: reviews }] = await Promise.all([
    supabase.from('members').select('id, phone, name, email, consent_marketing, created_at').eq('id', memberId).maybeSingle(),
    supabase
      .from('consultations')
      .select('id, car_brand, car_model, trim, monthly_budget, estimated_min, estimated_max, status, consult_result, created_at')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, car, method, rating, title, body, status, created_at, published_at')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false }),
  ]);

  if (!member) return NextResponse.json({ member: null }, { status: 401 });
  return NextResponse.json({
    member,
    consultations: consultations ?? [],
    reviews: reviews ?? [],
  });
}
