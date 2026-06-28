'use client';

// 이벤트·특가 — 리뉴얼 미리보기 (타깃 /promotions)
// 원본: _design_ref/deals-app.jsx (+ rt-deals.css)
// 이식 규칙: window 전역 → import, CadamDS.Button → @/components/ui/Button,
//   window.RT_CATALOG → @/lib/rentailor/catalog, 디바이스 토글/TweaksPanel 제외,
//   <image-slot> → hsl(hue) 색상 div, 링크 .html?id= → /cars-detail-preview/${id}.
// 데이터: 특가 카드는 프로토타입 시드(DS_DEALS)+카탈로그로 항상 렌더(프리뷰 쇼케이스).
//   추가로 /api/promotions(배너형)를 fetch 해 상단에 최소 렌더(실패/빈 응답 시 미표시).
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { RtTopNav, RtTabBar } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { RT_CATALOG, type Car } from '@/lib/rentailor/catalog';
import './deals.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

// ── API 프로모션(배너형) ──────────────────────────────────
interface Promotion {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
}
interface PromotionsResponse {
  promotions: Promotion[];
}

// ── 특가 시드 (carId 는 catalog 기준) ─────────────────────
type DealTag = 'hot' | 'ev' | 'corp' | 'fast';
interface Deal {
  carId: string;
  was: number;
  now: number;
  total: number;
  left: number;
  tags: DealTag[];
}
type FilterKey = 'all' | DealTag;

const DS_FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'fast', label: '즉시출고' },
  { key: 'ev', label: '전기차' },
  { key: 'corp', label: '법인전용' },
  { key: 'hot', label: '마감임박' },
];

const DS_DEALS: Deal[] = [
  { carId: 'ioniq5', was: 110, now: 89, total: 30, left: 4, tags: ['hot', 'ev', 'fast'] },
  { carId: 'sorento', was: 80, now: 69, total: 25, left: 9, tags: ['hot', 'fast'] },
  { carId: 'modely', was: 109, now: 92, total: 20, left: 3, tags: ['ev'] },
  { carId: 'grandeur', was: 85, now: 72, total: 40, left: 18, tags: ['corp'] },
  { carId: 'avante', was: 45, now: 38, total: 50, left: 12, tags: ['fast'] },
  { carId: 'carnival', was: 80, now: 70, total: 30, left: 7, tags: ['corp', 'fast'] },
  { carId: 'ev6', was: 101, now: 84, total: 15, left: 2, tags: ['hot', 'ev'] },
  { carId: 'gv70', was: 122, now: 105, total: 18, left: 11, tags: ['corp'] },
];

const DS_TAG_META: Record<DealTag, { cls: string; label: string }> = {
  hot: { cls: 'hot', label: 'HOT 특가' },
  ev: { cls: 'ev', label: '전기차' },
  corp: { cls: 'corp', label: '법인전용' },
  fast: { cls: 'fast', label: '즉시출고' },
};

const CarShot = ({ hue }: { hue: number }) => (
  <div
    className="rt-dl-shot"
    style={{ background: `hsl(${hue} 42% 92%)`, color: `hsl(${hue} 38% 42%)` }}
    aria-hidden="true"
  >
    <svg viewBox="0 0 48 24" width="72" height="36" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 16l2.6-6.4A3 3 0 0 1 10.4 8h17.2a3 3 0 0 1 2.5 1.3L34 15l7 1.4a2 2 0 0 1 1.6 2V16" />
      <path d="M3 16h40v3H3z" />
      <circle cx="13" cy="19" r="2.4" />
      <circle cx="33" cy="19" r="2.4" />
    </svg>
  </div>
);

function DealCard({ deal, car }: { deal: Deal; car: Car | undefined }) {
  if (!car) return null;
  const off = Math.round((1 - deal.now / deal.was) * 100);
  const pct = Math.round((1 - deal.left / deal.total) * 100);
  return (
    <Link className="rt-dl-card" href={`/cars-detail-preview/${car.id}`}>
      <div className="rt-dl-card-media">
        <div className="rt-dl-tagrow">
          {deal.tags.slice(0, 2).map((t) => (
            <span key={t} className={'rt-dl-tag ' + DS_TAG_META[t].cls}>
              {DS_TAG_META[t].label}
            </span>
          ))}
        </div>
        <CarShot hue={car.hue} />
      </div>
      <div className="rt-dl-card-body">
        <div className="rt-dl-card-name">
          {car.brand} {car.model}
        </div>
        <div className="rt-dl-card-seg">{car.segLabel}</div>
        <div className="rt-dl-price">
          <span className="rt-dl-price-was">월 {deal.was}만원</span>
          <span className="rt-dl-price-now">
            {deal.now}
            <em>만원~</em>
          </span>
          <span className="rt-dl-price-off">{off}%↓</span>
        </div>
        <div className="rt-dl-meta">
          <div className="rt-dl-bar2">
            <div className="rt-dl-bar-fill" style={{ width: pct + '%' }}></div>
          </div>
          <span className="rt-dl-left">{deal.left}대 남음</span>
        </div>
      </div>
    </Link>
  );
}

