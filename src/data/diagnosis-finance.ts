import type { FinanceQuestion } from '@/types/diagnosis';

export const FINANCE_BASIC: FinanceQuestion[] = [
  { id: 'business', question: '차량을 어떤 용도로\n사용하시나요?', subtitle: '사업자 여부에 따라 세금 혜택이 크게 달라져요', weight: 2.5, skipIf: [], options: [
    { label: '개인 (출퇴근·일상)', value: 'personal', scores: { installment: 2, lease: 0, rent: 1, cash: 2 }, nextQ: '' },
    { label: '개인사업자 (업무 겸용)', value: 'sole', scores: { installment: 1, lease: 3, rent: 3, cash: 1 }, nextQ: '' },
    { label: '법인사업자 (사업용)', value: 'corp', scores: { installment: 0, lease: 3, rent: 3, cash: 1 }, nextQ: '' },
  ]},
  { id: 'ownership', question: '내 이름으로 된 차,\n꼭 필요하세요?', subtitle: '소유의 만족감 vs 매달 편하게 타는 자유', weight: 2.5, skipIf: [], options: [
    { label: '당연하죠, 내 차는 내 명의!', value: 'must_own', scores: { installment: 3, lease: 0, rent: 0, cash: 3 }, nextQ: '' },
    { label: '있으면 좋지만 필수는 아니에요', value: 'flexible', scores: { installment: 2, lease: 2, rent: 2, cash: 1 }, nextQ: '' },
    { label: '편하게 타는 게 더 좋아요', value: 'use_only', scores: { installment: 0, lease: 3, rent: 3, cash: 0 }, nextQ: '' },
  ]},
  { id: 'cycle', question: '한 차를 얼마나 오래\n타실 계획인가요?', subtitle: '교체 주기에 따라 추천 상품이 달라져요', weight: 2.0, skipIf: [], options: [
    { label: '2~3년, 자주 새 차로!', value: 'short', scores: { installment: 0, lease: 3, rent: 3, cash: 0 }, nextQ: '' },
    { label: '4~5년 정도 타고 교체', value: 'medium', scores: { installment: 3, lease: 2, rent: 1, cash: 2 }, nextQ: '' },
    { label: '6년 이상 오래오래', value: 'long', scores: { installment: 2, lease: 0, rent: 0, cash: 3 }, nextQ: '' },
  ]},
  { id: 'budget', question: '초기 자금은\n어느 정도 여유가 있으세요?', subtitle: '목돈 부담 정도에 따라 방법이 달라요', weight: 2.5, skipIf: [], options: [
    { label: '여유 있어요, 한 번에 가능', value: 'rich', scores: { installment: 1, lease: 1, rent: 0, cash: 3 }, nextQ: '' },
    { label: '있지만 나눠 내고 싶어요', value: 'moderate', scores: { installment: 3, lease: 2, rent: 2, cash: 1 }, nextQ: '' },
    { label: '목돈 지출은 좀 부담돼요', value: 'tight', scores: { installment: 2, lease: 2, rent: 3, cash: 0 }, nextQ: '' },
  ]},
  { id: 'maintenance', question: '보험·정비 같은 관리,\n어떻게 하고 싶으세요?', subtitle: '직접 관리하면 절약, 포함하면 편해요', weight: 2.0, skipIf: [], options: [
    { label: '내가 직접 알아볼게요', value: 'self', scores: { installment: 3, lease: 2, rent: 0, cash: 3 }, nextQ: '' },
    { label: '일부는 도움 받고 싶어요', value: 'partial', scores: { installment: 2, lease: 2, rent: 2, cash: 1 }, nextQ: '' },
    { label: '전부 포함이면 좋겠어요', value: 'full', scores: { installment: 0, lease: 1, rent: 3, cash: 0 }, nextQ: '' },
  ]},
  { id: 'mileage', question: '1년에 얼마나\n운전하시나요?', subtitle: '알려주시면 딱 맞는 조건을 찾아드릴게요', weight: 1.5, skipIf: [], options: [
    { label: '주말 장보기·나들이 위주 (연 ~1만km)', value: '10000', scores: { installment: 1, lease: 3, rent: 3, cash: 1 }, nextQ: '' },
    { label: '매일 출퇴근 기본 (연 ~2만km)', value: '20000', scores: { installment: 2, lease: 2, rent: 2, cash: 2 }, nextQ: '' },
    { label: '출퇴근 + 업무까지 (연 ~3만km)', value: '30000', scores: { installment: 3, lease: 1, rent: 1, cash: 2 }, nextQ: '' },
    { label: '거의 매일 장거리 (연 4만km 이상)', value: '40000', scores: { installment: 3, lease: 0, rent: 0, cash: 3 }, nextQ: '' },
  ]},
  { id: 'contract_flexibility', question: '앞으로 몇 년간\n생활이 바뀔 가능성이 있나요?', subtitle: '결혼, 이사, 이직 등 큰 변화 예정이 있는지', weight: 1.5, skipIf: [], options: [
    { label: '큰 변화 없이 안정적이에요', value: 'stable', scores: { installment: 2, lease: 3, rent: 1, cash: 3 }, nextQ: '' },
    { label: '바뀔 수 있지만 크진 않아요', value: 'moderate', scores: { installment: 2, lease: 2, rent: 2, cash: 2 }, nextQ: '' },
    { label: '변화 가능성이 꽤 있어요', value: 'flexible', scores: { installment: 1, lease: 0, rent: 3, cash: 1 }, nextQ: '' },
  ]},
];

