// member-session.ts — 고객(회원) 서버 세션 (개발 스텁)
// ⚠️ 스텁: HMAC 서명 httpOnly 쿠키로 member_id 보관. 프로덕션 전환 시 Supabase Auth 세션으로 교체
//    (이 파일과 member-auth.ts 만 swap하면 라우트/UI는 그대로). 서명으로 단순 위조는 차단하나,
//    실 인증(OTP 발송 검증)은 미구현 — A(SMS)/B(이메일 SMTP) 결정 시 verify 라우트에 연결.
import { cookies } from 'next/headers';
import crypto from 'crypto';

const COOKIE = 'rt_member';
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

function secret(): string {
  // 서버 전용 키로 서명(클라 노출 없음). 없으면 개발 폴백.
  return process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-stub-secret';
}
function sign(id: string): string {
  return crypto.createHmac('sha256', secret()).update(id).digest('hex');
}

export async function setMemberSession(memberId: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, `${memberId}.${sign(memberId)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearMemberSession(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}

/** 현재 세션의 member_id(서명 검증 통과 시). 없거나 위조면 null. */
export async function getMemberId(): Promise<string | null> {
  const c = await cookies();
  const v = c.get(COOKIE)?.value;
  if (!v) return null;
  const idx = v.lastIndexOf('.');
  if (idx <= 0) return null;
  const id = v.slice(0, idx);
  const sig = v.slice(idx + 1);
  if (sign(id) !== sig) return null;
  return id;
}
