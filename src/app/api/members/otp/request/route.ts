import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthAdapter, normalizePhone, DEV_OTP_CODE, isStubMode } from '@/lib/member-auth-adapter';

const schema = z.object({ phone: z.string().min(9).max(20) });

// 고객 OTP 발송 요청. 현재 dev 스텁(실 SMS 미발송, 고정코드). §6.4 휴대폰 OTP 로 swap.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_phone' }, { status: 400 });
  }
  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 10) {
    return NextResponse.json({ ok: false, error: 'invalid_phone' }, { status: 400 });
  }
  const result = await getAuthAdapter().sendOtp(phone);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? 'send_failed' }, { status: 502 });
  }
  // stub 모드(템플릿 심사 전)에서만 코드 힌트 노출. live 모드는 미반환.
  return NextResponse.json({ ok: true, ...(isStubMode() ? { devHint: DEV_OTP_CODE } : {}) });
}
