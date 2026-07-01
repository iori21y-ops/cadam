/**
 * 관리자 모드 판별 유틸
 *
 * localStorage 의 `admin_mode === "true"` 인 브라우저를 관리자로 간주한다.
 * 관리자 브라우저에서는 GA(Google Analytics) 데이터 전송을 차단하기 위해 사용한다.
 *
 * - localStorage 는 클라이언트 전용이므로 SSR(서버 렌더링) 단계에서는 접근할 수 없다.
 * - 따라서 window 존재 여부를 먼저 확인해 SSR 에서 안전하게 false 를 반환한다.
 */
export function isAdminMode(): boolean {
  // SSR(window 없음) 환경에서는 항상 false → 일반 동작 유지
  return typeof window !== 'undefined' && localStorage.getItem('admin_mode') === 'true';
}
