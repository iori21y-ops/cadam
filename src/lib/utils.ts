import { createHash } from 'crypto';

/** 전화번호 정규식: 010/011/016/017/018/019 - 3~4자리 - 4자리 */
const PHONE_REGEX = /^01([016789])-?(\d{3,4})-?(\d{4})$/;

/**
 * 전화번호에서 하이픈 제거 (숫자만 반환)
 * 제출 시 사용: API 요청 전 포맷팅
 */
export function removePhoneHyphens(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * 전화번호를 010-XXXX-XXXX 형식으로 포맷팅
 * onChange에서 Auto-formatting용
 */
export function formatPhone(phone: string): string {
  const digits = removePhoneHyphens(phone);
  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

/**
 * 전화번호 유효성 검사
 */
export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(removePhoneHyphens(phone));
}

/**
 * IP 주소를 SHA-256 해시로 변환 (중복 리드 방지용)
 */
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}
