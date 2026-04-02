import type { AIConfig } from '@/types/diagnosis';
import { BRAND } from '@/constants/brand';

export const DEFAULT_AI_CONFIG: AIConfig = {
  charName: BRAND.ai.charName,
  charEmoji: BRAND.ai.charEmoji,
  charTitle: BRAND.ai.charTitle,
  charSubtitle: BRAND.ai.charSubtitle,
  bgColor: BRAND.ai.bgColor,
  model: "claude-sonnet-4-20250514",
  maxCalls: 5,
  promptTemplate: `당신은 '{charName}'이라는 AI 자동차 전문가입니다.
자동차 금융(할부, 리스, 장기렌트, 현금구매)과 차종 선택에 대해 전문적이면서도 친절하게 조언합니다.
아래 고객 진단 결과를 보고 2~3문장으로 핵심 조언을 해주세요.
이모지 1~2개 사용하고, "고객님"이라고 호칭하며 존댓말을 사용하세요.

{context}`,
  tonePresets: [
    { name: "친절한 전문가", desc: "고객님, 이렇게 추천드립니다.", prompt: '존댓말로 친절하게 조언합니다. "고객님" 호칭. 전문적이면서 따뜻한 어조.' },
    { name: "간결·핵심", desc: "렌트 추천. 이유: 비용처리.", prompt: '극도로 간결하게 핵심만 말합니다. 1~2문장. 불필요한 수식어 없이.' },
    { name: "비교 분석", desc: "A안과 B안을 비교해 드리면...", prompt: '상품 간 비교 분석 위주로 조언합니다. 장단점을 객관적으로 정리.' },
    { name: "유머러스", desc: "고객님, 이건 진짜 꿀팁이에요!", prompt: '유머를 섞어 재미있게 조언합니다. "고객님" 호칭. 가벼운 비유를 사용하세요.' },
  ],
  fallbacks: [
    "고객님, 진단 결과가 나왔습니다! 😊 궁금하신 점은 언제든 상담 신청해 주세요.",
    "고객님, 결과를 확인해 보세요! 🚗 전문 상담사가 더 자세히 도와드릴 수 있습니다.",
    "고객님에게 딱 맞는 결과입니다! 💪 실제 견적은 상담으로 확인해 보세요.",
    "고객님, 좋은 선택이에요! 😊 상담을 통해 더 좋은 조건을 받아보세요.",
  ],
  introComment: BRAND.ai.introComment,
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
