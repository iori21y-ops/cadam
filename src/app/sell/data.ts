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
}
export function sellCalc(car: Car, year: number, mileV: string, condV: string): SellReport {
  const msrp = round10(car.from * 45);
  const age = Math.max(0, 2026 - year);
  const mm = (SL_MILE.find((x) => x.v === mileV) || SL_MILE[1]).mult;
  const cm = (SL_COND.find((x) => x.v === condV) || SL_COND[0]).mult;
  const factor = Math.min(0.98, slResidual(age) * mm * cm);
  const market = round10(msrp * factor); // 개인거래(엔카) 평균
  const dealer = round10(market * 0.88); // 일반 딜러 매입가
  const rentailor = round10(market * 0.95); // Rentailor 전환 우대 인수가
  const buyLow = round10(dealer * 0.95); // 딜러 매입 하한
  const buyHigh = round10(dealer * 1.06); // 딜러 매입 상한
  const baseVal = msrp * slResidual(age); // 차종·연식 평균(상태 무관)
  const distLow = round10(baseVal * 0.78); // 모델 시세 최저(고주행·사고)
  const distHigh = round10(baseVal * 1.05); // 모델 시세 최고(저주행·무사고)
  const bonus = rentailor - dealer;
  const cols: SellCol[] = [0, 1, 2, 3].map((d) => ({
    d,
    label: d === 0 ? '현재' : '+' + d + '년',
    value: round10(msrp * Math.min(0.98, slResidual(age + d) * mm * cm)),
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
    bonus,
    cols,
    drop1,
    depPct: Math.round((1 - factor) * 100),
  };
}
