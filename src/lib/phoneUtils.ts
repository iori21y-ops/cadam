/**
 * 전화번호 유틸 (클라이언트 안전)
 * utils.ts의 hashIp는 Node.js crypto 사용으로 클라이언트에서 import 불가
 */

/** 전화번호 정규식: 010/011/016/017/018/019 - 3~4자리 - 4자리 */
const PHONE_REGEX = /^01([016789])-?(\d{3,4})-?(\d{4})$/;

export function removePhoneHyphens(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function formatPhone(phone: string): string {
  const digits = removePhoneHyphens(phone);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(removePhoneHyphens(phone));
}
