'use client';
// RtMarketInsight — 랜딩 마켓 인사이트(국내 판매순위 + 기준금리). interim 정적, 소스 교체점 분리(BFF).
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SalesItem {
  rank: number;
  name: string;
  slug: string | null;
  brand?: string;
}
interface Insight {
  baseRate: { rate: number; comment: string | null; source: string };
  sales: SalesItem[];
  salesSource?: string;
  salesAsOf?: string | null;
}

// 순위 행 내부(번호+이름). 링크 유무에 따라 a/div로 감쌈.
function rankInner(s: SalesItem) {
  return (
    <>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: s.rank <= 3 ? '#C9A84C' : '#f0f0f0', color: s.rank <= 3 ? '#0D1B2A' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{s.rank}</span>
      <span style={{ fontWeight: 700 }}>{s.brand ? s.brand + ' ' : ''}{s.name}</span>
      {s.slug && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>견적 보기 →</span>}
    </>
  );
}

export function RtMarketInsight() {
  const [d, setD] = useState<Insight | null>(null);
  useEffect(() => {
    fetch('/api/market-insight').then((r) => r.json()).then(setD).catch(() => {});
  }, []);
  if (!d) return null;
  return (
    <section style={{ marginBlock: '24px', marginInline: 'auto', paddingInline: 'var(--rt-pad)', boxSizing: 'border-box', width: '100%', maxWidth: 860, display: 'grid', gap: 12 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>지금 시장은</h2>
      {/* 기준금리 — ECOS 실데이터면 실값, 미수집(interim)이면 '샘플 데이터' 배지와 함께 표시.
          ⚠️ 표시 전용 — 실제 견적·계산(finance_rates·calc-monthly)에는 절대 사용되지 않음(분리 확인됨). */}
      <div style={{ border: '1px solid #e8eaee', borderRadius: 16, padding: 16, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#9ca3af' }}>
            한국은행 기준금리
            {d.baseRate.source === 'interim' && (
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#B07A2E', background: 'rgba(201,168,76,0.16)', borderRadius: 999, padding: '2px 7px' }}>샘플 데이터</span>
            )}
          </span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#0D1B2A' }}>{d.baseRate.rate}%</span>
        </div>
        {d.baseRate.comment && <p style={{ margin: '6px 0 0', fontSize: 13, color: '#4a5568', lineHeight: 1.5 }}>{d.baseRate.comment}</p>}
        {d.baseRate.source === 'interim' && (
          <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#b3b8c0', lineHeight: 1.45 }}>* ECOS 연동 전 샘플 표시값이에요. 실제 견적·월납 계산에는 사용되지 않아요.</p>
        )}
      </div>
      {/* 판매순위 */}
      <div style={{ border: '1px solid #e8eaee', borderRadius: 16, padding: 16, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af' }}>국내 판매 순위 TOP 5</span>
          {d.salesAsOf && <span style={{ fontSize: 11, color: '#b3b8c0' }}>{d.salesAsOf.replace('-', '.')} 기준</span>}
        </div>
        <ol style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
          {d.sales.slice(0, 5).map((s) => (
            <li key={s.rank}>
              {s.slug ? (
                <Link href={`/cars/${s.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#0D1B2A' }}>
                  {rankInner(s)}
                </Link>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#0D1B2A' }}>{rankInner(s)}</div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
