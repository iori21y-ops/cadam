import type { FinanceQuestion } from '@/types/diagnosis';

export const FINANCE_BASIC: FinanceQuestion[] = [
  { id: 'business', question: '사업자이신가요?', subtitle: '사업자 여부에 따라 세제 혜택이 달라집니다', weight: 3.0, skipIf: [], options: [
    { label: '개인 (비사업자)', value: 'personal', scores: { installment: 2, lease: 0, rent: 1, cash: 2 }, nextQ: '' },
    { label: '개인사업자', value: 'sole', scores: { installment: 1, lease: 3, rent: 3, cash: 1 }, nextQ: '' },
    { label: '법인사업자', value: 'corp', scores: { installment: 0, lease: 3, rent: 3, cash: 1 }, nextQ: '' },
  ]},
  { id: 'ownership', question: '차량 소유에 대한\n생각은 어떠세요?', subtitle: '내 명의 소유 vs 편한 사용', weight: 2.5, skipIf: [], options: [
    { label: '반드시 내 명의로 소유', value: 'must_own', scores: { installment: 3, lease: 0, rent: 0, cash: 3 }, nextQ: 'budget' },
    { label: '소유도 좋지만 필수는 아님', value: 'flexible', scores: { installment: 2, lease: 2, rent: 2, cash: 1 }, nextQ: '' },
    { label: '편하게 사용하는 게 좋다', value: 'use_only', scores: { installment: 0, lease: 3, rent: 3, cash: 0 }, nextQ: '' },
  ]},
  { id: 'cycle', question: '차량 교체 주기는?', subtitle: '새 차로 바꾸는 주기', weight: 1.5, skipIf: [{ qId: 'ownership', values: ['must_own'] }], options: [
    { label: '2~3년마다 새 차로', value: 'short', scores: { installment: 0, lease: 3, rent: 3, cash: 0 }, nextQ: '' },
    { label: '4~5년 정도 타고 교체', value: 'medium', scores: { installment: 3, lease: 2, rent: 1, cash: 2 }, nextQ: '' },
    { label: '6년 이상 오래 타는 편', value: 'long', scores: { installment: 2, lease: 0, rent: 0, cash: 3 }, nextQ: '' },
  ]},
  { id: 'budget', question: '초기 자금 여유는?', subtitle: '차량 구매 시 한 번에 쓸 수 있는 금액', weight: 2.5, skipIf: [], options: [
    { label: '여유 자금이 충분하다', value: 'rich', scores: { installment: 1, lease: 1, rent: 0, cash: 3 }, nextQ: '' },
    { label: '있지만 나눠 내고 싶다', value: 'moderate', scores: { installment: 3, lease: 2, rent: 2, cash: 1 }, nextQ: '' },
    { label: '목돈 지출은 부담스럽다', value: 'tight', scores: { installment: 2, lease: 2, rent: 3, cash: 0 }, nextQ: 'payment' },
  ]},
  { id: 'maintenance', question: '차량 관리는 어떻게?', subtitle: '보험·정비 관리 방식', weight: 2.0, skipIf: [{ qId: 'budget', values: ['tight'] }], options: [
    { label: '직접 알아보고 관리', value: 'self', scores: { installment: 3, lease: 2, rent: 0, cash: 3 }, nextQ: '' },
    { label: '일부는 도움 받고 싶다', value: 'partial', scores: { installment: 2, lease: 3, rent: 1, cash: 1 }, nextQ: '' },
    { label: '전부 포함되면 좋겠다', value: 'full', scores: { installment: 0, lease: 1, rent: 3, cash: 0 }, nextQ: '' },
  ]},
  { id: 'mileage', question: '연간 예상 주행거리는?', subtitle: '리스·렌트는 주행거리 제한이 있습니다', weight: 1.5, skipIf: [], options: [
    { label: '1만km 이하', value: 'low', scores: { installment: 1, lease: 3, rent: 3, cash: 1 }, nextQ: '' },
    { label: '1~2만km', value: 'mid', scores: { installment: 2, lease: 2, rent: 2, cash: 2 }, nextQ: '' },
    { label: '2만km 이상', value: 'high', scores: { installment: 3, lease: 1, rent: 1, cash: 3 }, nextQ: '' },
  ]},
  { id: 'payment', question: '월 납입금에 대한 생각은?', subtitle: '매달 고정 지출 선호도', weight: 2.0, skipIf: [], options: [
    { label: '월 납입금 없는 게 좋다', value: 'none', scores: { installment: 0, lease: 0, rent: 0, cash: 3 }, nextQ: '' },
    { label: '적당한 월 납입 괜찮다', value: 'ok', scores: { installment: 3, lease: 2, rent: 2, cash: 0 }, nextQ: '' },
    { label: '보험·정비 포함이면 좋겠다', value: 'allin', scores: { installment: 0, lease: 1, rent: 3, cash: 0 }, nextQ: '' },
  ]},
];

