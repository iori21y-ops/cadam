// 금융상품 진단 — 데이터/계산 모듈 (co-located)
// 원본: _design_ref/finance-app.jsx 의 FQ / FIN_PRODUCTS / FIN_CMP / diagnoseFinance.
// window 전역 없이 순수 모듈로 이식. catalog 미사용(이 진단은 차종 무관, 전부 자체 데이터).
// ※ 실연동 시 금융진단 설정은 diagnosis_config 에서 운영하지만, 프리뷰는 아래 로컬 로직을 유지한다.

export type FinKey = 'rent' | 'lease' | 'loan';
export type FinIconName = 'shield' | 'contract' | 'car';

export interface FinOption {
  v: string;
  label: string;
  sub?: string;
}
export interface FinQuestion {
  key: string;
  eyebrow: string;
  title: string;
  desc?: string;
  opts: FinOption[];
}

export const FQ: FinQuestion[] = [
  {
    key: 'term',
    eyebrow: 'STEP 1 · 보유 기간',
    title: '얼마나 타실 계획인가요?',
    desc: '타는 기간에 따라 유리한 금융 방식이 달라져요.',
    opts: [
      { v: 'short', label: '2~3년 짧게', sub: '자주 바꾸는 편' },
      { v: 'mid', label: '4~5년 정도', sub: '일반적인 보유 기간' },
      { v: 'long', label: '5년 이상 오래', sub: '한 차를 길게' },
    ],
  },
  {
    key: 'budget',
    eyebrow: 'STEP 2 · 초기 자금',
    title: '초기 목돈은 어떠세요?',
    desc: '보증금·선납·일시불 부담 여력을 알려주세요.',
    opts: [
      { v: 'none', label: '목돈은 부담돼요', sub: '초기 비용 최소화' },
      { v: 'some', label: '어느 정도 가능', sub: '일부 선납 가능' },
      { v: 'full', label: '목돈도 넉넉해요', sub: '선납·보증금 여유' },
    ],
  },
  {
    key: 'own',
    eyebrow: 'STEP 3 · 소유',
    title: '차를 소유하고 싶으세요?',
    desc: '명의·자산 보유를 원하는지에 따라 달라져요.',
    opts: [
      { v: 'yes', label: '내 차로 갖고 싶어요', sub: '소유·자산 중요' },
      { v: 'either', label: '상관없어요', sub: '타는 게 중요' },
      { v: 'no', label: '부담 없는 게 좋아요', sub: '명의·처분 신경 X' },
    ],
  },
  {
    key: 'biz',
    eyebrow: 'STEP 4 · 비용처리',
    title: '어떤 신분이세요?',
    desc: '사업자라면 비용처리 혜택을 함께 따져드려요.',
    opts: [
      { v: 'emp', label: '직장인', sub: '급여 소득자' },
      { v: 'biz', label: '개인사업자', sub: '경비 처리 필요' },
      { v: 'corp', label: '법인', sub: '법인 차량 운용' },
    ],
  },
  {
    key: 'usage',
    eyebrow: 'STEP 5 · 운행',
    title: '주행·관리 스타일은요?',
    desc: '주행거리와 관리 방식도 진단에 반영해요.',
    opts: [
      { v: 'light', label: '적게 타고 깔끔하게', sub: '연 1만km 이하' },
      { v: 'normal', label: '보통이에요', sub: '연 1~2만km' },
      { v: 'heavy', label: '많이 타는 편', sub: '연 2만km 이상' },
    ],
  },
];

// 플로우 순서 (인트로 → 5문항 → 분석중 → 결과)
export const FG_ORDER = ['intro', 'term', 'budget', 'own', 'biz', 'usage', 'analyzing', 'result'] as const;
export type FinStep = (typeof FG_ORDER)[number];

export interface FinProduct {
  key: FinKey;
  name: string;
  tag: string;
  icon: FinIconName;
  pros: string[];
}
export type FinAnswers = Partial<Record<string, string>>;
export interface FinRanked extends FinProduct {
  score: number;
  match: number;
}