export const FINANCE_DETAIL: FinanceQuestion[] = [
  { id: 'price_range', question: '어느 가격대의\n차량을 생각하고 계세요?', subtitle: '가격대에 따라 금융 상품 효과가 달라져요', weight: 2.0, skipIf: [], options: [
    { label: '3,000만원 이하', value: 'low', scores: { installment: 2, lease: 1, rent: 2, cash: 3 }, nextQ: '' },
    { label: '3,000~6,000만원', value: 'mid', scores: { installment: 3, lease: 2, rent: 2, cash: 2 }, nextQ: '' },
    { label: '6,000만원~1억원', value: 'high', scores: { installment: 1, lease: 3, rent: 2, cash: 1 }, nextQ: '' },
    { label: '1억원 이상', value: 'premium', scores: { installment: 0, lease: 3, rent: 3, cash: 1 }, nextQ: '' },
  ]},
  { id: 'credit', question: '현재 신용등급은\n어느 정도인가요?', subtitle: '대략적으로 괜찮아요, 맞는 상품을 찾아드릴게요', weight: 2.5, skipIf: [], options: [
    { label: '우수한 편 (1~3등급)', value: 'excellent', scores: { installment: 3, lease: 3, rent: 1, cash: 1 }, nextQ: '' },
    { label: '보통이에요 (4~6등급)', value: 'average', scores: { installment: 2, lease: 2, rent: 2, cash: 1 }, nextQ: '' },
    { label: '조금 아쉬운 편이에요', value: 'low', scores: { installment: 0, lease: 0, rent: 3, cash: 2 }, nextQ: '' },
    { label: '잘 모르겠어요', value: 'unknown', scores: { installment: 1, lease: 1, rent: 2, cash: 1 }, nextQ: '' },
  ]},
  { id: 'depreciation', question: '몇 년 뒤 차 가치가\n떨어지는 거, 신경 쓰이세요?', subtitle: '감가상각 걱정을 줄이는 방법도 있어요', weight: 1.5, skipIf: [], options: [
    { label: '네, 꽤 신경 쓰여요', value: 'concern', scores: { installment: 0, lease: 3, rent: 3, cash: 0 }, nextQ: '' },
    { label: '어느 정도는 감안해요', value: 'moderate', scores: { installment: 2, lease: 2, rent: 2, cash: 2 }, nextQ: '' },
    { label: '별로 신경 안 써요', value: 'none', scores: { installment: 3, lease: 0, rent: 0, cash: 3 }, nextQ: '' },
  ]},
  { id: 'tax', question: '세금 혜택,\n얼마나 중요하세요?', subtitle: '사업자라면 비용처리로 절세 효과를 볼 수 있어요', weight: 2.0, skipIf: [{ qId: 'business', values: ['personal'] }], options: [
    { label: '크게 기대 안 해요', value: 'none', scores: { installment: 2, lease: 0, rent: 0, cash: 3 }, nextQ: '' },
    { label: '가능하면 비용처리 하고 싶어요', value: 'some', scores: { installment: 1, lease: 3, rent: 3, cash: 0 }, nextQ: '' },
    { label: '절세가 가장 중요해요!', value: 'priority', scores: { installment: 0, lease: 3, rent: 3, cash: 0 }, nextQ: '' },
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
    '40000': { installment: '주행거리 제한 없이 마음껏 탈 수 있습니다', cash: '주행거리 걱정 없는 완전 소유입니다' },
    '30000': { installment: '주행거리 제한 없이 자유롭게 탈 수 있습니다' },
    '10000': { lease: '적은 주행거리로 리스 조건이 유리합니다', rent: '주행거리 제한 내에서 합리적인 비용입니다' },
  },
  credit: {
    excellent: { lease: '우수 신용으로 유리한 리스 금리를 받을 수 있습니다', installment: '낮은 할부 금리로 이자 부담이 적습니다' },
    low: { rent: '신용 영향이 적은 장기렌트가 유리합니다', cash: '신용 심사 없이 바로 구매 가능합니다' },
  },
  tax: {
    some: { lease: '리스료를 비용처리하여 절세 효과가 있습니다', rent: '렌트 비용 전액 비용처리가 가능합니다' },
    priority: { lease: '부가세 환급 + 비용처리로 최대 절세 효과', rent: '렌트비 전액 비용처리로 절세 효과가 큽니다' },
  },
  contract_flexibility: {
    stable: { lease: '안정적 상황에서 리스 계약이 유리합니다', installment: '장기 보유 계획에 할부가 적합합니다' },
    flexible: { rent: '중도해지 부담이 적은 장기렌트가 유리합니다' },
  },
  cycle: {
    short: { lease: '2~3년 단기 이용 후 새 차 교체에 리스가 유리합니다', rent: '짧은 주기로 차를 바꾸기에 장기렌트가 편리합니다' },
    medium: { installment: '4~5년 보유 시 할부로 총 비용을 줄일 수 있습니다', lease: '적당한 기간 후 인수 여부를 선택할 수 있습니다' },
    long: { cash: '오래 탈수록 이자 없는 현금구매가 경제적입니다', installment: '장기 보유 시 할부 완납 후 유지비만 남습니다' },
  },
  price_range: {
    low: { cash: '3,000만원 이하는 현금구매로 이자 부담을 없앨 수 있습니다', installment: '소액 할부로 월 부담이 적습니다' },
    mid: { installment: '중간 가격대에서 할부 이자 부담이 적정합니다', lease: '리스로 초기 비용을 줄이면서 이용 가능합니다' },
    high: { lease: '고가 차량은 리스로 초기 부담을 크게 줄일 수 있습니다', rent: '고가 차량의 감가 위험을 렌트로 회피할 수 있습니다' },
    premium: { lease: '1억 이상 차량은 리스의 세제 혜택이 극대화됩니다', rent: '초고가 차량의 관리 부담을 렌트로 해결할 수 있습니다' },
  },
  depreciation: {
    concern: { lease: '리스는 잔존가 설정으로 감가 위험을 줄일 수 있습니다', rent: '렌트는 감가상각 걱정 없이 반납하면 됩니다' },
    none: { installment: '감가를 신경 쓰지 않으면 소유의 자유를 누릴 수 있습니다', cash: '오래 타면 감가 영향이 줄어들어 현금구매가 유리합니다' },
  },
};
