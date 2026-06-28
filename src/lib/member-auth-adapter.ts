// member-auth-adapter.ts — 고객 인증 OTP 추상화 (서버 전용)
// 신원 키 = members.phone (휴대폰+이름+동의, §6.2). ⚠️ 이메일 신원으로 바꾸지 말 것
//   — consultations.phone 연결이 깨진다.
// 현재 = dev 스텁(고정코드/콘솔, 실 SMS 미발송).
// 프로덕션 목표 = 휴대폰 OTP(한국 SMS 벤더 또는 카카오 알림톡, §6.4) — 이 어댑터 impl 만 swap.
//   setAuthAdapter(supabasePhoneOtpAdapter) 등으로 교체, 라우트/UI 불변.

export interface AuthAdapter {
  /** OTP 발송. dev 스텁은 콘솔 출력만. */
  sendOtp(phone: string): Promise<{ ok: boolean; error?: string }>;
  /** OTP 검증. dev 스텁은 고정코드 비교. */
  verifyOtp(phone: string, code: string): Promise<{ ok: boolean; error?: string }>;
}

/** 개발 스텁 고정 코드(UI 힌트로도 노출). 프로덕션 어댑터에선 무의미. */
export const DEV_OTP_CODE = '000000';

export const devStubAuthAdapter: AuthAdapter = {
  async sendOtp(phone: string) {
    // eslint-disable-next-line no-console
    console.log(`[member-auth:dev-stub] ${phone} OTP = ${DEV_OTP_CODE} (실제 SMS 미발송)`);
    return { ok: true };
  },
  async verifyOtp(_phone: string, code: string) {
    if (code === DEV_OTP_CODE) return { ok: true };
    return { ok: false, error: 'invalid_code' };
  },
};

let activeAdapter: AuthAdapter = devStubAuthAdapter;

/** 프로덕션 전환: setAuthAdapter(휴대폰 OTP 어댑터)로 교체(단일 swap 지점). */
export function setAuthAdapter(adapter: AuthAdapter): void {
  activeAdapter = adapter;
}
export function getAuthAdapter(): AuthAdapter {
  return activeAdapter;
}

/** 휴대폰 번호 정규화(숫자만) — members.phone 키·consultations 매칭 공통. */
export function normalizePhone(phone: string): string {
  return (phone || '').replace(/[^0-9]/g, '');
}
