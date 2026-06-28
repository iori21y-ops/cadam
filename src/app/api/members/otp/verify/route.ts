import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { getAuthAdapter, normalizePhone } from '@/lib/member-auth-adapter';
import { setMemberSession } from '@/lib/member-session';

const schema = z.object({
  phone: z.string().min(9).max(20),
  code: z.string().min(4).max(8),
  name: z.string().max(50).optional(),
  consent: z.boolean().optional(), // 마케팅 수신 동의(선택)
});

// OTP 검증 → 회원 upsert(phone 신원) → 동의 이력(PIPA) → 기제출 리드(consultations.phone) 연결 → 세션.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });
  }
  const phone = normalizePhone(parsed.data.phone);
  const { code, name, consent } = parsed.data;

  // 1) OTP 검증(어댑터 — dev 스텁/프로덕션 swap)
  const verify = await getAuthAdapter().verifyOtp(phone, code);
  if (!verify.ok) {
    return NextResponse.json({ ok: false, error: verify.error ?? 'invalid_code' }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();

  // 2) members upsert (phone unique). 신규면 name/consent 세팅, 기존이면 last_active 갱신.
  const { data: existing } = await supabase
    .from('members')
    .select('id, phone, name, email, consent_marketing')
    .eq('phone', phone)
    .maybeSingle();

  let member = existing;
  if (!member) {
    const { data: inserted, error: insErr } = await supabase
      .from('members')
      .insert({
        phone,
        name: name ?? null,
        consent_marketing: consent ?? false,
        signup_source: 'otp_login',
        last_active_at: new Date().toISOString(),
      })
      .select('id, phone, name, email, consent_marketing')
      .single();
    if (insErr || !inserted) {
      console.error('member insert error:', insErr);
      return NextResponse.json({ ok: false, error: 'member_create_failed' }, { status: 500 });
    }
    member = inserted;
  } else {
    await supabase
      .from('members')
      .update({ last_active_at: new Date().toISOString(), ...(name ? { name } : {}) })
      .eq('id', member.id);
  }

  // 3) 동의 이력(PIPA §6.5): 개인정보 수집 동의 + 마케팅 수신 동의(선택)
  await supabase.from('member_consents').insert([
    { member_id: member.id, purpose: 'privacy_collect', agreed: true, channel: 'web' },
    ...(consent !== undefined
      ? [{ member_id: member.id, purpose: 'marketing_recv', agreed: consent, channel: 'web' }]
      : []),
  ]);

  // 4) 기제출 리드 연결: 같은 휴대폰(숫자 정규화)이고 아직 member 미연결인 consultations 매칭
  const { data: linked } = await supabase
    .from('consultations')
    .update({ member_id: member.id })
    .is('member_id', null)
    .eq('phone', parsed.data.phone) // 우선 원문(포맷) 일치
    .select('id');
  let linkedLeads = linked?.length ?? 0;
  // 포맷이 달라 못 맞춘 경우 숫자 정규화로 한 번 더(RPC 없이 단순 보강)
  if (linkedLeads === 0) {
    const { data: cands } = await supabase
      .from('consultations')
      .select('id, phone')
      .is('member_id', null)
      .not('phone', 'is', null)
      .limit(200);
    const ids = (cands ?? []).filter((c) => normalizePhone(c.phone as string) === phone).map((c) => c.id);
    if (ids.length) {
      await supabase.from('consultations').update({ member_id: member.id }).in('id', ids);
      linkedLeads = ids.length;
    }
  }

  // 5) 세션 설정(서명 httpOnly 쿠키 — 프로덕션은 Supabase Auth 세션으로 swap)
  await setMemberSession(member.id);

  return NextResponse.json({ ok: true, member, linkedLeads });
}