export const FINANCE_DETAIL: FinanceQuestion[] = [
  { id: 'price_range', question: '구매 예정 차량의\n가격대는?', subtitle: '고가 차량일수록 차이가 큽니다', weight: 2.0, skipIf: [], options: [
    { label: '3,000만원 이하', value: 'low', scores: { installment: 2, lease: 1, rent: 2, cash: 3 }, nextQ: '' },
    { label: '3,000~6,000만원', value: 'mid', scores: { installment: 3, lease: 2, rent: 2, cash: 2 }, nextQ: '' },
    { label: '6,000만원~1억원', value: 'high', scores: { installment: 1, lease: 3, rent: 2, cash: 1 }, nextQ: '' },
    { label: '1억원 이상', value: 'premium', scores: { installment: 0, lease: 3, rent: 3, cash: 1 }, nextQ: '' },
  ]},
  { id: 'credit', question: '현재 신용 상태는?', subtitle: '금융 승인과 금리에 영향', weight: 2.5, skipIf: [], options: [
    { label: '우수 (1~3등급)', value: 'excellent', scores: { installment: 3, lease: 3, rent: 1, cash: 1 }, nextQ: '' },
    { label: '보통 (4~6등급)', value: 'average', scores: { installment: 2, lease: 2, rent: 2, cash: 1 }, nextQ: '' },
    { label: '관리 필요 (7등급 이하)', value: 'low', scores: { installment: 0, lease: 0, rent: 3, cash: 2 }, nextQ: 'insurance' },
    { label: '잘 모르겠다', value: 'unknown', scores: { installment: 1, lease: 1, rent: 2, cash: 1 }, nextQ: '' },
  ]},
  { id: 'depreciation', question: '차량 감가상각이\n신경 쓰이시나요?', subtitle: '시간이 지나면 가치가 하락합니다', weight: 1.5, skipIf: [{ qId: 'ownership', values: ['must_own'] }], options: [
    { label: '매우 신경 쓰인다', value: 'concern', scores: { installment: 0, lease: 3, rent: 3, cash: 0 }, nextQ: '' },
    { label: '어느 정도 감안', value: 'moderate', scores: { installment: 2, lease: 2, rent: 2, cash: 2 }, nextQ: '' },
    { label: '신경 쓰지 않는다', value: 'none', scores: { installment: 3, lease: 0, rent: 0, cash: 3 }, nextQ: '' },
  ]},
  { id: 'insurance', question: '자동차 보험은?', subtitle: '보험 가입 방식', weight: 1.5, skipIf: [], options: [
    { label: '직접 비교해서 저렴하게', value: 'self', scores: { installment: 3, lease: 2, rent: 0, cash: 3 }, nextQ: '' },
    { label: '알아서 해주면 좋겠다', value: 'easy', scores: { installment: 1, lease: 2, rent: 3, cash: 0 }, nextQ: '' },
    { label: '월 비용에 포함', value: 'included', scores: { installment: 0, lease: 1, rent: 3, cash: 0 }, nextQ: '' },
  ]},
  { id: 'tax', question: '세금 처리는?', subtitle: '사업자 비용처리 방식', weight: 2.5, skipIf: [{ qId: 'business', values: ['personal'] }], options: [
    { label: '세금 혜택 기대 안 함', value: 'none', scores: { installment: 2, lease: 0, rent: 0, cash: 3 }, nextQ: '' },
    { label: '가능하면 비용처리', value: 'some', scores: { installment: 1, lease: 3, rent: 3, cash: 0 }, nextQ: '' },
    { label: '절세가 가장 중요', value: 'priority', scores: { installment: 0, lease: 3, rent: 3, cash: 0 }, nextQ: '' },
  ]},
  { id: 'cancel', question: '중도 계약 변경\n가능성이 있나요?', subtitle: '중도해지나 차량 변경 가능성', weight: 1.0, skipIf: [], options: [
    { label: '끝까지 유지', value: 'keep', scores: { installment: 2, lease: 3, rent: 2, cash: 2 }, nextQ: '' },
    { label: '바꿀 수도 있다', value: 'maybe', scores: { installment: 2, lease: 1, rent: 2, cash: 2 }, nextQ: '' },
    { label: '변경 가능성 높다', value: 'likely', scores: { installment: 1, lease: 0, rent: 3, cash: 3 }, nextQ: '' },
  ]},
];

