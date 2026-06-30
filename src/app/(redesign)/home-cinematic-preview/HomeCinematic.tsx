'use client';

// HomeCinematic.tsx — 홈 = 넷플릭스식 시네마틱 허브 (프리뷰).
// 원본 프로토타입: 디자인 프로젝트 home-app.jsx + rt-home.css.
// 빌보드(자동 로테이션 + 켄번스 + 스태거 등장) + 가로 스크롤 행: TOP10·특가·전기차·쇼츠·아티클·프리미엄·가성비·도구.
// 실데이터 배선:
//   · 포스터/빌보드 이미지 = carImageUrl(car.imageKey)  (실패 시 hue 그라데이션 폴백)
//   · 쇼츠/아티클 = /api/info-articles (contentType: clip / article)
//   · 행 구성 = RT_CATALOG 필터
// 제외(운영 빌드): TweaksPanel / RtControlBar / 디바이스 토글 / image-slot 커스텀 엘리먼트.
// 노출 제어(isLive)는 현재 전부 live 기본 — site_pages 연동은 §6.12F 후속(미들웨어/플래그).

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { RT_CATALOG, rtFindCar, type Car } from '@/lib/rentailor/catalog';
import { carImageUrl } from '@/lib/car-image-url';
import { RtTabBar } from '@/components/rentailor/RtChrome';
import './home.css';

// ── 헬퍼 ─────────────────────────────────────────────────────
const shortM = (m: string) => m.replace(/\s*\(.*\)/, '');
const detailHref = (id: string) => `/cars/${id}`;
// 노출 제어 — 프리뷰에선 전부 live. (운영: site_pages.status 연동)
const isLive = (key: string): boolean => { void key; return true; };

// 빌보드 배경 (화이트 톤) — 흰색 지배 + 차색 옅은 hue 틴트로 흰배경 컷아웃 차량 경계·깊이 확보.
function billboardBg(hue: number): React.CSSProperties {
  return {
    background: `linear-gradient(165deg, #FFFFFF 0%, hsl(${hue} 45% 96%) 55%, hsl(${hue} 42% 90%) 100%)`,
  };
}
const fuelBadge = (c: Car): { cls: string; label: string } | null =>
  c.fuel === 'ev' ? { cls: 'ev', label: '전기차' }
  : c.isNew ? { cls: 'new', label: 'NEW' }
  : c.best ? { cls: '', label: '인기' }
  : null;

// 실 차량 사진(흰배경 컷아웃) — 로드 실패 시 숨겨 hue 그라데이션 폴백 노출.
function CarImg({ imageKey, alt }: { imageKey?: string; alt: string }) {
  const [ok, setOk] = useState(Boolean(imageKey));
  if (!imageKey || !ok) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="nf-img"
      src={carImageUrl(imageKey)}
      alt={alt}
      loading="lazy"
      onError={() => setOk(false)}
    />
  );
}
function BillboardImg({ imageKey, alt }: { imageKey?: string; alt: string }) {
  const [ok, setOk] = useState(Boolean(imageKey));
  if (!imageKey || !ok) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="nf-bb-kb" src={carImageUrl(imageKey)} alt={alt} onError={() => setOk(false)} />
  );
}
// 썸네일(쇼츠/아티클) — thumbnailUrl 있으면 노출, 없거나 실패 시 hue 그라데이션.
function ThumbImg({ url, alt }: { url: string | null; alt: string }) {
  const [ok, setOk] = useState(Boolean(url));
  if (!url || !ok) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="nf-img" src={url} alt={alt} loading="lazy" onError={() => setOk(false)} />;
}

