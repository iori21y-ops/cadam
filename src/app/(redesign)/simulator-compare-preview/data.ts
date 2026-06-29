// simulator-compare-preview/data.ts — 차량 직접 비교 행 정의·로직
// 원본: _design_ref/vscompare-app.jsx (window 전역 → 모듈 이식).
// 연료 라벨은 catalog FUEL 재사용, 비교 행(VS_ROWS)·best 판정은 프로토타입 그대로.
import { FUEL, type Car } from '@/lib/rentailor/catalog';

export const STORAGE_KEY = 'rt-vs-ids';
export const DEFAULT_IDS: string[] = ['sorento', 'santafe'];
export const MAX_CARS = 3;

const num = (s: string | number | undefined): number => {
  const m = String(s ?? '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
};

export interface VsRow {
  k: string;
  get: (c: Car) => string;
  val?: (c: Car) => number;
  best?: 'min' | 'max';
}

export const VS_ROWS: VsRow[] = [
  { k: '월 렌트료', get: (c) => '월 ' + c.from + '만원~', val: (c) => c.from, best: 'min' },
  { k: '차급', get: (c) => c.segLabel },
  { k: '연료', get: (c) => FUEL[c.fuel]?.label ?? c.fuel },
  { k: '연비·주행', get: (c) => c.spec.eff ?? '-', val: (c) => num(c.spec.eff), best: 'max' },
  { k: '구분', get: (c) => (c.origin === 'imported' ? '수입' : '국산') },
];

// 행별 최우수 차량 id (비교 차량 2대 이상일 때만)
export function bestId(row: VsRow, cars: Car[]): string | null {
  if (!row.best || !row.val || cars.length < 2) return null;
  const val = row.val;
  let bid: string | null = null;
  let bv = row.best === 'min' ? Infinity : -Infinity;
  cars.forEach((c) => {
    const v = val(c);
    if (row.best === 'min' ? v < bv : v > bv) {
      bv = v;
      bid = c.id;
    }
  });
  return bid;
}
