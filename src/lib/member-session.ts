// member-session.ts — 고객(회원) 서버 세션 (서명 httpOnly 쿠키, 하드닝)
// ⚠️ Supabase Auth 로 교체하지 않는다(신원 키 = members.phone 유지, consultations 연결 불변).
// 하드닝: 서명 페이로드에 만료시각(exp) 포함 → 서버가 maxAge 와 무관하게 독립 검증.
//   HMAC 타이밍-세이프 비교. 유효+만료 임박 시 슬라이딩 갱신.
import { cookies } from 'next/headers';
import crypto from 'crypto';

const COOKIE = 'rt_member';
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30일
const REFRESH_THRESHOLD_SEC = 60 * 60 * 24 * 7; // 만료 7일 이내면 갱신

function secret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-stub-secret';
}
function sign(data: string): string {
  return crypto.createHmac('sha256', secret()).update(data).digest('hex');
}
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** 쿠키 값 생성: `${memberId}.${exp}.${hmac(memberId.exp)}` (exp=만료 epoch초). */
function buildToken(memberId: string): { token: string; maxAge: number } {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = `${memberId}.${exp}`;
  return { token: `${payload}.${sign(payload)}`, maxAge: MAX_AGE_SEC };
}

export async function setMemberSession(memberId: string): Promise<void> {
  const { token, maxAge } = buildToken(memberId);
  const c = await cookies();
  c.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });
}

export async function clearMemberSession(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}

interface Parsed {
  memberId: string;
  exp: number;
}
function parseToken(token: string | undefined): Parsed | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null; // 구 2-파트 토큰은 무효(재로그인)
  const [memberId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!memberId || !Number.isFinite(exp)) return null;
  if (!safeEqual(sign(`${memberId}.${exp}`), sig)) return null; // 위조
  if (exp <= Math.floor(Date.now() / 1000)) return null; // 만료
  return { memberId, exp };
}

/** 현재 세션의 member_id(서명·만료 검증 통과 시). 없거나 위조·만료면 null. */
export async function getMemberId(): Promise<string | null> {
  const c = await cookies();
  return parseToken(c.get(COOKIE)?.value)?.memberId ?? null;
}

/** 유효 세션이고 만료 임박이면 새 만료로 재발급(슬라이딩). 무효면 아무것도 안 함. */
export async function refreshMemberSession(): Promise<void> {
  const c = await cookies();
  const parsed = parseToken(c.get(COOKIE)?.value);
  if (!parsed) return;
  const remaining = parsed.exp - Math.floor(Date.now() / 1000);
  if (remaining < REFRESH_THRESHOLD_SEC) {
    await setMemberSession(parsed.memberId);
  }
}
