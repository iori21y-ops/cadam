import type { Products, ProductKey, RentFitTierKey, RentFitTierData } from "@/types/diagnosis";

export const PRODUCT_KEYS: ProductKey[] = ["installment", "lease", "rent", "cash"];

export const PRODUCT_LABELS: Record<ProductKey, string> = {
  installment: "할부",
  lease: "리스",
  rent: "렌트",
  cash: "현금",
};

export const RENT_FIT_TIERS: Record<RentFitTierKey, RentFitTierData> = {
  high: {
    emoji: '🎯',
    title: '장기렌트 강력 추천!',
    message: '고객님의 상황에 장기렌트가 매우 잘 맞습니다. 절약 포인트를 최대한 활용해보세요.',
    cta: '맞춤 견적 받기 →',
    description: '보험·정비·세금 올인원 포함으로 관리 부담 없이 편하게 탈 수 있습니다.',
  },
  mid: {
    emoji: '🤔',
    title: '장기렌트 고려해볼 만합니다',
    message: '상황에 따라 장기렌트가 유리할 수 있습니다. 상담을 통해 정확한 비교를 해보세요.',
    cta: '무료 상담 신청 →',
    description: '조건에 따라 할부·리스와 비교해보는 것이 좋습니다.',
  },
  low: {
    emoji: '💡',
    title: '다른 방법이 더 유리할 수 있어요',
    message: '고객님의 상황에서는 할부나 현금구매가 더 경제적일 수 있습니다. 그래도 궁금하시면 상담해보세요.',
    cta: '비교 상담 받기 →',
    description: '소유권이 중요하거나 장기 보유 계획이라면 다른 방법을 먼저 검토해보세요.',
  },
};

export const DEFAULT_PRODUCTS: Products = {
  installment: {
    name: "할부",
    color: "#C9A84C",
    lightBg: "rgba(0,122,255,0.08)",
    emoji: "📋",
    tagline: "내 차를 내 이름으로",
    description: "차량 소유권을 확보하면서 월 납입으로 부담을 분산합니다.",
    pros: ["소유권 즉시 확보", "주행거리 제한 없음", "자유로운 튜닝·개조", "장기 보유 시 경제적"],
    cons: ["이자 비용 발생", "보험·정비 직접 관리", "초기 선수금 필요"],
    bestFor: "장기 보유 + 내 명의 소유를 원하는 분",
  },
  lease: {
    name: "리스",
    color: "#7C3AED",
    lightBg: "rgba(88,86,214,0.08)",
    emoji: "📝",
    tagline: "스마트한 비용 처리",
    description: "사업자 세제 혜택과 함께 신차를 합리적으로 이용합니다.",
    pros: ["사업자 세제 혜택", "초기 비용 절감", "신차 교체 용이", "부가세 환급"],
    cons: ["소유권 없음", "주행거리 제한", "중도해지 위약금"],
    bestFor: "세제 혜택이 필요한 사업자",
  },
  rent: {
    name: "장기렌트",
    color: "#10B981",
    lightBg: "rgba(52,199,89,0.08)",
    emoji: "🚙",
    tagline: "관리 걱정 없이 편하게",
    description: "보험·정비·세금 포함 올인원 서비스입니다.",
    pros: ["보험·정비·세금 올인원", "비용처리 가능", "신용영향 적음", "관리 최소화"],
    cons: ["총 비용 높을 수 있음", "소유권 없음", "주행거리 제한"],
    bestFor: "올인원 편의를 원하는 분",
  },
  cash: {
    name: "현금구매",
    color: "#F59E0B",
    lightBg: "rgba(255,149,0,0.08)",
    emoji: "💰",
    tagline: "이자 없이 온전한 내 차",
    description: "목돈으로 이자 부담 없이 완전 소유합니다.",
    pros: ["이자 0원", "즉시 완전 소유", "제한 없음", "총 비용 최저"],
    cons: ["큰 목돈 필요", "기회비용 발생", "직접 관리"],
    bestFor: "여유 자금 충분 + 장기 보유",
  },
};