function PromoCard({ promo }: { promo: Promotion }) {
  const inner = (
    <>
      {promo.imageUrl && (
        <div className="rt-dl-promo-thumb">
          {/* 외부 이미지 URL — 프리뷰 한정, next/image 미사용 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={promo.imageUrl} alt="" />
        </div>
      )}
      <div className="rt-dl-promo-main">
        <p className="rt-dl-promo-t">{promo.title}</p>
        {promo.description && <p className="rt-dl-promo-d">{promo.description}</p>}
      </div>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </>
  );
  if (promo.linkUrl) {
    return (
      <a className="rt-dl-promo" href={promo.linkUrl} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return <div className="rt-dl-promo">{inner}</div>;
}

export default function PromotionsPreview() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sheet, setSheet] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // /api/promotions — 기존 운영 API 재사용. 실패/비정상 응답 시 빈 배열 폴백.
  useEffect(() => {
    let alive = true;
    fetch('/api/promotions')
      .then((res) => (res.ok ? (res.json() as Promise<PromotionsResponse>) : Promise.reject(res.status)))
      .then((data) => {
        if (alive && Array.isArray(data?.promotions)) setPromotions(data.promotions);
      })
      .catch(() => {
        if (alive) setPromotions([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const byId = React.useMemo(() => {
    const m: Record<string, Car> = {};
    for (const c of RT_CATALOG) m[c.id] = c;
    return m;
  }, []);

  const list = DS_DEALS.filter((d) => filter === 'all' || d.tags.includes(filter as DealTag));

  return (
    <div className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-page="deals">
        <div className="rt-scroll">
          <RtTopNav title="특가" />

          <div className="rt-dl-head">
            <p className="rt-dl-eyebrow">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M13 2L4.5 13H11l-1 9 8.5-11H12z" />
              </svg>
              한정 수량 특가
            </p>
            <h1 className="rt-dl-title">이번 주 특가 차량</h1>
            <p className="rt-dl-desc">
              제휴사 프로모션으로 월 렌트료를 더 낮췄어요. 수량이 한정되어 조기 마감될 수 있어요.
            </p>
          </div>

          <div className="rt-dl-banner">
            <div className="rt-dl-banner-k">WEEKLY SPECIAL</div>
            <div className="rt-dl-banner-t">이번 주 특가 마감까지</div>
            <div className="rt-dl-count">
              <div className="rt-dl-count-c">
                <b>02</b>
                <span>일</span>
              </div>
              <div className="rt-dl-count-sep">:</div>
              <div className="rt-dl-count-c">
                <b>14</b>
                <span>시간</span>
              </div>
              <div className="rt-dl-count-sep">:</div>
              <div className="rt-dl-count-c">
                <b>38</b>
                <span>분</span>
              </div>
            </div>
          </div>

          {promotions.length > 0 && (
            <div className="rt-dl-promos">
              {promotions.map((p) => (
                <PromoCard key={p.id} promo={p} />
              ))}
            </div>
          )}

          <div className="rt-dl-chips">
            {DS_FILTERS.map((f) => (
              <button
                key={f.key}
                className={'rt-dl-chip' + (filter === f.key ? ' is-on' : '')}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="rt-dl-list">
            {list.map((d) => (
              <DealCard key={d.carId} deal={d} car={byId[d.carId]} />
            ))}
          </div>

          <div className="rt-bar" style={cssVar({ '--rt-accent': ACCENT })}>
            <div className="rt-bar-inner">
              <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => setSheet(true)}>
                특가 차량 상담받기
              </Button>
            </div>
          </div>

          <RtTabBar active="event" />
        </div>
      </div>

      <RtConsultSheet
        open={sheet}
        onClose={() => setSheet(false)}
        car={null}
        accent={ACCENT}
        onSubmitted={() => {
          // TODO(§3.4C): consultations 단일 insert 연결점 (공통 name·phone·consent + source=inflow_page + context jsonb). 현재는 결과/모달 렌더만, POST 미연동.
        }}
      />
    </div>
  );
}
