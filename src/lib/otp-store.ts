// otp-store.ts — 인증번호 임시 저장(Upstash Redis, TTL). 실발송 어댑터 전용.
// dev 스텁은 고정코드라 이 저장소를 쓰지 않는다.
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const TTL_SEC = 180; // 인증번호 유효시간 3분
const MAX_ATTEMPTS = 5; // 검증 시도 한도

const key = (phone: string) => `otp:${phone}`;

interface OtpEntry {
  code: string;
  attempts: number;
}

/** 인증번호 저장(기존 것 덮어쓰기, 3분 TTL). */
export async function storeOtp(phone: string, code: string): Promise<void> {
  await redis.set(key(phone), { code, attempts: 0 } satisfies OtpEntry, { ex: TTL_SEC });
}

/** 인증번호 검증. 성공 시 삭제(1회용). 실패 시 시도수 증가(TTL 유지). */
export async function verifyStoredOtp(
  phone: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const k = key(phone);
  const entry = (await redis.get(k)) as OtpEntry | null;
  if (!entry) return { ok: false, error: 'expired' };
  if (entry.attempts >= MAX_ATTEMPTS) {
    await redis.del(k);
    return { ok: false, error: 'too_many_attempts' };
  }
  if (entry.code !== code) {
    await redis.set(k, { code: entry.code, attempts: entry.attempts + 1 } satisfies OtpEntry, {
      keepTtl: true,
    });
    return { ok: false, error: 'invalid_code' };
  }
  await redis.del(k);
  return { ok: true };
}