// ── 빌보드 히어로 (자동 로테이션) ────────────────────────────
interface Featured extends Car {
  tagline: { kicker: string; title: string; sub: string };
}
function NfBillboard({ featured, hero }: { featured: Featured[]; hero: string }) {
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((n: number) => {
    setIdx((((n % featured.length) + featured.length) % featured.length));
  }, [featured.length]);

  useEffect(() => {
    if (featured.length < 2) return;
    timer.current = setTimeout(() => go(idx + 1), 7000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [idx, featured.length, go]);

  if (!featured.length) return null;
  const cur = featured[idx];

  return (
    <section className="nf-bb" data-hero={hero || 'gleam'}>
      {featured.map((c, i) => (
        <div className="nf-bb-art" key={c.id} data-show={i === idx ? '1' : '0'} style={billboardBg(c.hue)}>
          <BillboardImg imageKey={c.imageKey} alt={`${c.brand} ${c.model}`} />
        </div>
      ))}
      <div className="nf-bb-body" key={cur.id}>
        <span className="nf-bb-rank">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M5 21l1.6-7L1.5 9.3l7-.6L12 2l3.5 6.7 7 .6-5.1 4.7L19 21l-7-3.7z" /></svg>
          {cur.tagline.kicker}
        </span>
        <h1 className="nf-bb-title">{cur.tagline.title}</h1>
        <p className="nf-bb-sub">{cur.tagline.sub}</p>
        <div className="nf-bb-meta">
          <span>{cur.segLabel}</span><span className="dot" />
          {cur.spec && cur.spec.eff ? <><span>{cur.spec.eff}</span><span className="dot" /></> : null}
          <span className="nf-bb-price"><b>월</b> <em>{cur.from}만원</em>~</span>
        </div>
        <div className="nf-bb-actions">
          <Link className="nf-btn nf-btn--play" href="/estimate">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 5l12 7-12 7z" /></svg>
            견적받기
          </Link>
          <Link className="nf-btn nf-btn--info" href={detailHref(cur.id)}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" strokeLinecap="round" /></svg>
            자세히 보기
          </Link>
          <Link className="nf-btn nf-btn--icon" href="/popular-estimates" aria-label="전체 차종">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </Link>
        </div>
      </div>
      {featured.length > 1 ? (
        <div className="nf-bb-dots">
          {featured.map((c, i) => (
            <button key={c.id} className={'nf-bb-dot' + (i === idx ? ' is-on' : '')}
              onClick={() => go(i)} aria-label={`빌보드 ${i + 1}`} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

// ── 차종 포스터 카드 ─────────────────────────────────────────
function CarCard({ c }: { c: Car }) {
  const b = fuelBadge(c);
  return (
    <div className="nf-card">
      <Link className="nf-poster" href={detailHref(c.id)}>
        <CarImg imageKey={c.imageKey} alt={`${c.brand} ${shortM(c.model)}`} />
        {b ? <span className={'nf-poster-badge ' + b.cls}>{b.label}</span> : null}
        <div className="nf-poster-info">
          <div className="nf-poster-brand">{c.brand}</div>
          <div className="nf-poster-name">{shortM(c.model)}</div>
        </div>
      </Link>
      <Link className="nf-card-foot" href={detailHref(c.id)}>
        <span className="nf-card-from">월</span>
        <span className="nf-card-price">{c.from}</span>
        <span className="nf-card-unit">만원~</span>
      </Link>
    </div>
  );
}

function CarRow({ title, pt, items, more }: { title: React.ReactNode; pt?: boolean; items: Car[]; more?: string }) {
  if (!items.length) return null;
  return (
    <section className="nf-row">
      <div className="nf-row-hd">
        <h2 className="nf-row-t">{pt ? <span className="pt">{title}</span> : title}</h2>
        {more ? <Link className="nf-row-more" href={more}>전체 →</Link> : null}
      </div>
      <div className="nf-track">
        {items.map((c) => <CarCard key={c.id} c={c} />)}
      </div>
    </section>
  );
}

// ── 특가 행 (코랄 포인트) — 하드코딩 큐레이션(특가 운영 테이블 연동은 후속) ──
const HOME_DEALS = [
  { carId: 'ioniq5', was: 110, now: 89, left: 4 },
  { carId: 'ev6', was: 101, now: 84, left: 2 },
  { carId: 'sorento', was: 80, now: 69, left: 9 },
  { carId: 'modely', was: 109, now: 92, left: 3 },
  { carId: 'grandeur', was: 85, now: 72, left: 18 },
  { carId: 'carnival', was: 80, now: 70, left: 7 },
  { carId: 'avante', was: 45, now: 38, left: 12 },
  { carId: 'gv70', was: 122, now: 105, left: 11 },
];
function NfDealRow({ title, limit }: { title?: React.ReactNode; limit?: number }) {
  if (!isLive('이벤트·특가')) return null;
  const all = HOME_DEALS.map((d) => ({ d, c: rtFindCar(d.carId) })).filter((x): x is { d: typeof HOME_DEALS[number]; c: Car } => Boolean(x.c));
  const deals = typeof limit === 'number' ? all.slice(0, limit) : all;
  if (!deals.length) return null;
  return (
    <section className="nf-row">
      <div className="nf-row-hd">
        <h2 className="nf-row-t">{title || <><span className="pt">이번 주 특가</span> · 한정 수량</>}</h2>
        <Link className="nf-row-more" href="/promotions">전체 →</Link>
      </div>
      <div className="nf-track">
        {deals.map(({ d, c }) => (
          <div className="nf-card nf-deal" key={d.carId}>
            <Link className="nf-poster" href="/promotions">
              <CarImg imageKey={c.imageKey} alt={`${c.brand} ${shortM(c.model)}`} />
              <span className="nf-deal-ribbon">특가</span>
              <span className="nf-deal-left">{d.left}대 남음</span>
              <div className="nf-poster-info">
                <div className="nf-poster-brand">{c.brand}</div>
                <div className="nf-poster-name">{shortM(c.model)}</div>
              </div>
            </Link>
            <Link className="nf-deal-foot" href="/promotions">
              <span className="nf-deal-was">{d.was}</span>
              <span className="nf-deal-now">월 {d.now}<i>만원~</i></span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 콘텐츠(쇼츠·아티클) 데이터 훅 — /api/info-articles ───────
interface ArticleItem {
  id: string;
  title: string;
  linkUrl: string;
  thumbnailUrl: string | null;
  category: string;
  contentType: string;
  duration: string | null;
}
function useInfoArticles() {
  const [items, setItems] = useState<ArticleItem[]>([]);
  useEffect(() => {
    let alive = true;
    fetch('/api/info-articles')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d?.articles) setItems(d.articles as ArticleItem[]); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return items;
}

// ── 쇼츠 행 (세로 9:16) ──────────────────────────────────────
function NfClipRow({ articles, title, limit = 10 }: { articles: ArticleItem[]; title?: React.ReactNode; limit?: number }) {
  if (!isLive('클립')) return null;
  const clips = articles.filter((a) => a.contentType === 'clip').slice(0, limit);
  if (!clips.length) return null;
  return (
    <section className="nf-row">
      <div className="nf-row-hd">
        <h2 className="nf-row-t">{title || '30초 쇼츠로 배우기'}</h2>
        <Link className="nf-row-more" href="/info/clips">전체 →</Link>
      </div>
      <div className="nf-track nf-track--clip">
        {clips.map((c) => (
          <Link className="nf-clip" key={c.id} href={c.linkUrl}>
            <div className="nf-clip-poster">
              <ThumbImg url={c.thumbnailUrl} alt={c.title} />
              {c.duration ? <span className="nf-clip-dur">{c.duration}</span> : null}
              <span className="nf-clip-play">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="#fff"><path d="M8 5l11 7-11 7z" /></svg>
              </span>
              <div className="nf-clip-title">{c.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── 아티클 행 ────────────────────────────────────────────────
function NfArticleRow({ articles, title, limit = 10 }: { articles: ArticleItem[]; title?: React.ReactNode; limit?: number }) {
  if (!isLive('정보 가이드')) return null;
  const arts = articles.filter((a) => a.contentType !== 'clip').slice(0, limit);
  if (!arts.length) return null;
  return (
    <section className="nf-row">
      <div className="nf-row-hd">
        <h2 className="nf-row-t">{title || '알아두면 좋은 가이드'}</h2>
        <Link className="nf-row-more" href="/info">전체 →</Link>
      </div>
      <div className="nf-track">
        {arts.map((a) => (
          <Link className="nf-art" key={a.id} href={a.linkUrl}>
            <div className="nf-art-top">
              <ThumbImg url={a.thumbnailUrl} alt={a.title} />
              <span className="nf-art-tag">{a.category}</span>
            </div>
            <div className="nf-art-body">
              <div className="nf-art-title">{a.title}</div>
              {a.duration ? <div className="nf-art-read">{a.duration} 읽기</div> : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── 다크 푸터 ────────────────────────────────────────────────
function NfFooter() {
  const links = [
    { k: '이용약관', h: '/terms' },
    { k: '개인정보처리방침', h: '/privacy' },
  ].filter((l) => isLive(l.k));
  return (
    <footer className="nf-foot">
      <div className="nf-foot-brand">RENTAILOR</div>
      <div className="nf-foot-links">
        {links.map((l) => <Link key={l.k} href={l.h}>{l.k}</Link>)}
      </div>
      <div className="nf-foot-copy">
        리스 · 렌트 · 할부 통합 비교 플랫폼 · 제휴 캐피탈 9곳<br />
        © 2026 Rentailor. 표시 금액은 조건에 따라 달라질 수 있어요.
      </div>
    </footer>
  );
}

// ── 빌보드 추천 카피 ─────────────────────────────────────────
const TAGLINES: Record<string, { kicker: string; title: string; sub: string }> = {
  grandeur: { kicker: '이달의 베스트셀러', title: '대한민국이 가장\n많이 타는 세단', sub: '신차 등록 1위 그랜저, 보험·세금 포함 월 렌트료로 시작하세요.' },
  ev9: { kicker: '지금 뜨는 신차', title: '7인승 대형 전기,\n새로 나왔습니다', sub: 'EV9 — 1회 충전 501km, 보조금 반영 렌트료로 더 가볍게.' },
  gv70: { kicker: '프리미엄 추천', title: '프리미엄 SUV를\n월 단위로 누리다', sub: '제네시스 GV70, 초기 비용 0원으로 시작하는 프리미엄.' },
  ioniq5: { kicker: '전기차 특가', title: '전기차, 렌트가\n더 쌀 수 있어요', sub: '아이오닉 5 — 보조금이 렌트료에 반영돼 부담을 확 낮췄어요.' },
};

// ── 홈 CMS (billboard_slides / home_sections) — DB 구동 + 하드코딩 폴백 ───────
// /api/home-cms 가 빈배열/에러면 아래 FALLBACK_* 로 강등 → 홈 절대 안 깨짐.
interface SlideInput { carId: string; kicker: string; title: string; sub: string | null }
interface SectionParams {
  segment?: string; fuel?: string; best?: boolean; isNew?: boolean; fromMax?: number; sort?: string; limit?: number; // car_filter
  car_ids?: string[];   // car_manual
  contentType?: string; // article
}
type SectionType = 'car_filter' | 'car_manual' | 'sales_rank' | 'deals' | 'article';
interface SectionConfig { id: string; sectionType: SectionType; title?: string; params?: SectionParams; more?: string }

// 빌보드 폴백 = 기존 하드코딩(TAGLINES 4종)을 슬라이드 데이터로 승격(보존).
const FALLBACK_FEATURED_SLIDES: SlideInput[] = ['grandeur', 'ev9', 'gv70', 'ioniq5']
  .filter((id) => TAGLINES[id])
  .map((id) => ({ carId: id, kicker: TAGLINES[id].kicker, title: TAGLINES[id].title, sub: TAGLINES[id].sub }));

// 섹션 폴백 = 기존 하드코딩 9줄을 섹션 구성으로 승격(보존). title 미지정 행은 컴포넌트 기본 장식 제목 사용.
const FALLBACK_SECTIONS: SectionConfig[] = [
  { id: 'fb-deals', sectionType: 'deals' },
  { id: 'fb-newev', sectionType: 'car_filter', title: '새로 나온 전기차', params: { fuel: 'ev', isNew: true }, more: '/popular-estimates' },
  { id: 'fb-clip', sectionType: 'article', params: { contentType: 'clip' } },
  { id: 'fb-best', sectionType: 'car_filter', title: '추천 인기 차종', params: { best: true }, more: '/popular-estimates' },
  { id: 'fb-article', sectionType: 'article', params: { contentType: 'article' } },
  { id: 'fb-value', sectionType: 'car_filter', title: '가성비 좋은 차', params: { fromMax: 64, sort: 'from_asc' }, more: '/popular-estimates' },
  { id: 'fb-premium', sectionType: 'car_filter', title: '프리미엄 · 대형', params: { segment: 'premium' }, more: '/popular-estimates' },
];

// car_filter params → RT_CATALOG 필터/정렬/limit (지정 키만 AND 적용).
function carsByFilter(p: SectionParams): Car[] {
  let pool = RT_CATALOG.slice();
  if (p.segment) pool = pool.filter((c) => c.seg === p.segment);
  if (p.fuel) pool = pool.filter((c) => c.fuel === p.fuel);
  if (p.best) pool = pool.filter((c) => c.best);
  if (p.isNew) pool = pool.filter((c) => c.isNew);
  if (typeof p.fromMax === 'number') pool = pool.filter((c) => c.from <= (p.fromMax as number));
  if (p.sort === 'from_asc') pool = pool.slice().sort((a, b) => a.from - b.from);
  if (typeof p.limit === 'number') pool = pool.slice(0, p.limit);
  return pool;
}
// car_manual → car_ids 배열 순서대로(RT_CATALOG에 없는 id는 skip).
const carsByIds = (ids: string[]): Car[] => ids.map((id) => rtFindCar(id)).filter((c): c is Car => Boolean(c));
// 슬라이드 데이터 → Featured(차종 못 찾으면 해당 슬라이드 skip).
const resolveFeatured = (slides: SlideInput[]): Featured[] =>
  slides
    .map((s) => { const c = rtFindCar(s.carId); return c ? ({ ...c, tagline: { kicker: s.kicker, title: s.title, sub: s.sub ?? '' } }) : null; })
    .filter((x): x is Featured => Boolean(x));

interface HomeCmsData { slides: SlideInput[]; sections: SectionConfig[] }
function useHomeCms(): HomeCmsData {
  // 초기값 = 폴백 → 첫 페인트부터 빈 화면 없음.
  const [data, setData] = useState<HomeCmsData>({ slides: FALLBACK_FEATURED_SLIDES, sections: FALLBACK_SECTIONS });
  useEffect(() => {
    let alive = true;
    fetch('/api/home-cms')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return;
        const nextSections = Array.isArray(d.sections) && d.sections.length ? (d.sections as SectionConfig[]) : FALLBACK_SECTIONS;
        setData({
          slides: Array.isArray(d.slides) && d.slides.length ? (d.slides as SlideInput[]) : FALLBACK_FEATURED_SLIDES,
          // sales_rank(TOP10 판매순위) 섹션은 영구 제외 — CMS가 내려줘도 렌더 안 함.
          sections: nextSections.filter((s) => s.sectionType !== 'sales_rank'),
        });
      })
      .catch(() => {}); // 에러 → 폴백 유지
    return () => { alive = false; };
  }, []);
  return data;
}

// section_type별 분기 → 기존 행 컴포넌트 재사용. 알 수 없는 type → skip.
function SectionRenderer({ section, articles }: { section: SectionConfig; articles: ArticleItem[] }) {
  const p = section.params ?? {};
  switch (section.sectionType) {
    case 'car_filter':
      return <CarRow title={section.title ?? ''} items={carsByFilter(p)} more={section.more ?? '/popular-estimates'} />;
    case 'car_manual':
      return <CarRow title={section.title ?? ''} items={carsByIds(p.car_ids ?? [])} more={section.more ?? '/popular-estimates'} />;
    case 'deals':
      return <NfDealRow title={section.title} limit={p.limit} />;
    case 'article':
      return p.contentType === 'clip'
        ? <NfClipRow articles={articles} title={section.title} limit={p.limit ?? 10} />
        : <NfArticleRow articles={articles} title={section.title} limit={p.limit ?? 10} />;
    default:
      return null;
  }
}

// ── 루트 ─────────────────────────────────────────────────────
export default function HomeCinematic() {
  const scrollEl = useRef<HTMLDivElement>(null);
  const articles = useInfoArticles();
  const { slides, sections } = useHomeCms();
  const featured = resolveFeatured(slides);

  return (
    <div data-rt="home-cinematic" className="rt-root" style={{ ['--rt-accent' as string]: '#C9A84C' } as React.CSSProperties}>
      <div className="rt-page" data-page="home" data-deck-active id="top">
        <div className="rt-scroll" ref={scrollEl}>
          <NfBillboard featured={featured} hero="gleam" />
          {sections.map((s) => <SectionRenderer key={s.id} section={s} articles={articles} />)}
          <NfFooter />
          <RtTabBar active="home" />
        </div>
      </div>
    </div>
  );
}
