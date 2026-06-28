// member-auth.ts — 고객 인증 클라이언트 헬퍼 (BFF 라우트 호출)
// 신원 키 = 휴대폰(members.phone). 서버 라우트가 dev 스텁 OTP·세션을 처리.
export interface MemberInfo {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  consent_marketing: boolean;
}

export async function sendMemberOtp(phone: string): Promise<{ ok: boolean; devHint?: string; error?: string }> {
  const res = await fetch('/api/members/otp/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return res.json();
}

export async function verifyMemberOtp(input: {
  phone: string;
  code: string;
  name?: string;
  consent?: boolean;
}): Promise<{ ok: boolean; member?: MemberInfo; linkedLeads?: number; error?: string }> {
  const res = await fetch('/api/members/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function getMember(): Promise<MemberInfo | null> {
  try {
    const res = await fetch('/api/members/me', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.member ?? null;
  } catch {
    return null;
  }
}

export async function memberSignOut(): Promise<void> {
  await fetch('/api/members/signout', { method: 'POST' });
}
