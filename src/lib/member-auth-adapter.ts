// member-auth-adapter.ts — 고객 인증 OTP 추상화 (서버 전용)
// 신원 키 = members.phone (휴대폰+이름+동의, §6.2). ⚠️ 이메일 신원으로 바꾸지 말 것
//   — consultations.phone 연결이 깨진다.
// 모드(env MEMBER_OTP_MODE):
//   'stub'(기본) = dev 스텁(고정코드/콘솔, 실 SMS 미발송) — 알림톡 템플릿 심사 동안 폴백.
//   'live'       = 카카오 알림톡 OTP(대행사=솔라피) + 알림톡 실패 시 SMS 대체발송.
// 세션·신원·consultations 연결은 모드와 무관(불변).
import crypto from 'crypto';
import { storeOtp, verifyStoredOtp } from './otp-store';
import { getOtpProvider, type OtpMessageProvider } from './otp-providers';

export interface AuthAdapter {
  sendOtp(phone: string): Promise<{ ok: boolean; error?: string }>;
  verifyOtp(phone: string, code: string): Promise<{ ok: boolean; error?: string }>;
}

/** 개발 스텁 고정 코드(UI 힌트로도 노출). live 모드에선 무의미. */
export const DEV_OTP_CODE = '000000';

export const devStubAuthAdapter: AuthAdapter = {
  async sendOtp(phone: string) {
    // eslint-disable-next-line no-console
    console.log(`[member-auth:dev-stub] ${phone} OTP = ${DEV_OTP_CODE} (실제 발송 없음)`);
    return { ok: true };
  },
  async verifyOtp(_phone: string, code: string) {
    if (code === DEV_OTP_CODE) return { ok: true };
    return { ok: false, error: 'invalid_code' };
  },
};

/** 6자리 인증번호 생성(암호학적 난수). */
function genCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

/** 카카오 알림톡 OTP 어댑터(대행사 주입). 알림톡 실패 → SMS 대체발송. */
export function makeKakaoAlimTalkAdapter(provider: OtpMessageProvider): AuthAdapter {
  return {
    async sendOtp(phone: string) {
      const code = genCode();
      await storeOtp(phone, code);
      const a = await provider.sendAlimTalk(phone, code);
      if (a.ok) return { ok: true };
      // 알림톡 실패 → SMS 대체발송(§6.4)
      const s = await provider.sendSms(phone, `[렌테일러] 인증번호 [${code}] · 3분 이내 입력해 주세요.`);
      if (s.ok) return { ok: true };
      return { ok: false, error: a.error ?? s.error ?? 'send_failed' };
    },
    async verifyOtp(phone: string, code: string) {
      return verifyStoredOtp(phone, code);
    },
  };
}

/** 현재 stub 모드인지(MEMBER_OTP_MODE !== 'live'). */
export function isStubMode(): boolean {
  return process.env.MEMBER_OTP_MODE !== 'live';
}
const isProd = () => process.env.NODE_ENV === 'production';

/** ★ 프로덕션에서 OTP 발신 준비됨? stub 모드는 production 에서 미준비(고객 데이터 무단접근 차단). */
export function isMemberOtpReady(): boolean {
  return !isStubMode() || !isProd();
}

/** 미준비 어댑터 — 프로덕션 stub: 발송·검증 모두 거부(000000 우회 불가). 발신번호 등록 시 즉시 live 전환. */
const notReadyAdapter: AuthAdapter = {
  async sendOtp() {
    return { ok: false, error: 'provider_not_ready' };
  },
  async verifyOtp() {
    return { ok: false, error: 'provider_not_ready' };
  },
};

let override: AuthAdapter | null = null;
let resolved: AuthAdapter | null = null;

/** 활성 어댑터. live=실 OTP / stub+개발=devStub(000000) / ★stub+프로덕션=notReady(거부). */
export function getAuthAdapter(): AuthAdapter {
  if (override) return override;
  if (!resolved) {
    if (!isStubMode()) resolved = makeKakaoAlimTalkAdapter(getOtpProvider());
    else resolved = isProd() ? notReadyAdapter : devStubAuthAdapter;
  }
  return resolved;
}

/** 테스트/수동 오버라이드(우선). */
export function setAuthAdapter(adapter: AuthAdapter): void {
  override = adapter;
}

/** 휴대폰 번호 정규화(숫자만) — members.phone 키·consultations 매칭 공통. */
export function normalizePhone(phone: string): string {
  return (phone || '').replace(/[^0-9]/g, '');
}
