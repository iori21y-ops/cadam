import type { VehicleQuestion } from '@/types/diagnosis';

export const ALL_VEHICLE_TAGS = [
  "경차", "소형세단", "소형SUV", "중형세단", "중형SUV",
  "대형세단", "대형SUV", "미니밴", "스포츠", "하이브리드", "전기차", "일반",
];

export const ALL_OPTION_TAGS = ["경제", "기본", "편의", "안전", "풀옵", "프리미엄", "스포티"];

export const DEFAULT_VEHICLE_BASIC: VehicleQuestion[] = [
  { id: "v_purpose", question: "차를 주로 어디에\n쓰실 건가요?", subtitle: "가장 자주 사용하는 상황을 골라주세요", skipIf: [], options: [
    { label: "출퇴근·도심 이동", value: "commute", tags: ["경차", "소형세단", "소형SUV"], nextQ: "" },
    { label: "영업·업무용", value: "business", tags: ["중형세단", "대형세단"], nextQ: "" },
    { label: "가족 여행·레저", value: "family", tags: ["중형SUV", "대형SUV", "미니밴"], nextQ: "" },
    { label: "주말 드라이브·취미", value: "hobby", tags: ["스포츠", "소형SUV"], nextQ: "" },
    { label: "첫 차라 잘 모르겠어요", value: "first_car", tags: ["경차", "소형세단", "소형SUV"], nextQ: "" },
  ]},
  { id: "v_budget", question: "한 달에 차에\n얼마까지 쓸 수 있으세요?", subtitle: "보험·유지비 포함 월 총 비용 기준이에요", skipIf: [], options: [
    { label: "30만원 이하", value: "low", tags: ["경차", "소형세단"], nextQ: "" },
    { label: "30~50만원", value: "mid", tags: ["소형세단", "소형SUV", "중형세단"], nextQ: "" },
    { label: "50~80만원", value: "high", tags: ["중형세단", "중형SUV", "대형세단"], nextQ: "" },
    { label: "80만원 이상", value: "premium", tags: ["대형세단", "대형SUV", "스포츠"], nextQ: "" },
  ]},
  { id: "v_people", question: "보통 몇 명이서\n타시나요?", subtitle: "카시트나 짐 공간도 고려해주세요", skipIf: [], options: [
    { label: "혼자 또는 2명", value: "small", tags: ["경차", "소형세단", "스포츠"], nextQ: "" },
    { label: "3~4명 (소가족)", value: "medium", tags: ["중형세단", "소형SUV", "중형SUV"], nextQ: "" },
    { label: "5명 이상 (대가족)", value: "large", tags: ["대형SUV", "미니밴"], nextQ: "" },
  ]},
  { id: "v_priority", question: "차 고를 때\n가장 중요한 건?", subtitle: "딱 하나만 고른다면", skipIf: [], options: [
    { label: "연비·경제성", value: "economy", tags: ["경차", "소형세단", "하이브리드"], nextQ: "" },
    { label: "안전·편의 장비", value: "safety", tags: ["중형세단", "중형SUV", "대형SUV"], nextQ: "" },
    { label: "디자인·브랜드", value: "design", tags: ["대형세단", "스포츠"], nextQ: "" },
    { label: "넓은 실내 공간", value: "space", tags: ["대형SUV", "미니밴", "중형SUV"], nextQ: "" },
  ]},
  { id: "v_fuel", question: "선호하는 연료가\n있으세요?", subtitle: "요즘 하이브리드·전기차 인기가 많아지고 있어요", skipIf: [], options: [
    { label: "가솔린/디젤", value: "ice", tags: ["일반"], nextQ: "" },
    { label: "하이브리드", value: "hybrid", tags: ["하이브리드"], nextQ: "" },
    { label: "전기차", value: "ev", tags: ["전기차"], nextQ: "" },
    { label: "상관없어요", value: "any", tags: ["일반", "하이브리드", "전기차"], nextQ: "" },
  ]},
  // ─── 옵션 질문 (간편 모드: 핵심 2개) ───
  { id: "o_budget", question: "옵션에 추가로\n투자할 예산은?", subtitle: "거의 다 왔어요! 마지막으로 옵션 선호도를 알려주세요", skipIf: [], options: [
    { label: "최소한으로 (0~100만원)", value: "min", tags: ["경제", "기본"], nextQ: "" },
    { label: "적당히 (100~500만원)", value: "mid", tags: ["편의", "안전"], nextQ: "" },
    { label: "풀옵션 원해요 (500만원+)", value: "max", tags: ["풀옵", "프리미엄"], nextQ: "" },
  ]},
  { id: "o_safety", question: "안전 사양,\n얼마나 중요하세요?", subtitle: "주행 보조·충돌 방지 같은 기능이에요", skipIf: [], options: [
    { label: "기본 에어백이면 충분해요", value: "basic", tags: ["기본", "경제"], nextQ: "" },
    { label: "전방충돌방지는 있어야죠", value: "moderate", tags: ["안전"], nextQ: "" },
    { label: "최신 ADAS 풀옵션 원해요", value: "full", tags: ["풀옵", "안전", "프리미엄"], nextQ: "" },
  ]},
];

