import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthAdapter, normalizePhone, DEV_OTP_CODE, isStubMode, isMemberOtpReady, isTempBypass } from '@/lib/member-auth-adapter';

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
  // ★ 프로덕션 미준비(발신번호 미등록) → "발송 준비 중" 안내. 단 임시 바이패스 시 통과.
  if (!isMemberOtpReady() && !isTempBypass()) {
    return NextResponse.json(
      { ok: false, error: 'provider_not_ready', message: '인증번호 발송 준비 중입니다. 잠시 후 다시 시도해 주세요.' },
      { status: 503 },
    );
  }
  const result = await getAuthAdapter().sendOtp(phone);
  if (!result.ok) {
    if (result.error === 'provider_not_ready') {
      return NextResponse.json({ ok: false, error: 'provider_not_ready', message: '인증번호 발송 준비 중입니다.' }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: result.error ?? 'send_failed' }, { status: 502 });
  }
  // 개발 stub 에서만 코드 힌트 노출(프로덕션·live 미반환).
  return NextResponse.json({ ok: true, ...(isStubMode() && process.env.NODE_ENV !== 'production' ? { devHint: DEV_OTP_CODE } : {}) });
}
