// otp-providers.ts — 인증번호 메시지 발송 제공자(대행사) 추상화.
// 리셀러/대행사 교체 가능하도록 인터페이스 분리. 1차 구현 = 솔라피(Solapi).
// ⚠️ 비밀값은 env 이름만(.env.example). 값 기재·출력 금지.
import crypto from 'crypto';

/** 대행사 추상화 — 다른 리셀러로 갈아탈 땐 이 인터페이스만 새로 구현. */
export interface OtpMessageProvider {
  /** 카카오 알림톡으로 인증번호 발송. */
  sendAlimTalk(to: string, code: string): Promise<{ ok: boolean; error?: string }>;
  /** SMS 대체 발송(알림톡 실패 시). */
  sendSms(to: string, text: string): Promise<{ ok: boolean; error?: string }>;
}

// ── 솔라피(Solapi) 구현 ──────────────────────────────────────
// env(이름만): SOLAPI_API_KEY · SOLAPI_API_SECRET · SOLAPI_PFID(발신프로필 키) ·
//   SOLAPI_OTP_TEMPLATE_ID(알림톡 템플릿) · SOLAPI_SENDER_PHONE(발신번호)
const SOLAPI_ENDPOINT = 'https://api.solapi.com/messages/v4/send';

function solapiAuthHeader(): string | null {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  if (!apiKey || !apiSecret) return null;
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString('hex');
  const signature = crypto.createHmac('sha256', apiSecret).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

async function solapiSend(message: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const auth = solapiAuthHeader();
  if (!auth) return { ok: false, error: 'provider_not_configured' };
  try {
    const res = await fetch(SOLAPI_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `solapi_${res.status}:${body.slice(0, 120)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'send_error' };
  }
}

export const solapiProvider: OtpMessageProvider = {
  async sendAlimTalk(to, code) {
    const from = process.env.SOLAPI_SENDER_PHONE;
    const pfId = process.env.SOLAPI_PFID;
    const templateId = process.env.SOLAPI_OTP_TEMPLATE_ID;
    if (!from || !pfId || !templateId) return { ok: false, error: 'alimtalk_not_configured' };
    return solapiSend({
      to,
      from,
      type: 'ATA', // 알림톡
      // disableSms:true → 대체발송은 앱 레벨에서 명시적으로(아래 어댑터) 처리
      kakaoOptions: {
        pfId,
        templateId,
        disableSms: true,
        variables: { '#{code}': code },
      },
    });
  },
  async sendSms(to, text) {
    const from = process.env.SOLAPI_SENDER_PHONE;
    if (!from) return { ok: false, error: 'sms_not_configured' };
    return solapiSend({ to, from, type: 'SMS', text });
  },
};

/** 활성 제공자 반환(현재 솔라피 고정 — 리셀러 교체 시 여기서 분기). */
export function getOtpProvider(): OtpMessageProvider {
  return solapiProvider;
}
