'use client';

// 전체 차종 목록(인기 견적) — 리뉴얼 미리보기 (운영 타깃 /popular-estimates)
// 원본: _design_ref/list-app.jsx (window 전역 → @/lib/rentailor/catalog 모듈 import)
// 적응/제외:
//   - BestsellerRail 제외: catalog 에 판매순위 데이터(rtSalesRanked/RT_SALES_PERIOD) 없음
//   - RtMarketInsight/tweaks-panel/device 토글/personalize/rt-visibility 자동주입 제외
//   - <image-slot> 제거 → .rt-vcard-media 의 hue 그라데이션이 플레이스홀더
//   - 카테고리 탭 className .rt-tab → .rt-cat-tab (globals 하단 GNB .rt-tab 충돌 회피)
//   - 차종 상세 링크: '차종 상세.html?id=' → '/cars-detail-preview/{id}' (next/link)
//   - 게스트 가드는 RtGuestGate(비-strict). 카드 Link 에 data-guest="allow" 부여해
//     게스트도 상세 열람 통과(운영 /cars 허용 프리픽스를 프리뷰 라우트가 못 맞추므로).
//     부수효과로 카드 내부 찜/비교 버튼도 게스트에게 비차단됨(시각 프리뷰 허용 범위).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { RtTopNav, RtTabBar } from '@/components/rentailor/RtChrome';
import { RtGuestGate } from '@/components/rentailor/RtGuestGate';
import { RtTermDefs } from '@/lib/rentailor/personalize';
import { useSalesRank } from '@/lib/rentailor/useSalesRank';
import {
  RT_TABS,
  RT_SEGS,
  RT_SORTS,
  FUEL,
  RT_CATALOG,
  rtCarInTab,
  rtCarInSeg,
  type Car,
} from '@/lib/rentailor/catalog';
import './catalog.css';

const ACCENT = '#C9A84C';

interface Badge {
  label: string;
  cls: string;
}

// 카드 배지 계산
function cardBadges(c: Car): Badge[] {
  const out: Badge[] = [];
  if (c.best) out.push({ label: 'BEST', cls: 'rt-badge-best' });
  if (c.fuel === 'ev') out.push({ label: '전기차', cls: 'rt-badge-ev' });
  else if (c.fuel === 'hybrid') out.push({ label: '하이브리드', cls: 'rt-badge-low' });
  c.badges.forEach((b) => {
    if (b === '전기차') return;
    if (b === '인기') out.push({ label: '인기', cls: 'rt-badge-hot' });
    else if (b === '최저가') out.push({ label: '최저가', cls: 'rt-badge-low' });
    else out.push({ label: b, cls: '' });
  });
  return out.slice(0, 3);
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v14M5 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM19 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 7v14" />
      <path d="M9 5h6M9 19h6" />
    </svg>
  );
}

interface VCardProps {
  car: Car;
  saved: boolean;
  onToggleSave: (id: string) => void;
  inVs: boolean;
  onToggleVs: (id: string) => void;
}

