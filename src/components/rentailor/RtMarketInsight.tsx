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
    <section style={{ margin: '24px 22px', display: 'grid', gap: 12 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>지금 시장은</h2>
      {/* 기준금리 — ECOS 실데이터(source!=='interim')일 때만 노출. interim 잠정값은 오정보 방지 위해 숨김. */}
      {d.baseRate.source !== 'interim' && (
        <div style={{ border: '1px solid #e8eaee', borderRadius: 16, padding: 16, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af' }}>한국은행 기준금리</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#0D1B2A' }}>{d.baseRate.rate}%</span>
          </div>
          {d.baseRate.comment && <p style={{ margin: '6px 0 0', fontSize: 13, color: '#4a5568', lineHeight: 1.5 }}>{d.baseRate.comment}</p>}
        </div>
      )}
      {/* 판매순위 */}
      <div style={{ border: '1px solid #e8eaee', borderRadius: 16, padding: 16, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af' }}>국내 판매 순위 TOP 5</span>
          {d.salesAsOf && <span style={{ fontSize: 11, color: '#b3b8c0' }}>{d.salesAsOf.replace('-', '.')} 기준</span>}
        </div>
        <ol style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
          {d.sales.map((s) => (
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
