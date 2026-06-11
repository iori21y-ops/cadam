// /compare/terms 비교표 타입
// 데이터 출처: terms_key_conditions ⨝ terms_documents ⨝ terms_companies
//   (terms_type='장기렌터카' AND is_verified=true 로 검수 완료된 행만)

export type TermsFieldKey =
  | 'early_termination_penalty' // 중도해지 위약금
  | 'excess_mileage_formula'    // 초과주행료
  | 'succession_fee'            // 승계수수료
  | 'deductible_amount'         // 면책금
  | 'maintenance_scope';        // 정비범위

export interface TermsFieldCell {
  /** 검수 완료된 표시값 (terms_key_conditions 컬럼). null = 약관 미명시 */
  value: string | null;
  /** 근거 조항 (예: '제14조'). null이면 칩 미표시 */
  clause: string | null;
  /** 근거 원문 인용. 추출 quote가 신뢰 가능할 때만 채워짐(잘린 인용은 null) */
  quote: string | null;
}

export interface TermsCompanyRow {
  company: string;       // 회사명
  companyType: string;   // 캐피탈/카드사 등
  termsName: string;     // 약관 문서명
  confidence: number;    // 추출 신뢰도 (참고용)
  fields: Record<TermsFieldKey, TermsFieldCell>;
}

/** 표시 순서 + 라벨 + 핵심/보조 구분 */
export const TERMS_FIELD_CONFIG: {
  key: TermsFieldKey;
  label: string;
  core: boolean; // true=항상 강조, false=보조
}[] = [
  { key: 'early_termination_penalty', label: '중도해지 위약금', core: true },
  { key: 'excess_mileage_formula',    label: '초과주행료',      core: true },
  { key: 'succession_fee',            label: '승계수수료',      core: true },
  { key: 'deductible_amount',         label: '면책금',          core: false },
  { key: 'maintenance_scope',         label: '정비범위',        core: false },
];
