/**
 * 차종명 정규화 — constants/vehicles 의 표시명을 pricing 테이블의 car_model 키에 맞춘다.
 *
 * 예) '아반떼 (CN7)' → '아반떼'  /  '그랜저 (GN7)' → '그랜저'  /  '아이오닉 5 (NE1)' → '아이오닉 5'
 *
 * pricing.car_model 은 괄호 코드 없이 저장돼 있어, 표시명 끝의 괄호(코드)를 제거해야
 * 견적 조회(.eq('car_model', ...))가 매칭된다. 괄호가 없으면 원본 그대로 반환한다.
 */
export function normalizeModelName(model: string): string {
  return model.replace(/\s*\([^)]*\)\s*$/, '').trim();
}