export const DEFAULT_VEHICLE_DETAIL: VehicleQuestion[] = [
  { id: "v_parking", question: "주차 환경은\n어떠세요?", subtitle: "주차 공간에 따라 차 크기가 달라져요", skipIf: [], options: [
    { label: "좁은 골목·기계식 주차장", value: "narrow", tags: ["경차", "소형세단"], nextQ: "" },
    { label: "아파트 지하주차장", value: "apt", tags: ["소형SUV", "중형세단", "중형SUV"], nextQ: "" },
    { label: "넉넉한 개인 주차장", value: "wide", tags: ["대형SUV", "대형세단", "미니밴"], nextQ: "" },
  ]},
  { id: "v_brand", question: "브랜드 선호가\n있으세요?", subtitle: "프리미엄 브랜드(제네시스)도 추천해드려요", skipIf: [], options: [
    { label: "현대·기아가 좋아요", value: "domestic", tags: ["경차", "소형세단", "중형세단", "대형세단", "소형SUV", "중형SUV", "대형SUV", "미니밴"], nextQ: "" },
    { label: "프리미엄(제네시스)도 좋아요", value: "premium", tags: ["대형세단", "대형SUV", "스포츠"], nextQ: "" },
    { label: "상관없어요", value: "any", tags: [], nextQ: "" },
  ]},
  { id: "v_drive", question: "어떤 느낌으로\n운전하고 싶으세요?", subtitle: "운전 스타일에 따라 추천이 달라져요", skipIf: [], options: [
    { label: "편안하고 부드럽게", value: "comfort", tags: ["중형세단", "대형세단", "미니밴"], nextQ: "" },
    { label: "스포티하고 다이나믹하게", value: "sporty", tags: ["스포츠", "소형SUV"], nextQ: "" },
    { label: "높은 시야에서 안정감 있게", value: "suv", tags: ["중형SUV", "대형SUV"], nextQ: "" },
  ]},
  { id: "v_tech", question: "가장 끌리는\n편의·기술 사양은?", subtitle: "차종과 트림 추천에 모두 반영돼요", skipIf: [], options: [
    { label: "주행보조 (ADAS·자율주행)", value: "adas", tags: ["중형세단", "중형SUV", "대형SUV", "전기차", "안전", "풀옵"], nextQ: "" },
    { label: "인포테인먼트 (큰 화면·음향)", value: "infotain", tags: ["대형세단", "대형SUV", "스포츠", "편의", "프리미엄"], nextQ: "" },
    { label: "실용성 (적재공간·시트배열)", value: "practical", tags: ["미니밴", "대형SUV", "중형SUV", "기본", "편의"], nextQ: "" },
    { label: "특별히 중요하지 않아요", value: "none", tags: ["경제", "기본"], nextQ: "" },
  ]},
  { id: "v_resale", question: "나중에 팔 때\n가격이 중요하세요?", subtitle: "리세일 밸류가 좋은 차를 찾아드릴게요", skipIf: [], options: [
    { label: "네, 꽤 중요해요", value: "important", tags: ["중형SUV", "대형SUV", "하이브리드"], nextQ: "" },
    { label: "어느 정도 고려해요", value: "moderate", tags: ["중형세단", "소형SUV"], nextQ: "" },
    { label: "상관없어요", value: "none", tags: [], nextQ: "" },
  ]},
  // ─── 옵션 질문 (상세 모드: 나머지 3개) ───
  { id: "o_comfort", question: "편의 사양 중\n가장 끌리는 건?", subtitle: "딱 하나만 고른다면", skipIf: [], options: [
    { label: "열선 시트·스티어링", value: "heated", tags: ["편의"], nextQ: "" },
    { label: "내비·큰 디스플레이", value: "navi", tags: ["편의", "기본"], nextQ: "" },
    { label: "가죽시트·전동시트", value: "leather", tags: ["프리미엄", "편의"], nextQ: "" },
    { label: "특별히 없어요", value: "none", tags: ["경제", "기본"], nextQ: "" },
  ]},
];
