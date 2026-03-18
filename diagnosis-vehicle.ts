import type { VehicleQuestion } from '@/types/diagnosis';

export const ALL_VEHICLE_TAGS = [
  "경차", "소형세단", "소형SUV", "중형세단", "중형SUV",
  "대형세단", "대형SUV", "미니밴", "스포츠", "하이브리드", "전기차", "일반",
];

export const DEFAULT_VEHICLE_BASIC: VehicleQuestion[] = [
  { id: "v_purpose", question: "차량의 주요 용도는?", subtitle: "가장 자주 사용하는 상황", skipIf: [], options: [
    { label: "출퇴근·도심 이동", value: "commute", tags: ["경차", "소형세단", "소형SUV"], nextQ: "" },
    { label: "영업·업무용", value: "business", tags: ["중형세단", "대형세단"], nextQ: "" },
    { label: "가족 여행·레저", value: "family", tags: ["중형SUV", "대형SUV", "미니밴"], nextQ: "v_people" },
    { label: "주말 드라이브·취미", value: "hobby", tags: ["스포츠", "소형SUV"], nextQ: "" },
  ]},
  { id: "v_budget", question: "월 예산은\n어느 정도인가요?", subtitle: "보험·유지비 포함 월 총 비용", skipIf: [], options: [
    { label: "30만원 이하", value: "low", tags: ["경차", "소형세단"], nextQ: "" },
    { label: "30~50만원", value: "mid", tags: ["소형세단", "소형SUV", "중형세단"], nextQ: "" },
    { label: "50~80만원", value: "high", tags: ["중형세단", "중형SUV", "대형세단"], nextQ: "" },
    { label: "80만원 이상", value: "premium", tags: ["대형세단", "대형SUV", "스포츠"], nextQ: "" },
  ]},
  { id: "v_people", question: "주로 함께 타는\n인원은?", subtitle: "일반적인 탑승 인원", skipIf: [], options: [
    { label: "혼자 또는 2명", value: "small", tags: ["경차", "소형세단", "스포츠"], nextQ: "" },
    { label: "3~4명 (소가족)", value: "medium", tags: ["중형세단", "소형SUV", "중형SUV"], nextQ: "" },
    { label: "5명 이상 (대가족)", value: "large", tags: ["대형SUV", "미니밴"], nextQ: "" },
  ]},
  { id: "v_priority", question: "차량 선택 시\n가장 중요한 것은?", subtitle: "하나만 고른다면", skipIf: [], options: [
    { label: "연비·경제성", value: "economy", tags: ["경차", "소형세단", "하이브리드"], nextQ: "" },
    { label: "안전·편의 장비", value: "safety", tags: ["중형세단", "중형SUV", "대형SUV"], nextQ: "" },
    { label: "디자인·브랜드", value: "design", tags: ["대형세단", "스포츠"], nextQ: "" },
    { label: "넓은 실내 공간", value: "space", tags: ["대형SUV", "미니밴", "중형SUV"], nextQ: "" },
  ]},
  { id: "v_fuel", question: "선호하는 연료는?", subtitle: "전기차·하이브리드 관심이 높아지고 있습니다", skipIf: [], options: [
    { label: "가솔린/디젤", value: "ice", tags: ["일반"], nextQ: "" },
    { label: "하이브리드", value: "hybrid", tags: ["하이브리드"], nextQ: "" },
    { label: "전기차", value: "ev", tags: ["전기차"], nextQ: "" },
    { label: "상관없음", value: "any", tags: ["일반", "하이브리드", "전기차"], nextQ: "" },
  ]},
];

export const DEFAULT_VEHICLE_DETAIL: VehicleQuestion[] = [
  { id: "v_parking", question: "주차 환경은\n어떠신가요?", subtitle: "주차 공간이 차량 크기 선택에 영향을 줍니다", skipIf: [], options: [
    { label: "좁은 골목·기계식 주차장", value: "narrow", tags: ["경차", "소형세단"], nextQ: "" },
    { label: "아파트 지하주차장", value: "apt", tags: ["소형SUV", "중형세단", "중형SUV"], nextQ: "" },
    { label: "넉넉한 개인 주차장", value: "wide", tags: ["대형SUV", "대형세단", "미니밴"], nextQ: "" },
  ]},
  { id: "v_brand", question: "브랜드 선호가\n있으신가요?", subtitle: "국산·수입 선호도", skipIf: [], options: [
    { label: "국산차가 좋다", value: "domestic", tags: ["경차", "소형세단", "중형세단", "대형세단", "소형SUV", "중형SUV", "대형SUV", "미니밴"], nextQ: "" },
    { label: "수입차에 관심 있다", value: "import", tags: ["대형세단", "스포츠"], nextQ: "" },
    { label: "상관없음", value: "any", tags: [], nextQ: "" },
  ]},
  { id: "v_drive", question: "원하는 주행 느낌은?", subtitle: "운전 스타일에 따라 추천이 달라집니다", skipIf: [{ qId: "v_purpose", values: ["commute"] }], options: [
    { label: "편안하고 부드럽게", value: "comfort", tags: ["중형세단", "대형세단", "미니밴"], nextQ: "" },
    { label: "스포티하고 다이나믹하게", value: "sporty", tags: ["스포츠", "소형SUV"], nextQ: "" },
    { label: "높은 시야·안정감", value: "suv", tags: ["중형SUV", "대형SUV"], nextQ: "" },
  ]},
  { id: "v_tech", question: "가장 중요한\n편의 사양은?", subtitle: "최근 차량 기술 트렌드를 반영합니다", skipIf: [], options: [
    { label: "주행보조 (ADAS·자율주행)", value: "adas", tags: ["중형세단", "중형SUV", "대형SUV", "전기차"], nextQ: "" },
    { label: "인포테인먼트 (큰 화면·음향)", value: "infotain", tags: ["대형세단", "대형SUV", "스포츠"], nextQ: "" },
    { label: "실용성 (적재공간·시트배열)", value: "practical", tags: ["미니밴", "대형SUV", "중형SUV"], nextQ: "" },
    { label: "특별히 중요하지 않다", value: "none", tags: [], nextQ: "" },
  ]},
  { id: "v_resale", question: "중고 매각 가치가\n중요한가요?", subtitle: "리세일 밸류를 고려합니다", skipIf: [{ qId: "v_budget", values: ["low"] }], options: [
    { label: "매우 중요하다", value: "important", tags: ["중형SUV", "대형SUV", "하이브리드"], nextQ: "" },
    { label: "어느 정도 고려", value: "moderate", tags: ["중형세단", "소형SUV"], nextQ: "" },
    { label: "상관없다", value: "none", tags: [], nextQ: "" },
  ]},
  { id: "v_range", question: "주로 달리는\n거리는?", subtitle: "일 평균 주행 거리", skipIf: [], options: [
    { label: "30km 이하 (근거리)", value: "short", tags: ["경차", "소형세단", "전기차"], nextQ: "" },
    { label: "30~100km", value: "medium", tags: ["소형SUV", "중형세단", "하이브리드"], nextQ: "" },
    { label: "100km 이상 (장거리)", value: "long", tags: ["중형SUV", "대형세단", "하이브리드"], nextQ: "" },
  ]},
];
