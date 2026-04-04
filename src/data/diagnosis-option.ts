import type { OptionQuestion } from '@/types/diagnosis';

export const OPTION_QUESTIONS: OptionQuestion[] = [
  { id: "o_budget", question: "옵션에 추가로\n투자할 예산은?", subtitle: "기본 트림 대비 추가 비용", options: [
    { label: "최소한으로 (0~100만원)", value: "min", tags: ["경제", "기본"] },
    { label: "적당히 (100~500만원)", value: "mid", tags: ["편의", "안전"] },
    { label: "풀옵션 원한다 (500만원+)", value: "max", tags: ["풀옵", "프리미엄"] },
  ]},
  { id: "o_safety", question: "안전 사양은\n얼마나 중요한가요?", subtitle: "주행 보조·충돌 방지 등", options: [
    { label: "기본 에어백이면 충분", value: "basic", tags: ["기본", "경제"] },
    { label: "전방충돌방지는 있어야", value: "moderate", tags: ["안전"] },
    { label: "최신 ADAS 풀옵션 원함", value: "full", tags: ["풀옵", "안전", "프리미엄"] },
  ]},
  { id: "o_comfort", question: "편의 사양 중\n가장 중요한 것은?", subtitle: "하나만 고른다면", options: [
    { label: "열선 시트·스티어링", value: "heated", tags: ["편의"] },
    { label: "내비·큰 디스플레이", value: "navi", tags: ["편의", "기본"] },
    { label: "가죽시트·전동시트", value: "leather", tags: ["프리미엄", "편의"] },
    { label: "특별히 없음", value: "none", tags: ["경제", "기본"] },
  ]},
  { id: "o_tech", question: "첨단 기능에 대한\n관심은?", subtitle: "원격주차, 서라운드뷰, 헤드업디스플레이 등", options: [
    { label: "없어도 된다", value: "none", tags: ["기본", "경제"] },
    { label: "있으면 좋겠다", value: "nice", tags: ["편의"] },
    { label: "반드시 있어야 한다", value: "must", tags: ["풀옵", "프리미엄"] },
  ]},
];

/** All available option tags for admin UI */
export const OPTION_TAGS = ["경제", "기본", "편의", "안전", "풀옵", "프리미엄", "스포티"];