// 질문별 추천 이유 매핑 (핵심 질문 기반 근거 생성용)
export const QUESTION_REASON_MAP: Record<string, Record<string, Partial<Record<'installment' | 'lease' | 'rent' | 'cash', string>>>> = {
  business: {
    personal: { installment: '개인 고객에게 할부는 소유권 확보에 유리합니다', cash: '비사업자는 현금구매로 이자 부담을 없앨 수 있습니다' },
    sole: { lease: '개인사업자는 리스로 세제 혜택을 받을 수 있습니다', rent: '사업자 비용처리가 가능한 장기렌트가 유리합니다' },
    corp: { lease: '법인사업자는 리스를 통해 부가세 환급이 가능합니다', rent: '법인 비용처리와 관리 편의성이 뛰어납니다' },
  },
  ownership: {
    must_own: { installment: '소유권을 즉시 확보할 수 있습니다', cash: '내 명의로 완전한 소유가 가능합니다' },
    flexible: { lease: '인수 옵션으로 소유 여부를 나중에 결정할 수 있습니다' },
    use_only: { rent: '소유 부담 없이 편하게 이용할 수 있습니다', lease: '사용 후 반납으로 부담이 적습니다' },
  },
  budget: {
    rich: { cash: '목돈이 있으면 이자 없이 최저 총 비용으로 구매 가능합니다' },
    moderate: { installment: '선수금 + 월 납입으로 부담을 분산할 수 있습니다' },
    tight: { rent: '초기 비용 부담 없이 월 납입만으로 시작 가능합니다', lease: '선수금 최소화로 초기 부담을 줄일 수 있습니다' },
  },
  maintenance: {
    self: { installment: '직접 관리하면 비용을 절약할 수 있습니다', cash: '완전 소유로 자유롭게 관리 가능합니다' },
    full: { rent: '보험·정비·세금이 모두 포함되어 관리가 편합니다' },
  },
  mileage: {
    high: { installment: '주행거리 제한 없이 마음껏 탈 수 있습니다', cash: '주행거리 걱정 없는 완전 소유입니다' },
    low: { lease: '적은 주행거리로 리스 조건이 유리합니다', rent: '주행거리 제한 내에서 합리적인 비용입니다' },
  },
  credit: {
    excellent: { lease: '우수 신용으로 유리한 리스 금리를 받을 수 있습니다', installment: '낮은 할부 금리로 이자 부담이 적습니다' },
    low: { rent: '신용 영향이 적은 장기렌트가 유리합니다', cash: '신용 심사 없이 바로 구매 가능합니다' },
  },
  tax: {
    some: { lease: '리스료를 비용처리하여 절세 효과가 있습니다', rent: '렌트 비용 전액 비용처리가 가능합니다' },
    priority: { lease: '부가세 환급 + 비용처리로 최대 절세 효과', rent: '렌트비 전액 비용처리로 절세 효과가 큽니다' },
  },
  payment: {
    none: { cash: '월 납입금 없이 한 번에 해결할 수 있습니다' },
    allin: { rent: '보험·정비까지 포함된 월 고정 비용으로 관리가 편합니다' },
  },
};
