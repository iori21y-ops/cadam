/**
 * 카카오 알림톡 [Phase 2]
 * Phase 2 전용 — MVP 로직 작성 금지
 * kakao_sent 컬럼 로직 작성 금지
 */

export interface SendKakaoAlimtalkParams {
  phone: string;
  templateCode: string;
  templateParams?: Record<string, string>;
}

/**
 * 카카오 알림톡 발송
 * Phase 2 구현 예정
 */
export async function sendKakaoAlimtalk(
  _params: SendKakaoAlimtalkParams
): Promise<{ success: boolean; error?: string }> {
  // Phase 2 구현 예정
  return { success: false, error: 'Phase 2 구현 예정' };
}
