// diagnosis-report-preview/data.ts — 감가상각 분석 데이터·로직
// 원본: _design_ref/deprec-app.jsx 의 window 전역 상수/함수를 모듈로 이식.
// 잔존가치 곡선(RESID)·계산식은 프로토타입 그대로. catalog Car 타입을 재사용한다.
import type { Car } from '@/lib/rentailor/catalog';

export interface MileageOpt {
  v: 'low' | 'mid' | 'high';
  label: string;
  sub: string;
  mult: number;
}
export interface OwnerOpt {
  v: 'ind' | 'biz' | 'corp';
  label: string;
}
export interface AgeOpt {
  v: string;
  label: string;
}

export const DP_MILEAGE: MileageOpt[] = [
  { v: 'low', label: '저주행', sub: '0~3만km', mult: 1.06 },
  { v: 'mid', label: '일반', sub: '3~6만km', mult: 1.0 },
  { v: 'high', label: '고주행', sub: '6~10만km', mult: 0.9 },
];
export const DP_OWNER: OwnerOpt[] = [
  { v: 'ind', label: '개인' },
  { v: 'biz', label: '개인사업자' },
  { v: 'corp', label: '법인' },
];
export const DP_AGES: AgeOpt[] = [
  { v: '20', label: '20대↓' },
  { v: '30', label: '30대' },
  { v: '40', label: '40대' },
  { v: '50', label: '50대' },
  { v: '60', label: '60대' },
  { v: '70', label: '70대↑' },
];
export const DP_YEARS: number[] = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019];

// 연식별 잔존가치 비율 (출고 0년차=1.0)
const RESID: number[] = [1.0, 0.82, 0.7, 0.59, 0.5, 0.42, 0.36, 0.31, 0.27];

export function residual(age: number): number {
  let a = age;
  if (a < 0) a = 0;
  if (a < RESID.length) return RESID[a];
  return Math.max(0.16, RESID[RESID.length - 1] - 0.045 * (a - RESID.length + 1));
}

export const round10 = (x: number): number => Math.round(x / 10) * 10;

export const won = (m: number): string =>
  m >= 10000 ? (m / 10000).toFixed(m % 10000 === 0 ? 0 : 1) + '억' : m.toLocaleString() + '만원';

export interface DepCol {
  d: number;
  label: string;
  value: number;
}
export interface DepReport {
  msrp: number;
  age: number;
  now: number;
  cols: DepCol[];
  after3: number;
  drop3: number;
  depPct: number;
}

export function calcDep(car: Car, year: number, mileV: string): DepReport {
  const msrp = round10(car.from * 45);
  const age = Math.max(0, 2026 - year);
  const mult = (DP_MILEAGE.find((x) => x.v === mileV) ?? DP_MILEAGE[1]).mult;
  const curResid = Math.min(0.98, residual(age) * mult);
  const now = round10(msrp * curResid);
  const cols: DepCol[] = [0, 1, 2, 3].map((d) => {
    const v = round10(msrp * Math.min(0.98, residual(age + d) * mult));
    return { d, label: d === 0 ? '현재' : '+' + d + '년', value: v };
  });
  const after3 = cols[3].value;
  const drop3 = now - after3;
  return { msrp, age, now, cols, after3, drop3, depPct: Math.round((1 - curResid) * 100) };
}