export const FIN_PRODUCTS: Record<FinKey, FinProduct> = {
  rent: {
    key: 'rent',
    name: '장기렌트',
    tag: '보험·세금·정비까지 월 하나로 끝나는 올인원',
    icon: 'shield',
    pros: ['초기비용 0원', '보험·세금 포함', '만기 후 신차 교체'],
  },
  lease: {
    key: 'lease',
    name: '오토리스',
    tag: '명의 부담은 줄이고 비용처리에 유리한 월 정액',
    icon: 'contract',
    pros: ['사업자 비용처리', '낮은 초기금', '유연한 만기 선택'],
  },
  loan: {
    key: 'loan',
    name: '할부',
    tag: '내 차로 소유하면서 나눠 내는 가장 익숙한 방법',
    icon: 'car',
    pros: ['차량 소유', '자유로운 운행', '자산으로 보유'],
  },
};

// 진단 결과 임베드용 압축 비교(추천 근거). 전체 표는 결제방식 비교 허브(/diagnosis/compare).
export interface FinCmpRow {
  k: string;
  rent: string;
  lease: string;
  loan: string;
}
export const FIN_CMP: FinCmpRow[] = [
  { k: '초기 비용', rent: '0원부터', lease: '보증금 선택', loan: '차량가 10~30%' },
  { k: '월 납부', rent: '가장 낮음', lease: '중간', loan: '원금+이자' },
  { k: '보험·세금', rent: '렌트료 포함', lease: '일부 포함', loan: '직접 부담' },
  { k: '소유권', rent: '렌트사', lease: '리스사', loan: '완납 후 본인' },
  { k: '비용 처리', rent: '전액 유리', lease: '처리 가능', loan: '감가상각' },
];
export const FIN_CMP_CONTRAST: Record<FinKey, FinKey> = { rent: 'loan', lease: 'loan', loan: 'rent' };
export const FIN_CMP_LABEL: Record<FinKey, string> = { rent: '장기렌트', lease: '오토리스', loan: '할부' };

export function diagnoseFinance(a: FinAnswers): FinRanked[] {
  const s: Record<FinKey, number> = { rent: 50, lease: 50, loan: 50 };
  const add = (o: Partial<Record<FinKey, number>>) => {
    (Object.keys(o) as FinKey[]).forEach((k) => {
      s[k] += o[k] ?? 0;
    });
  };
  if (a.term === 'short') add({ rent: 16, lease: 8, loan: -10 });
  else if (a.term === 'mid') add({ rent: 8, lease: 8, loan: 4 });
  else add({ loan: 12, rent: -4 });
  if (a.budget === 'none') add({ rent: 16, lease: 8, loan: -6 });
  else if (a.budget === 'some') add({ loan: 8, lease: 6 });
  else add({ loan: 8, rent: -6 });
  if (a.own === 'yes') add({ loan: 14, rent: -12, lease: -6 });
  else if (a.own === 'either') add({ rent: 6, lease: 6 });
  else add({ rent: 16, lease: 8, loan: -10 });
  if (a.biz === 'emp') add({ rent: 4 });
  else if (a.biz === 'biz') add({ lease: 12, rent: 8, loan: 4 });
  else if (a.biz === 'corp') add({ lease: 14, rent: 12 });
  if (a.usage === 'light') add({ rent: 6, lease: 4 });
  else if (a.usage === 'normal') add({ loan: 4, rent: 2 });
  else if (a.usage === 'heavy') add({ loan: 8, rent: -4 });
  const ranked: FinRanked[] = (Object.keys(s) as FinKey[])
    .map((k) => ({ ...FIN_PRODUCTS[k], score: s[k], match: 0 }))
    .sort((x, y) => y.score - x.score);
  ranked.forEach((it) => {
    it.match = Math.max(82, Math.min(99, 72 + Math.round((it.score - 50) * 0.5)));
  });
  return ranked;
}
