import type { AIConfig } from '@/types/diagnosis';

export const DEFAULT_AI_CONFIG: AIConfig = {
  charName: "박대표",
  charEmoji: "👨‍💼",
  charTitle: "박대표의 한마디",
  charSubtitle: "AI 맞춤 조언",
  bgColor: "#007AFF",
  model: "claude-sonnet-4-20250514",
  maxCalls: 5,
  promptTemplate: `당신은 '{charName}'이라는 친근한 자동차 금융 전문가 캐릭터입니다.
30~40대 자영업자/직장인에게 반말로 편하게 조언하는 스타일입니다.
아래 고객 진단 결과를 보고 2~3문장으로 핵심 조언을 해주세요.
이모지 1~2개 사용하고, "사장님" 또는 "대표님"이라고 호칭하세요.

{context}`,
  tonePresets: [
    { name: "친근한 반말", desc: "사장님~ 이렇게 하세요!", prompt: '반말로 편하게 조언합니다. "사장님" 호칭.' },
    { name: "전문가 존댓말", desc: "고객님, 추천드립니다.", prompt: '존댓말로 정중하게 조언합니다. "고객님" 호칭.' },
    { name: "유머러스", desc: "사장님 이건 진짜 꿀팁!", prompt: '유머를 섞어 재미있게 조언합니다. "사장님" 호칭. 가벼운 비유를 사용하세요.' },
    { name: "간결·핵심", desc: "렌트 추천. 이유: 비용처리.", prompt: '극도로 간결하게 핵심만 말합니다. 1~2문장. 불필요한 수식어 없이.' },
  ],
  fallbacks: [
    "사장님, 진단 결과가 나왔네요! 😊 궁금한 거 있으면 언제든 상담 신청해주세요!",
    "대표님, 결과 확인해보세요! 🚗 전문 상담사가 더 자세히 도와드릴 수 있어요!",
    "사장님, 딱 맞는 결과예요! 💪 실제 견적은 상담으로 확인해보세요!",
    "대표님, 좋은 선택이에요! 😊 상담으로 더 좋은 조건 받아보세요!",
  ],
  introComment: "사장님, 차량 이용방법 고민되시죠? 제가 1분 만에 딱 맞는 방법 찾아드릴게요! 🚗",
};

/** Available AI models with pricing info */
export const AI_MODELS = [
  { id: "claude-sonnet-4-20250514", name: "Sonnet 4", desc: "균형 ($3/$15 per 1M)", badge: "" },
  { id: "claude-haiku-4-5-20251001", name: "Haiku 4.5", desc: "저비용 ($1/$5 per 1M)", badge: "추천" },
  { id: "claude-sonnet-4-5-20250929", name: "Sonnet 4.5", desc: "고성능 ($3/$15 per 1M)", badge: "" },
] as const;

/** Build the final prompt by replacing template variables */
export function buildPrompt(config: AIConfig, context: string): string {
  return config.promptTemplate
    .replace("{charName}", config.charName)
    .replace("{context}", context);
}

/** Generate a config hash for cache key purposes */
export function getConfigHash(config: AIConfig): string {
  return config.charName + config.model + String(config.maxCalls) + config.promptTemplate.length;
}
