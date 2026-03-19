// ═══════════════════════════════════════════
// 진단 모듈 전용 타입 — 기존 타입과 충돌 없음
// ═══════════════════════════════════════════

// ─── 공통 ───

export interface SkipCondition {
  qId: string;
  values: string[];
}

// ─── 금융 진단 ───

export interface FinanceScores {
  installment: number;
  lease: number;
  rent: number;
  cash: number;
}

export interface FinanceOption {
  label: string;
  value: string;
  scores: FinanceScores;
  nextQ: string;
}

export interface FinanceQuestion {
  id: string;
  question: string;
  subtitle: string;
  skipIf: SkipCondition[];
  options: FinanceOption[];
}

// ─── 차종 진단 ───

export interface VehicleOption {
  label: string;
  value: string;
  tags: string[];
  nextQ: string;
}

export interface VehicleQuestion {
  id: string;
  question: string;
  subtitle: string;
  skipIf: SkipCondition[];
  options: VehicleOption[];
}

// ─── 옵션 진단 ───

export interface OptionOption {
  label: string;
  value: string;
  tags: string[];
}

export interface OptionQuestion {
  id: string;
  question: string;
  subtitle: string;
  options: OptionOption[];
}

// ─── 통합 타입 ───

export type DiagnosisQuestion = FinanceQuestion | VehicleQuestion;
export type DiagnosisAnswer = FinanceOption | VehicleOption | OptionOption;

// ─── 상품 데이터 ───

export type ProductKey = 'installment' | 'lease' | 'rent' | 'cash';

export interface Product {
  name: string;
  color: string;
  lightBg: string;
  emoji: string;
  tagline: string;
  description: string;
  pros: string[];
  cons: string[];
  bestFor: string;
}

export type Products = Record<ProductKey, Product>;

// ─── 차량 확장 (기존 Vehicle에 optional 추가) ───

export interface DiagnosisVehicleMeta {
  quizTags: string[];           // 진단 매칭용 태그
  monthlyEstimate: FinanceScores; // 상품별 월 예상금 (만원)
  img: string;                  // 이모지 or 이미지 경로
}

// ─── 트림 ───

export interface Trim {
  name: string;
  price: number;
  add: number;
  tags: string[];
  feats: string[];
}

export type TrimData = Record<string, Trim[]>;

// ─── AI 설정 ───

export interface TonePreset {
  name: string;
  desc: string;
  prompt: string;
}

export interface AIConfig {
  charName: string;
  charEmoji: string;
  charTitle: string;
  charSubtitle: string;
  bgColor: string;
  model: string;
  maxCalls: number;
  promptTemplate: string;
  tonePresets: TonePreset[];
  fallbacks: string[];
  introComment: string;
}

// ─── 관리 / 저장 ───

export interface DiagnosisData {
  finBasic: FinanceQuestion[];
  finDetail: FinanceQuestion[];
  vehBasic: VehicleQuestion[];
  vehDetail: VehicleQuestion[];
  products: Products;
  aiConfig: AIConfig;
}

// ─── API ───

export interface AICommentRequest {
  context: string;
  config: AIConfig;
}

export interface AICommentResponse {
  comment: string;
  cached: boolean;
}
