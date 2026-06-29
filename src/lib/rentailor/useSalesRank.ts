'use client';
// useSalesRank — 국내 월별 판매순위(car_sales_monthly 실데이터) 클라이언트 어댑터.
//   디자인 원본 sales-data.jsx 의 rtSalesRanked() 재현: /api/market-insight 의 sales(domestic_model)를
//   취급 차종(RT_CATALOG)에 슬러그로 조인 → 매칭된 것만 남기고 1..N 재랭크.
//   ★ 시드 금지 — car_sales_monthly 실데이터(units=sales_count, momPct/momDir=전월대비)만 사용.
import { useEffect, useState } from 'react';
import { RT_CATALOG, type Car } from '@/lib/rentailor/catalog';

export interface SalesRankRow {
  car: Car;
  units: number;
  momPct: number;
  momDir: 'up' | 'down' | 'flat';
  rank: number;
}

interface ApiSales {
  slug: string | null;
  units?: number | null;
  momPct?: number | null;
  momDir?: string | null;
}

// "2026-05" → "2026년 5월"
function fmtPeriod(ym: string | null): string | null {
  if (!ym) return null;
  const [y, m] = ym.split('-');
  if (!y || !m) return null;
  return `${y}년 ${parseInt(m, 10)}월`;
}

export function useSalesRank(): { rows: SalesRankRow[]; period: string | null } {
  const [state, setState] = useState<{ rows: SalesRankRow[]; period: string | null }>({ rows: [], period: null });
  useEffect(() => {
    let alive = true;
    fetch('/api/market-insight', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { sales?: ApiSales[]; salesSource?: string; salesAsOf?: string | null } | null) => {
        if (!alive || !d || d.salesSource !== 'car_sales_monthly' || !Array.isArray(d.sales)) return;
        const rows: SalesRankRow[] = [];
        for (const s of d.sales) {
          if (!s.slug) continue; // 취급 차종 미매칭 → 제외(디자인과 동일)
          const car = RT_CATALOG.find((c) => c.id === s.slug);
          if (!car) continue;
          const dir = s.momDir === 'up' || s.momDir === 'down' ? s.momDir : 'flat';
          rows.push({ car, units: s.units ?? 0, momPct: s.momPct ?? 0, momDir: dir, rank: 0 });
        }
        rows.forEach((r, i) => { r.rank = i + 1; }); // 취급 차종 내 1..N 재랭크
        setState({ rows, period: fmtPeriod(d.salesAsOf ?? null) });
      })
      .catch(() => {/* 데이터 없으면 빈 배열 → 컴포넌트는 렌더 안 함 */});
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
