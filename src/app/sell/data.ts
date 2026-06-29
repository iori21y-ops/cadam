// sell/data.ts — 내차 시세 조회 데이터·로직
// 원본: _design_ref/sell-app.jsx 의 window 전역 상수/함수를 모듈로 이식.
//   잔존가치 테이블(SL_RESID)·시세 계산식은 프로토타입 그대로. catalog Car 타입 재사용.
//   ※ 시세는 추정값 — 실연동 시 엔카·KB 차차차 시세 통계로 교체.
import type { Car } from '@/lib/rentailor/catalog';

const SL_RESID: number[] = [1.0, 0.82, 0.7, 0.59, 0.5, 0.42, 0.36, 0.31, 0.27];
export function slResidual(age: number): number {
  let a = age;
  if (a < 0) a = 0;
  if (a < SL_RESID.length) return SL_RESID[a];
  return Math.max(0.16, SL_RESID[SL_RESID.length - 1] - 0.045 * (a - SL_RESID.length + 1));
}
export const round10 = (x: number): number => Math.round(x / 10) * 10;
export const won = (m: number): string =>
  m >= 10000 ? (m / 10000).toFixed(m % 10000 === 0 ? 0 : 1) + '억' : m.toLocaleString() + '만원';

export const SL_YEARS: number[] = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];

export interface MileOpt {
  v: string;
  label: string;
  sub: string;
  mult: number;
}
export const SL_MILE: MileOpt[] = [
  { v: 'a', label: '2만 km↓', sub: '저주행', mult: 1.05 },
  { v: 'b', label: '2~5만 km', sub: '일반', mult: 1.0 },
  { v: 'c', label: '5~9만 km', sub: '다주행', mult: 0.9 },
  { v: 'd', label: '9만 km↑', sub: '고주행', mult: 0.8 },
];

export interface CondOpt {
  v: string;
  label: string;
  sub: string;
  mult: number;
}
export const SL_COND: CondOpt[] = [
  { v: 'clean', label: '무사고', sub: '완전', mult: 1.0 },
  { v: 'minor', label: '단순수리', sub: '교환 이력', mult: 0.93 },
  { v: 'major', label: '사고이력', sub: '판금·골격', mult: 0.82 },
];

export interface SellCol {
  d: number;
  label: string;
  value: number;
}
export interface SellReport {
  msrp: number;
  age: number;
  market: number;
  dealer: number;
  rentailor: number;
  buyLow: number;
  buyHigh: number;
  distLow: number;
  distHigh: number;
  bonus: number;
  cols: SellCol[];
  drop1: number;
  depPct: number;
  source: 'real' | 'estimate';
}

// 내차팔기 주행거리 칩(a/b/c/d) → /api/used-prices 밴드(low/mid/high) 매핑
export const SL_BAND: Record<string, 'low' | 'mid' | 'high'> = { a: 'low', b: 'mid', c: 'high', d: 'high' };
// 실거래가(엔카 vehicle_used_prices) — market=선택 밴드 median, low/high=밴드별(저주행=시세최고·고주행=시세최저)
export interface SellRealPrice {
  market: number;
  low?: number | null;
  high?: number | null;
}

// real(엔카 실거래가) 있으면 market 교체→파생 전부 실데이터 기반, 없으면 추정식 폴백.
export function sellCalc(car: Car, year: number, mileV: string, condV: string, real?: SellRealPrice | null): SellReport {
  const msrp = round10(car.from * 45);
  const age = Math.max(0, 2026 - year);
  const mm = (SL_MILE.find((x) => x.v === mileV) || SL_MILE[1]).mult;
  const cm = (SL_COND.find((x) => x.v === condV) || SL_COND[0]).mult;
  const estFactor = Math.min(0.98, slResidual(age) * mm * cm);
  const estMarket = round10(msrp * estFactor); // 추정 개인거래 평균
  // 실거래가 있으면 차량상태(cm)만 반영해 market 교체, 없으면 추정
  const market = real ? round10(real.market * cm) : estMarket;
  const dealer = round10(market * 0.88); // 일반 딜러 매입가
  const rentailor = round10(market * 0.95); // Rentailor 전환 우대 인수가
  const buyLow = round10(dealer * 0.95); // 딜러 매입 하한
  const buyHigh = round10(dealer * 1.06); // 딜러 매입 상한
  // 시세 분포: 실데이터 밴드(저주행 low=시세최고 / 고주행 high=시세최저), 없으면 추정
  const baseVal = msrp * slResidual(age);
  let distHigh = real?.low != null ? round10(real.low * cm) : round10(baseVal * 1.05);
  let distLow = real?.high != null ? round10(real.high * cm) : round10(baseVal * 0.78);
  if (distLow > distHigh) { const t = distLow; distLow = distHigh; distHigh = t; }
  // 미래 추이: 추정 곡선을 실 market에 맞춰 스케일(실데이터로 현재값 앵커)
  const scale = real && estMarket > 0 ? market / estMarket : 1;
  const cols: SellCol[] = [0, 1, 2, 3].map((d) => ({
    d,
    label: d === 0 ? '현재' : '+' + d + '년',
    value: round10(msrp * Math.min(0.98, slResidual(age + d) * mm * cm) * scale),
  }));
  const drop1 = cols[0].value - cols[1].value;
  return {
    msrp,
    age,
    market,
    dealer,
    rentailor,
    buyLow,
    buyHigh,
    distLow,
    distHigh,
    bonus: rentailor - dealer,
    cols,
    drop1,
    depPct: Math.round((1 - market / Math.max(1, msrp)) * 100),
    source: real ? 'real' : 'estimate',
  };
}
