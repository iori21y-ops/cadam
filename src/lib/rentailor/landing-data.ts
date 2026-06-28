// landing-data.ts — Rentailor 랜딩 콘텐츠 모델 (illustrative)
// 원본 프로토타입: _design_ref/data.jsx (window 전역 → 모듈 export 로 이식)

// 1단계 · 월 렌탈료 예산 범위
export const RT_BUDGETS = [
  { key: 'u40', label: '40만원 이하', sub: '부담 없이 시작', mid: 34 },
  { key: '40_60', label: '40–60만원', sub: '가장 인기 있는 구간', mid: 50 },
  { key: '60_80', label: '60–80만원', sub: '넉넉한 옵션·공간', mid: 70 },
  { key: 'o80', label: '80만원 이상', sub: '프리미엄·수입', mid: 96 },
];

// 2단계 · 차급
export const RT_CLASSES = [
  { key: 'compact', label: '경·소형', eg: '모닝 · 캐스퍼 · 아반떼', f: 0.88 },
  { key: 'midsize', label: '준중형·중형', eg: '쏘나타 · K5 · 아이오닉', f: 1.0 },
  { key: 'suv', label: 'SUV', eg: '쏘렌토 · 셀토스 · 투싼', f: 1.12 },
  { key: 'premium', label: '수입·대형', eg: '그랜저 · GV70 · 벤츠', f: 1.35 },
];

// 3단계 · 계약 기간(개월)
export const RT_TERMS = [
  { months: 36, sub: '표준 약정', f: 1.0 },
  { months: 48, sub: '월 납부 부담 ↓', f: 0.94 },
  { months: 60, sub: '가장 낮은 월 납부', f: 0.9 },
];

// 추천 차량 (결과 화면)
export const RT_CARS = [
  { brand: '현대', model: '아반떼', seg: '준중형 세단', from: 39, cls: 'compact', badge: '' },
  { brand: '기아', model: '셀토스', seg: '소형 SUV', from: 45, cls: 'suv', badge: '' },
  { brand: '현대', model: '쏘나타', seg: '중형 세단', from: 52, cls: 'midsize', badge: '인기' },
  { brand: '기아', model: '쏘렌토', seg: '중형 SUV', from: 59, cls: 'suv', badge: '인기' },
  { brand: '현대', model: '그랜저', seg: '준대형 세단', from: 69, cls: 'premium', badge: '' },
  { brand: '현대', model: '아이오닉 5', seg: '전기 SUV', from: 55, cls: 'midsize', badge: '전기차' },
  { brand: '제네시스', model: 'GV70', seg: '프리미엄 SUV', from: 89, cls: 'premium', badge: '' },
  { brand: '기아', model: '모닝', seg: '경차', from: 29, cls: 'compact', badge: '최저가' },
];

// 구매 vs 장기렌터카 비교
export const RT_COMPARE = [
  { label: '초기 비용', buy: '차량가의 20~30%', rent: '0원부터 가능' },
  { label: '월 부담', buy: '원금 + 이자 + 보험', rent: '월 렌트료 하나로' },
  { label: '보험·정비', buy: '매번 직접 처리', rent: '렌트료에 포함' },
  { label: '자동차세', buy: '매년 별도 납부', rent: '납부 불필요' },
  { label: '차량 교체', buy: '중고차 매각 필요', rent: '만료 후 신차로' },
];

// 자주 묻는 질문
export const RT_FAQS = [
  { q: '보험료도 매달 렌트료에 포함되나요?', a: '네. 자동차 보험, 자동차세, 정기 점검까지 모두 월 렌트료 하나에 포함됩니다. 별도로 납부하실 비용은 없습니다.' },
  { q: '사고가 나면 어떻게 처리하나요?', a: '전담 매니저가 접수부터 수리, 대차까지 안내해 드립니다. 보험이 기본 포함되어 있어 자기부담금 외 추가 비용이 발생하지 않습니다.' },
  { q: '계약 중도 해지가 가능한가요?', a: '가능합니다. 약정 기간과 잔여 개월에 따라 위약금이 산정되며, 상담 시 정확한 조건을 미리 안내해 드립니다.' },
  { q: '신용등급이 낮아도 신청할 수 있나요?', a: '신용 조건에 따라 가능한 상품을 별도로 안내해 드립니다. 우선 맞춤 상담으로 가능 여부를 확인해 보세요.' },
];

// 신뢰 지표
export const RT_STATS = [
  { value: '12,800+', label: '누적 상담 신청' },
  { value: '9곳', label: '제휴 캐피탈사' },
  { value: '10분', label: '평균 상담 응답' },
  { value: '92%', label: '고객 재계약률' },
];

// 예상 월 렌탈료 계산 (illustrative)
export function rtEstimate(
  budgetKey: string,
  classKey: string,
  months: number,
): { center: number; lo: number; hi: number } | null {
  const b = RT_BUDGETS.find((x) => x.key === budgetKey);
  const c = RT_CLASSES.find((x) => x.key === classKey);
  const t = RT_TERMS.find((x) => x.months === months);
  if (!b || !c || !t) return null;
  const center = Math.round(b.mid * c.f * t.f);
  const lo = Math.max(19, center - 4);
  const hi = center + 5;
  return { center, lo, hi };
}
