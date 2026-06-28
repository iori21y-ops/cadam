// value/data.ts — 차량 가치 분석 데이터·로직
// 원본: _design_ref/value-app.jsx + _design_ref/dep-data.jsx 의 window 전역을 모듈로 이식.
//   감가·잔존·시세 곡선/등급/계산식은 프로토타입 그대로. catalog Car 타입 재사용.
//   ※ 감가 모델(잔존가치율)은 추정값 — 실연동 시 ERP used-prices/엔카·KB 시세 통계로 교체.
import { RT_CATALOG, type Car } from '@/lib/rentailor/catalog';

export const round10 = (x: number): number => Math.round(x / 10) * 10;
export const won = (m: number): string =>
  m >= 10000 ? (m / 10000).toFixed(m % 10000 === 0 ? 0 : 1) + '억' : m.toLocaleString() + '만원';

// ── 3년 잔존가치율(신차가 대비, 0~1) 추정 ──────────────────────
export function rtDepRetention(c: Car | null): number {
  if (!c) return 0.56;
  let r = 0.58; // 기준
  // 연료
  if (c.fuel === 'hybrid') r += 0.06;
  else if (c.fuel === 'diesel') r += 0.02;
  else if (c.fuel === 'ev') r -= 0.075;
  // 차급
  if (c.seg === 'suv') r += 0.035;
  else if (c.seg === 'premium') r -= 0.02;
  // 인기/베스트셀러
  if (c.best) r += 0.03;
  if ((c.badges || []).includes('인기')) r += 0.012;
  // 브랜드·원산지
  if (c.brand === '제네시스') r += 0.012;
  if (c.origin === 'imported') r -= 0.022;
  // 미니밴(카니발) 중고 수요 강세
  if (c.id === 'carnival') r += 0.045;
  // 소형·엔트리 변동
  if (c.id === 'torres' || c.brand === '르노' || c.brand === 'KGM') r -= 0.015;
  return Math.max(0.44, Math.min(0.68, r));
}

export interface DepGrade {
  min: number;
  grade: string;
  label: string;
  color: string;
  desc: string;
}
export const RT_DEP_GRADES: DepGrade[] = [
  { min: 0.635, grade: 'A+', label: '감가 방어 최상위', color: '#1F8A5B', desc: '중고 수요가 강해 가치가 잘 유지돼요.' },
  { min: 0.6, grade: 'A', label: '감가 우수', color: '#10B981', desc: '동급에서 가치 유지력이 좋은 편이에요.' },
  { min: 0.565, grade: 'B', label: '감가 양호', color: '#C9A84C', desc: '평균 수준으로 무난하게 유지돼요.' },
  { min: 0.525, grade: 'C', label: '감가 평이', color: '#E0913C', desc: '시간이 지나며 감가가 다소 빠른 편이에요.' },
  { min: 0, grade: 'D', label: '감가 빠름', color: '#C0563B', desc: '신차 대비 가치 하락 폭이 큰 편이에요.' },
];
export function rtDepGradeOf(retention: number): DepGrade {
  return RT_DEP_GRADES.find((g) => retention >= g.min) || RT_DEP_GRADES[RT_DEP_GRADES.length - 1];
}

// 동급(세그먼트) 평균 잔존가치율
export function rtDepSegAvg(seg: string): number {
  const list = RT_CATALOG.filter((c) => c.seg === seg);
  if (!list.length) return 0.56;
  return list.reduce((s, c) => s + rtDepRetention(c), 0) / list.length;
}

export interface DepAnalysis {
  retention: number;
  retentionPct: number;
  depPct: number;
  grade: string;
  label: string;
  color: string;
  desc: string;
  segAvgPct: number;
  deltaPts: number;
  betterThanAvg: boolean;
}
export function rtDepAnalysis(c: Car): DepAnalysis {
  const retention = rtDepRetention(c);
  const g = rtDepGradeOf(retention);
  const segAvg = rtDepSegAvg(c.seg);
  const deltaPts = Math.round((retention - segAvg) * 100); // %p
  return {
    retention,
    retentionPct: Math.round(retention * 100),
    depPct: Math.round((1 - retention) * 100),
    grade: g.grade,
    label: g.label,
    color: g.color,
    desc: g.desc,
    segAvgPct: Math.round(segAvg * 100),
    deltaPts,
    betterThanAvg: deltaPts >= 0,
  };
}

// ── ERP 관리 모델: 신차 가치(감가·잔존·시세) 파라미터 ──────────
//   ※ 실연동 시 ERP `차종 관리 > 감가·잔존` + finance_rates.residual_rate 우선 적용.
export const RT_DEP_MODEL = {
  msrpPerMonth: 45, // 월 렌트료 → 신차가 환산계수
  baseShape: [1.0, 0.81, 0.71, 0.62, 0.555, 0.5, 0.455, 0.42], // 연차(0~7) 기준 잔존율, 3년차=anchor
  anchorYear: 3,
  dealerRate: 0.88, // 잔존가치 → 일반 딜러 매입가
  rentailorRate: 0.95, // 잔존가치 → Rentailor 전환 인수가
};

// 연차별 예상 잔존가치율 (신차가 대비, 0~1). 차종 3년 잔존율에 곡선을 앵커.
export function rtResidualAt(c: Car, year: number): number {
  const M = RT_DEP_MODEL;
  const base = M.baseShape;
  if (year <= 0) return 1.0;
  const scale = rtDepRetention(c) / base[M.anchorYear];
  const y = Math.min(year, base.length - 1);
  return Math.max(0.16, Math.min(0.98, base[y] * scale));
}

// ── 신차 가치 계산 (ERP 관리 모델 기반) ────────────────────────
export interface CurvePoint {
  y: number;
  label: string;
  residual: number;
  value: number;
}
export interface ValueReportData {
  dep: DepAnalysis;
  msrp: number;
  curve: CurvePoint[];
  v3: number;
  drop3: number;
  depPct3: number;
  market3: number;
  dealer3: number;
  rentailor3: number;
  bonus3: number;
}
export function newCarCalc(car: Car): ValueReportData {
  const M = RT_DEP_MODEL;
  const dep = rtDepAnalysis(car);
  const msrp = round10(car.from * M.msrpPerMonth);
  const years = [0, 1, 2, 3, 5];
  const curve: CurvePoint[] = years.map((y) => {
    const res = rtResidualAt(car, y);
    return { y, label: y === 0 ? '신차' : '+' + y + '년', residual: res, value: round10(msrp * res) };
  });
  const r3 = rtResidualAt(car, 3);
  const v3 = round10(msrp * r3);
  const market3 = v3;
  const dealer3 = round10(v3 * M.dealerRate);
  const rentailor3 = round10(v3 * M.rentailorRate);
  return {
    dep,
    msrp,
    curve,
    v3,
    drop3: msrp - v3,
    depPct3: Math.round((1 - r3) * 100),
    market3,
    dealer3,
    rentailor3,
    bonus3: rentailor3 - dealer3,
  };
}