function VCard({ car, saved, onToggleSave, inVs, onToggleVs }: VCardProps) {
  const badges = cardBadges(car);
  const effIsRange = car.fuel === 'ev';
  return (
    <Link
      className="rt-vcard"
      data-guest="allow"
      href={`/cars-detail-preview/${car.id}`}
      style={{ ['--hue']: car.hue } as React.CSSProperties}
    >
      <div className="rt-vcard-media">
        {car.imageKey && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/cars/${car.imageKey}.webp`}
            alt={car.model}
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '8%' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="rt-vcard-badges">
          {badges.map((b, i) => (
            <span className={'rt-badge ' + b.cls} key={i}>{b.label}</span>
          ))}
        </div>
        <button className={'rt-vcmp' + (inVs ? ' is-on' : '')} aria-label="직접 비교 담기"
          onClick={(e) => { e.preventDefault(); onToggleVs(car.id); }}>
          <CompareIcon />
        </button>
        <button className={'rt-save' + (saved ? ' is-on' : '')} aria-label="찜하기"
          onClick={(e) => { e.preventDefault(); onToggleSave(car.id); }}>
          <HeartIcon filled={saved} />
        </button>
      </div>
      <div className="rt-vcard-body">
        <div className="rt-vcard-top">
          <span className="rt-vcard-brand">{car.brand}</span>
          <span className="rt-vcard-fuel" data-fuel={car.fuel}>{FUEL[car.fuel].label}</span>
        </div>
        <h3 className="rt-vcard-name">{car.model}</h3>
        <p className="rt-vcard-seg">{car.segLabel}</p>
        <dl className="rt-vcard-specs">
          <div className="rt-vcard-spec">
            <dt>{effIsRange ? '1회 충전 주행' : '복합 연비'}</dt>
            <dd>{car.spec.eff}</dd>
          </div>
          <div className="rt-vcard-spec">
            <dt>최고 출력</dt>
            <dd>{car.spec.power}</dd>
          </div>
          <div className="rt-vcard-spec">
            <dt>승차 인원</dt>
            <dd>{car.spec.seatLabel ?? `${car.spec.seats}인승`}</dd>
          </div>
        </dl>
        <div className="rt-vcard-foot">
          <div>
            <div className="rt-vcard-price-k">월 렌트료</div>
            <div className="rt-vcard-price">
              <span className="rt-vcard-from">월</span>
              <span className="rt-vcard-num">{car.from}</span>
              <span className="rt-vcard-unit">만원~</span>
            </div>
          </div>
          <span className="rt-vcard-cta">
            견적
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
              strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

interface SortControlProps {
  sort: string;
  setSort: (k: string) => void;
}

function SortControl({ sort, setSort }: SortControlProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, []);
  const cur = RT_SORTS.find((s) => s.key === sort);
  return (
    <div className="rt-sort" ref={ref}>
      <button className="rt-sort-btn" onClick={() => setOpen(!open)}>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4v16M7 4l-3 4M7 4l3 4M17 20V4M17 20l-3-4M17 20l3-4" /></svg>
        {cur?.label}
      </button>
      <div className={'rt-sort-menu' + (open ? ' is-open' : '')}>
        {RT_SORTS.map((s) => (
          <button key={s.key} className={'rt-sort-item' + (s.key === sort ? ' is-on' : '')}
            onClick={() => { setSort(s.key); setOpen(false); }}>
            {s.label}
            {s.key === sort && (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// 랜딩(인기차종 바로 보기)에서 넘어온 예산·차급 → 초기 필터로 적용
const CLS_TO_SEG: Record<string, string> = { compact: 'sedan', midsize: 'sedan', suv: 'suv', premium: 'premium' };
const BUDGET_BAND: Record<string, [number, number]> = { u40: [0, 45], '40_60': [40, 64], '60_80': [58, 84], o80: [78, 9999] };
const BUDGET_LABEL: Record<string, string> = { u40: '40만원 이하', '40_60': '40–60만원', '60_80': '60–80만원', o80: '80만원 이상' };
const BUDGET_ORDER = ['u40', '40_60', '60_80', 'o80'];

interface ToastState {
  msg: string;
}

// 디자인 복원: "이달의 베스트셀러" 판매순위 레일(TOP10). car_sales_monthly 실데이터(useSalesRank). 없으면 미렌더.
function BestsellerRail() {
  const { rows, period } = useSalesRank();
  const top = rows.slice(0, 10);
  if (!top.length) return null;
  return (
    <section style={{ margin: '4px 0 8px' }}>
      <div style={{ padding: '0 var(--rt-pad)', marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#B07A2E' }}>이달의 베스트셀러</p>
        <h2 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#0D1B2A' }}>국내에서 가장 많이 산 차</h2>
        {period && <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#6b7280' }}>{period} 국내 신차 판매량 순위예요. 인기 차종일수록 견적도 빠르게 받아요.</p>}
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '2px var(--rt-pad) 6px', scrollbarWidth: 'none' }}>
        {top.map((r) => (
          <Link
            key={r.car.id}
            href={`/cars/${r.car.id}`}
            style={{ flex: '0 0 auto', width: 150, display: 'flex', flexDirection: 'column', gap: 4, padding: 13, border: '1px solid ' + (r.rank <= 3 ? 'rgba(201,168,76,0.4)' : '#e8eaee'), borderRadius: 16, background: '#fff', textDecoration: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: r.rank <= 3 ? '#C9A84C' : '#f0f0f0', color: r.rank <= 3 ? '#0D1B2A' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{r.rank}</span>
              {r.momDir !== 'flat' && r.momPct !== 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: r.momDir === 'up' ? '#1F8A5B' : '#E0544B' }}>{r.momDir === 'up' ? '▲' : '▼'} {Math.abs(r.momPct)}%</span>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0D1B2A', lineHeight: 1.2 }}>{r.car.model.replace(/\s*\(.*\)/, '')}</div>
            <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{r.car.brand} · {r.car.segLabel}</div>
            <div style={{ fontSize: 12, color: '#4a5568' }}><b style={{ color: '#0D1B2A' }}>{r.units.toLocaleString()}</b>대 판매</div>
            <div style={{ marginTop: 2, fontSize: 13, fontWeight: 700, color: '#0D1B2A' }}>
              <em style={{ fontStyle: 'normal', fontSize: 11, color: '#9ca3af' }}>월 </em>{r.car.from}<i style={{ fontStyle: 'normal', fontSize: 11, color: '#9ca3af' }}>만원~</i>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function PopularEstimatesPreviewPage() {
  const [tab, setTab] = useState<string>('all');
  const [seg, setSeg] = useState<string>('all');
  const [budget, setBudget] = useState<string | null>(null);
  const [sort, setSort] = useState<string>('reco');
  const [saved, setSaved] = useState<string[]>([]);
  const [vsIds, setVsIds] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  // A1: 실 가격(pricing) 바인딩 — 근사 from 을 실 월납으로 덮어씀
  const [prices, setPrices] = useState<Record<string, number>>({});
  useEffect(() => {
    fetch('/api/catalog-pricing').then((r) => r.json()).then((d) => setPrices(d.prices ?? {})).catch(() => {});
  }, []);

  // 마운트 후: 랜딩 쿼리(budget·cls) + localStorage(찜/비교) 복원 (SSR/hydration 안전)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const q = new URLSearchParams(window.location.search);
      const b = q.get('budget');
      const c = q.get('cls');
      if (b && BUDGET_BAND[b]) setBudget(b);
      if (c && CLS_TO_SEG[c]) setSeg(CLS_TO_SEG[c]);
    } catch { /* 무시 */ }
    try {
      setSaved(JSON.parse(localStorage.getItem('rt-saved') || '[]'));
    } catch { /* 무시 */ }
    try {
      setVsIds(JSON.parse(localStorage.getItem('rt-vs-ids') || '[]'));
    } catch { /* 무시 */ }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('rt-saved', JSON.stringify(saved)); } catch { /* 무시 */ }
  }, [saved]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('rt-vs-ids', JSON.stringify(vsIds)); } catch { /* 무시 */ }
  }, [vsIds]);

  const toggleSave = (id: string) =>
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.concat(id)));

  const toggleVs = (id: string) => {
    setVsIds((s) => {
      if (s.includes(id)) { setToast({ msg: '비교에서 빼었어요' }); return s.filter((x) => x !== id); }
      if (s.length >= 3) { setToast({ msg: '비교는 최대 3대까지예요' }); return s; }
      setToast({ msg: '직접 비교에 담았어요' }); return s.concat(id);
    });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // 예산 밴드로 필터. 차급은 유지하되, 결과 0대면 인접 예산대로 한 단계씩 넓혀 빈 화면 방지.
  const { list, widened } = useMemo(() => {
    const sortCars = (input: Car[]): Car[] => {
      const l = input.slice();
      if (sort === 'low') l.sort((a, b) => a.from - b.from);
      else if (sort === 'high') l.sort((a, b) => b.from - a.from);
      else if (sort === 'newest') l.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      else l.sort((a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0)); // 추천순: BEST 우선
      return l;
    };
    const PRICED = RT_CATALOG.map((c) => (prices[c.id] != null ? { ...c, from: prices[c.id] } : c));
    const base = PRICED.filter((c) => rtCarInTab(c, tab) && rtCarInSeg(c, seg));
    if (!budget) return { list: sortCars(base), widened: false };
    const idx = BUDGET_ORDER.indexOf(budget);
    for (let r = 0; r < BUDGET_ORDER.length; r++) {
      const lo = BUDGET_BAND[BUDGET_ORDER[Math.max(0, idx - r)]][0];
      const hi = BUDGET_BAND[BUDGET_ORDER[Math.min(BUDGET_ORDER.length - 1, idx + r)]][1];
      const f = base.filter((c) => c.from >= lo && c.from <= hi);
      if (f.length) return { list: sortCars(f), widened: r > 0 };
    }
    return { list: sortCars(base), widened: false };
  }, [tab, seg, sort, budget, prices]);

  const segLabelOf = (k: string) => RT_SEGS.find((s) => s.key === k)?.label;
  const clearLanding = () => { setBudget(null); setSeg('all'); };

  return (
    <div data-rt="popular-estimates-preview" className="rt-root">
      <div className="rt-page" data-page="list" id="top">
        <RtTopNav />
        <RtGuestGate accent={ACCENT} />

        <div className="rt-list-head">
          <p className="rt-list-eyebrow">전체 차종</p>
          <h1 className="rt-list-title">원하는 차, 사지 말고<br />골라서 빌려 타세요</h1>
          <p className="rt-list-desc">국산·수입·전기차까지 {RT_CATALOG.length}개 차종을 월 렌트료로 비교하고,
            마음에 드는 차의 맞춤 견적을 받아보세요.</p>
        </div>

        <BestsellerRail />

        {/* A2 personalize: 이해도 레벨별 용어설명(초급 펼침/중급 접힘/고급 숨김) */}
        <div style={{ padding: '0 var(--rt-pad)' }}>
          <RtTermDefs
            title="빌려 타기 핵심 용어"
            items={[
              ['월 렌트료', '매달 내는 이용료. 보험·세금·정비가 보통 포함돼요.'],
              ['장기렌트', '회사가 산 차를 1~5년 빌려 타는 방식. 면허만 있으면 OK.'],
              ['오토리스', '차를 빌리되 비용처리·명의에 유리한 금융 상품.'],
              ['보증금·선납', '미리 내면 월 렌트료가 낮아지는 옵션.'],
            ]}
          />
        </div>

        {budget && (
          <div className={'rt-applied' + (widened && list.length ? ' is-widened' : '')}>
            <span className="rt-applied-ic">
              {widened && list.length ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h7M4 12l3-3M4 12l3 3M20 12h-7M20 12l-3-3M20 12l-3 3" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
              )}
            </span>
            <span className="rt-applied-txt">
              {widened && list.length ? (
                <><b>{BUDGET_LABEL[budget]}{seg !== 'all' ? ' · ' + segLabelOf(seg) : ''}</b>에 딱 맞는 차가 없어 예산을 넓혀 비슷한 차를 추렸어요</>
              ) : (
                <><b>{BUDGET_LABEL[budget]}{seg !== 'all' ? ' · ' + segLabelOf(seg) : ''}</b> 조건으로 추렸어요</>
              )}
            </span>
            <button className="rt-applied-clear" onClick={clearLanding}>전체 보기</button>
          </div>
        )}

        <div className="rt-tabs-wrap">
          <div className="rt-tabs">
            {RT_TABS.map((t) => (
              <button key={t.key} className={'rt-cat-tab' + (t.key === tab ? ' is-on' : '')}
                onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rt-controls">
          <span className="rt-result-count">총 <b>{list.length}</b>개 차종</span>
          <SortControl sort={sort} setSort={setSort} />
        </div>

        <div className="rt-segs">
          {RT_SEGS.map((s) => (
            <button key={s.key} className={'rt-seg' + (s.key === seg ? ' is-on' : '')}
              onClick={() => setSeg(s.key)}>{s.label}</button>
          ))}
        </div>

        {list.length ? (
          <div className="rt-grid">
            {list.map((c) => (
              <VCard key={c.id} car={c} saved={saved.includes(c.id)} onToggleSave={toggleSave}
                inVs={vsIds.includes(c.id)} onToggleVs={toggleVs} />
            ))}
          </div>
        ) : (
          <div className="rt-empty">
            <b>조건에 맞는 차종이 없어요</b>
            <span>다른 차급이나 카테고리를 선택해 보세요.</span>
          </div>
        )}

        <RtTabBar active="cars" />
      </div>
      {toast && (
        <div className="rt-vcmp-toast is-show">
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
