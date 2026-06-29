'use client';

// 차종 상세 리뉴얼 미리보기 (타깃: /cars/[slug])
// 원본: _design_ref/detail-app.jsx (window 전역 → @/lib/rentailor/catalog import)
// 적응/제외:
//   - tweaks-panel / 디바이스 토글 / personalize(DTerm·RtTermDefs·DetailBizCard) /
//     RtMarketInsight·SalesBand(판매량 데이터 없음) / image-slot → hue 그라데이션 div
//   - window.* → 모듈 import, .html 링크 → 실 프리뷰 라우트
//   - 게스트 가드 strict 유지하되, 전진 내비 앵커는 data-guest="allow" 로 통과시켜 미리보기 탐색 가능
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RtTopNav } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { RtGuestGate } from '@/components/rentailor/RtGuestGate';
import { RtIconConsult, RtIconCompare, RtIconContract, RtIconCar } from '@/components/rentailor/RtIcons';
import { Button } from '@/components/ui/Button';
import { CarSpinViewer } from '@/components/cars/CarSpinViewer';
import { carImageUrl } from '@/lib/car-image-url';
import {
  rtFindCar,
  rtSimilar,
  FUEL,
  RT_DETAIL_TERMS,
  RT_DETAIL_MILEAGE,
  RT_DETAIL_DEPOSIT,
  RT_DETAIL_PRODUCTS,
  rtLowestCapital,
  rtRelatedContent,
  RT_STEPS,
  RT_DETAIL_FAQS,
  type Car,
  type ProductKey,
  type InfoArticleLike,
  type RtRelatedItem,
} from '@/lib/rentailor/catalog';
import '../detail.css';
import { RtTermDefs, RtTypeOnly, RtPersonalizeModal } from '@/lib/rentailor/personalize';
import { useSalesRank } from '@/lib/rentailor/useSalesRank';

// 디자인 복원: 사업자 고객 안내(고객유형 sole/corp 한정). RtTypeOnly 재사용.
function DetailBizCard() {
  return (
    <RtTypeOnly types={['sole', 'corp']}>
      <div style={{ margin: '14px var(--rt-pad) 0', padding: '13px 15px', border: '1px solid #e8eaee', borderRadius: 14, background: '#faf7ef' }}>
        <b style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: '#0D1B2A', marginBottom: 4 }}>사업자 고객 안내</b>
        <span style={{ fontSize: 12.5, color: '#4a5568', lineHeight: 1.55 }}>장기렌트는 렌트료 전액을 비용처리할 수 있어 절세에 유리해요(부가세 환급은 차종·용도별). 법인은 임직원 전용 차량으로 운용할 수 있고, 세금계산서는 매월 발행돼요.</span>
      </div>
    </RtTypeOnly>
  );
}

// 디자인 복원: 이달 판매 실적 밴드. car_sales_monthly 실데이터(useSalesRank). 매칭 없으면 미렌더.
function SalesBand({ car }: { car: Car }) {
  const { rows, period } = useSalesRank();
  const sale = rows.find((r) => r.car.id === car.id);
  if (!sale) return null;
  const up = sale.momDir === 'up';
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center', margin: '14px var(--rt-pad) 0', padding: '13px 15px', border: '1px solid #e8eaee', borderRadius: 14, background: '#fff' }}>
      <div style={{ flexShrink: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#C9A84C', lineHeight: 1 }}>{sale.natRank}<i style={{ fontStyle: 'normal', fontSize: 13, color: '#9ca3af' }}>위</i></div>
        <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 3 }}>국내 신차 판매</div>
      </div>
      <div style={{ borderLeft: '1px solid #f0f0f0', paddingLeft: 14 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#0D1B2A' }}>{car.segLabel} 판매 <b style={{ color: '#B07A2E' }}>{sale.segRank}위</b>의 인기 차종이에요</p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
          {period} <b style={{ color: '#0D1B2A' }}>{sale.units.toLocaleString()}대</b> 등록
          {sale.momDir !== 'flat' && sale.momPct !== 0 && (
            <span style={{ marginLeft: 6, fontWeight: 700, color: up ? '#1F8A5B' : '#E0544B' }}>{up ? '▲' : '▼'} {Math.abs(sale.momPct)}%</span>
          )}
        </p>
      </div>
    </div>
  );
}

const ACCENT = '#C9A84C';
const SAVE_KEY = 'rt-saved';
const VS_KEY = 'rt-vs-ids';

interface DetailBadge {
  label: string;
  cls: string;
}
function detailBadges(c: Car): DetailBadge[] {
  const out: DetailBadge[] = [];
  if (c.best) out.push({ label: 'BEST', cls: 'rt-badge-best' });
  if (c.fuel === 'ev') out.push({ label: '전기차', cls: 'rt-badge-ev' });
  else if (c.fuel === 'hybrid') out.push({ label: '하이브리드', cls: 'rt-badge-low' });
  c.badges.forEach((b) => {
    if (b === '전기차') return;
    if (b === '인기') out.push({ label: '인기', cls: 'rt-badge-hot' });
    else if (b === '최저가') out.push({ label: '최저가', cls: 'rt-badge-low' });
  });
  return out.slice(0, 3);
}

function StepIcon({ name }: { name: string }) {
  const map: Record<string, React.ComponentType<{ size?: number }>> = {
    consult: RtIconConsult,
    compare: RtIconCompare,
    contract: RtIconContract,
    car: RtIconCar,
  };
  const C = map[name];
  return C ? <C size={26} /> : null;
}

function DFaq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={'rt-faq' + (open ? ' is-open' : '')}>
      <button className="rt-faq-q" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rt-faq-chev"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <div className="rt-faq-a"><p>{a}</p></div>
    </div>
  );
}

function Included() {
  const items = ['자동차 보험', '자동차세', '정기 점검', '신차 무료 탁송'];
  return (
    <div className="rt-included">
      {items.map((t) => (
        <span className="rt-inc" key={t}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
          {t}
        </span>
      ))}
    </div>
  );
}

interface ToastState {
  msg: string;
  link: boolean;
}

function readIds(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const v = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}

// 관련 콘텐츠 카드 — 라이브 CarArticles/InfoArticles 와 동일하게 thumbnailUrl 을 렌더.
// 썸네일 없거나 로드 실패 시 이미지 미렌더 → rt-ccard-media 의 hue 그라데이션 폴백 노출.
function RtRelatedCard({ p, fallbackHue }: { p: RtRelatedItem; fallbackHue: number }) {
  const [imgOk, setImgOk] = useState(Boolean(p.thumbnailUrl));
  return (
    <Link className="rt-ccard" href={`/info-preview/${p.id}`} data-guest="allow" style={{ '--hue': p.hue ?? fallbackHue } as React.CSSProperties}>
      <div className="rt-ccard-media">
        {imgOk && p.thumbnailUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="rt-ccard-img"
              src={p.thumbnailUrl}
              alt={p.title ?? ''}
              loading="lazy"
              onError={() => setImgOk(false)}
            />
            {p.tag && <span className="rt-ccard-shade" />}
          </>
        )}
        {p.tag && <span className="rt-ccard-tag">{p.tag}</span>}
      </div>
      <div className="rt-ccard-body">
        <p className="rt-ccard-title">{p.title}</p>
        <div className="rt-ccard-meta">
          <b>Rentailor 매거진</b><i></i><span>{p.read}</span>
        </div>
      </div>
    </Link>
  );
}

export default function CarsDetailPreviewPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';
  const baseCar = rtFindCar(slug);

  // hooks 는 조건부 return 이전에 모두 호출 (car 없을 때도 안정)
  const [trimIdx, setTrimIdx] = useState(0);
  const [product, setProduct] = useState<ProductKey>('rent');
  const [months, setMonths] = useState(48);
  const [km, setKm] = useState(20000);
  const [dep, setDep] = useState('none');
  const [sheet, setSheet] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inVs, setInVs] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [articles, setArticles] = useState<InfoArticleLike[]>([]);
  // A1: 실 가격(pricing)·스펙(vehicle_trims) 바인딩
  const [px, setPx] = useState<{ from?: number; spec?: Record<string, string | number> } | null>(null);
  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch('/api/catalog-pricing').then((r) => r.json()).catch(() => ({ prices: {} })),
      fetch(`/api/vehicle-spec?slug=${encodeURIComponent(slug)}`).then((r) => r.json()).catch(() => ({ spec: null })),
    ]).then(([p, s]) => {
      const from = p?.prices?.[slug];
      const spec: Record<string, string | number> = {};
      if (s?.spec?.eff) spec.eff = s.spec.eff;
      if (s?.spec?.power) spec.power = s.spec.power;
      setPx({ from: from ?? undefined, spec: Object.keys(spec).length ? spec : undefined });
    });
  }, [slug]);
  const car = baseCar
    ? { ...baseCar, from: px?.from ?? baseCar.from, spec: { ...baseCar.spec, ...(px?.spec ?? {}) } }
    : null;

  // 마운트 후 localStorage 동기화 (SSR 안전)
  useEffect(() => {
    if (!car) return;
    setSaved(readIds(SAVE_KEY).includes(car.id));
    setInVs(readIds(VS_KEY).includes(car.id));
  }, [car]);

  // 관련 콘텐츠용 info-articles (실패 시 빈 배열 폴백)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/info-articles');
        const json = await res.json();
        const list = Array.isArray(json?.articles) ? (json.articles as InfoArticleLike[]) : [];
        if (alive) setArticles(list);
      } catch {
        if (alive) setArticles([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const base = car ? car.trims[trimIdx].base : 0;
  const quote = useMemo(
    () => rtLowestCapital(base, product, months, km, dep),
    [base, product, months, km, dep]
  );
  const similar = useMemo(() => rtSimilar(car, 6), [car]);
  const related = useMemo(() => rtRelatedContent(car, articles), [car, articles]);

  if (!car) {
    return (
      <div data-rt="cars-detail-preview" className="rt-root">
        <div className="rt-page" id="top">
          <RtTopNav title="차종 상세" backHref="/popular-estimates" />
          <div className="rt-empty">
            <b>차종을 찾을 수 없어요</b>
            <span>요청하신 차종 정보가 없습니다.</span>
            <br />
            <br />
            <Link href="/">← 홈으로 돌아가기</Link>
          </div>
        </div>
      </div>
    );
  }

  const isInstall = product === 'install';
  const monthly = quote.monthly;
  const prodMeta = RT_DETAIL_PRODUCTS.find((p) => p.key === product) ?? RT_DETAIL_PRODUCTS[0];
  const badges = detailBadges(car);
  const effIsRange = car.fuel === 'ev';
  const term = RT_DETAIL_TERMS.find((x) => x.months === months) ?? RT_DETAIL_TERMS[0];
  const mile = RT_DETAIL_MILEAGE.find((x) => x.km === km) ?? RT_DETAIL_MILEAGE[1];
  const depo = RT_DETAIL_DEPOSIT.find((x) => x.key === dep) ?? RT_DETAIL_DEPOSIT[0];
  const priceLabel = '월 ' + monthly + '만원';

  const toggleSave = () => {
    let arr = readIds(SAVE_KEY);
    if (arr.includes(car.id)) {
      arr = arr.filter((x) => x !== car.id);
      setSaved(false);
    } else {
      arr = arr.concat(car.id);
      setSaved(true);
    }
    if (typeof window !== 'undefined') window.localStorage.setItem(SAVE_KEY, JSON.stringify(arr));
  };
  const toggleVs = () => {
    let arr = readIds(VS_KEY);
    if (arr.includes(car.id)) {
      arr = arr.filter((x) => x !== car.id);
      setInVs(false);
      setToast({ msg: '비교에서 빼었어요', link: false });
    } else if (arr.length >= 3) {
      setToast({ msg: '비교는 최대 3대까지예요', link: true });
      return;
    } else {
      arr = arr.concat(car.id);
      setInVs(true);
      setToast({ msg: '직접 비교에 담았어요', link: true });
    }
    if (typeof window !== 'undefined') window.localStorage.setItem(VS_KEY, JSON.stringify(arr));
  };

  return (
    <div data-rt="cars-detail-preview" className="rt-root">
      <div className="rt-page" data-page="detail" id="top">
        {/* 디자인 복원: 첫 진입 개인화 모달(이해도·고객유형) */}
        <RtPersonalizeModal />
        <RtTopNav title={car.brand + ' ' + car.model} backHref="/popular-estimates" />
        <RtGuestGate accent={ACCENT} strict />

        {/* 히어로 */}
        <div className="rt-dhero">
          <div className="rt-dhero-media" style={{ '--hue': car.hue } as React.CSSProperties}>
            {car.has360Spin ? (
              <CarSpinViewer slug={car.id} frameCount={car.frameCount} startFrame={car.spinStartFrame ?? 0} onFailed={() => {}} />
            ) : car.imageKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={carImageUrl(car.imageKey)}
                alt={car.model}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '3%' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : null}
            <div className="rt-dhero-badges">
              {badges.map((b, i) => (
                <span className={'rt-badge ' + b.cls} key={i}>{b.label}</span>
              ))}
            </div>
            <button className={'rt-vcmp' + (inVs ? ' is-on' : '')} aria-label="직접 비교 담기" onClick={toggleVs}>
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3v14M5 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM19 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 7v14" /><path d="M9 5h6M9 19h6" /></svg>
            </button>
            <button className={'rt-save' + (saved ? ' is-on' : '')} aria-label="찜하기" onClick={toggleSave}>
              <svg viewBox="0 0 24 24" width="19" height="19" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8.4 3.8 3.8 0 0 1 19 10.8C19 15.6 12 20 12 20z" /></svg>
            </button>
          </div>
          <div className="rt-dhero-body">
            <span className="rt-dhero-brand">{car.brand}</span>
            <h1 className="rt-dhero-name">{car.model}</h1>
            <p className="rt-dhero-seg">{car.segLabel} · {FUEL[car.fuel].label}</p>
            <div className="rt-dhero-price">
              <span className="rt-dhero-from">월</span>
              <span className="rt-dhero-num">{car.from}</span>
              <span className="rt-dhero-unit">만원~</span>
            </div>
            <p className="rt-dhero-note">36개월·무보증 최저 트림 기준 · 보험·세금 포함</p>
          </div>
          <div className="rt-specs">
            <div className="rt-spec">
              <span className="rt-spec-v">{car.spec.eff || ''}</span>
              <span className="rt-spec-k">{effIsRange ? '1회 충전' : '복합 연비'}</span>
            </div>
            <div className="rt-spec">
              <span className="rt-spec-v">{car.spec.power || ''}</span>
              <span className="rt-spec-k">최고 출력</span>
            </div>
            <div className="rt-spec">
              {/* 가드: seatLabel/seats 없으면 빈칸 ("undefined인승" 차단) */}
              <span className="rt-spec-v">{car.spec.seatLabel || (car.spec.seats != null ? `${car.spec.seats}인승` : '')}</span>
              <span className="rt-spec-k">승차 인원</span>
            </div>
            <div className="rt-spec">
              <span className="rt-spec-v">{car.trims.length}개</span>
              <span className="rt-spec-k">선택 트림</span>
            </div>
          </div>
        </div>

        {/* 디자인 복원: 판매 실적 밴드 + 사업자 안내 */}
        <SalesBand car={car} />
        <DetailBizCard />

        {/* 트림 선택 */}
        <section className="rt-sec">
          <div className="rt-sec-hd">
            <div>
              <h2 className="rt-sec-title">트림 선택</h2>
              <p className="rt-sec-sub">원하는 사양을 고르면 월 렌트료가 바로 반영돼요.</p>
            </div>
          </div>
          <div className="rt-trims">
            {car.trims.map((tr, i) => (
              <button key={i} className={'rt-trim' + (i === trimIdx ? ' is-on' : '')} onClick={() => setTrimIdx(i)}>
                <span className="rt-trim-radio"><i></i></span>
                <span className="rt-trim-main">
                  <span className="rt-trim-name">{tr.name}</span>
                  <span className="rt-trim-note">{tr.note}</span>
                </span>
                <span className="rt-trim-price"><b>월 {tr.base}</b><span>만원~</span></span>
              </button>
            ))}
          </div>
          <Link className="rt-trim-more" href={`/car-options-preview/${car.id}?trim=${trimIdx}`} data-guest="allow">
            <span>
              <b>전체 옵션·사양 자세히 보기</b>
              <span>트림별 안전·편의·인포테인먼트 사양과 색상을 확인하세요</span>
            </span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </Link>
        </section>

        {/* 견적 조건 */}
        <section className="rt-sec">
          <div className="rt-sec-hd">
            <div>
              <h2 className="rt-sec-title">견적 조건</h2>
              <p className="rt-sec-sub">상품·기간·주행거리를 바꾸면 월 납부금과 최저가 캐피탈이 바로 반영돼요.</p>
            </div>
          </div>

          {/* A2 personalize: 이해도 레벨별 용어설명(초급 펼침/중급 접힘/고급 숨김) */}
          <div style={{ padding: '0 var(--rt-pad)' }}>
            <RtTermDefs
              title="이 페이지 핵심 용어"
              items={[
                ['장기렌트', '회사가 차를 사서 빌려주는 방식. 보험·세금·정비가 월 납부금에 포함돼요.'],
                ['오토리스', '차를 빌리되 비용처리에 유리한 금융 상품(회사 명의·운용리스).'],
                ['할부(구매)', '내 명의로 차를 사고 매달 나눠 내는 방식. 끝나면 내 차.'],
                ['잔존가치', '계약 끝났을 때 차의 예상 가치. 높을수록 월 납부금이 낮아져요.'],
                ['보증금/선납', '미리 내면 월 납부금이 줄어드는 옵션.'],
              ]}
            />
          </div>

          <div className="rt-quote-group">
            <div className="rt-quote-label"><b>상품 유형</b><span>월납·소유 구조가 달라요</span></div>
            <div className="rt-pills">
              {RT_DETAIL_PRODUCTS.map((p) => (
                <button key={p.key} className={'rt-pill' + (p.key === product ? ' is-on' : '')} onClick={() => setProduct(p.key as ProductKey)}>
                  <b>{p.label}</b><span>{p.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rt-quote-group">
            <div className="rt-quote-label"><b>계약 기간</b><span>길수록 월 납부 ↓</span></div>
            <div className="rt-pills">
              {RT_DETAIL_TERMS.map((t) => (
                <button key={t.months} className={'rt-pill' + (t.months === months ? ' is-on' : '')} onClick={() => setMonths(t.months)}>
                  <b>{t.label}</b><span>{t.note}</span>
                </button>
              ))}
            </div>
          </div>

          {!isInstall && (
            <>
              <div className="rt-quote-group">
                <div className="rt-quote-label"><b>연간 주행거리</b><span>약정 기준</span></div>
                <div className="rt-pills">
                  {RT_DETAIL_MILEAGE.map((m) => (
                    <button key={m.km} className={'rt-pill' + (m.km === km ? ' is-on' : '')} onClick={() => setKm(m.km)}>
                      <b>{m.label}</b><span>{m.note}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rt-quote-group">
                <div className="rt-quote-label"><b>보증금 · 선납</b><span>낼수록 월 납부 ↓</span></div>
                <div className="rt-pills">
                  {RT_DETAIL_DEPOSIT.map((d) => (
                    <button key={d.key} className={'rt-pill' + (d.key === dep ? ' is-on' : '')} onClick={() => setDep(d.key)}>
                      <b>{d.label}</b><span>{d.note}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {isInstall && (
            <p className="rt-sec-sub" style={{ margin: '-2px 0 4px' }}>할부는 주행거리 제한·보증금이 없어요. 월 할부료는 차량가·금리·기간으로 계산돼요.</p>
          )}

          <div className="rt-estimate">
            <p className="rt-estimate-k">{prodMeta.label} · {car.trims[trimIdx].name}</p>
            <div className="rt-estimate-amount">
              <span className="rt-estimate-num" style={{ color: ACCENT }}>{monthly}</span>
              <span className="rt-estimate-unit">만원<em>~ / 월</em></span>
            </div>
            {quote.lowest && (
              <div className="rt-estimate-low">
                <span className="rt-estimate-lowcap">{quote.lowest.cap.name}</span>
                <span className="rt-estimate-lowtxt">최저가 · 제휴 캐피탈 {quote.count}곳 중</span>
              </div>
            )}
            <div className="rt-estimate-cond">
              <span className="rt-estimate-chip">{term.label}</span>
              {!isInstall && <span className="rt-estimate-chip">연 {mile.label}</span>}
              {!isInstall && <span className="rt-estimate-chip">{depo.label}</span>}
              {isInstall && <span className="rt-estimate-chip">선납 0</span>}
            </div>
            <p className="rt-estimate-note">{isInstall
              ? '차량가·금리·기간 기준 예상 할부금이에요. 취득세·등록비 등은 별도이며, 정확한 금액은 상담 시 안내해 드려요.'
              : '보험·자동차세·정기 점검 포함 · 제휴 캐피탈 비교 기준의 예상 금액이에요. 실제 금액은 신용 조건에 따라 달라질 수 있어요.'}</p>
          </div>

          <div style={{ marginTop: 16 }}>
            <Included />
          </div>
        </section>

        {/* 비슷한 차종 */}
        <section className="rt-sec">
          <div className="rt-sec-hd">
            <div><h2 className="rt-sec-title">비슷한 차종</h2></div>
            <Link className="rt-sec-link" href="/popular-estimates-preview" data-guest="allow">전체 보기</Link>
          </div>
          <div className="rt-similar-rail">
            {similar.map((c) => (
              <Link className="rt-scard" key={c.id} href={`/cars-detail-preview/${c.id}`} data-guest="allow" style={{ '--hue': c.hue } as React.CSSProperties}>
                <div className="rt-scard-media">
                  {c.imageKey && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={carImageUrl(c.imageKey)}
                      alt={c.model}
                      loading="lazy"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '6%' }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
                <div className="rt-scard-body">
                  <div className="rt-scard-brand">{c.brand}</div>
                  <div className="rt-scard-name">{c.model}</div>
                  <div className="rt-scard-price">
                    <em>월</em><b>{c.from}</b><span>만원~</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 관련 콘텐츠 */}
        {related.length > 0 && (
          <section className="rt-sec">
            <div className="rt-sec-hd">
              <div>
                <h2 className="rt-sec-title">관련 콘텐츠</h2>
                <p className="rt-sec-sub">{car.model}, 계약 전에 알아두면 좋은 정보예요.</p>
              </div>
              <Link className="rt-sec-link" href="/info-preview" data-guest="allow">전체 보기</Link>
            </div>
            <div className="rt-similar-rail">
              {related.map((p, i) => (
                <RtRelatedCard key={p.id ?? i} p={p} fallbackHue={car.hue} />
              ))}
            </div>
          </section>
        )}

        {/* 이용 절차 */}
        <section className="rt-sec">
          <div className="rt-sec-hd">
            <div>
              <h2 className="rt-sec-title">이용 절차</h2>
              <p className="rt-sec-sub">신청부터 출고까지 평균 3~5일이면 충분해요.</p>
            </div>
          </div>
          <div className="rt-steps">
            {RT_STEPS.map((s) => (
              <div className="rt-step" key={s.n}>
                <div className="rt-step-rail">
                  <div className="rt-step-ic"><StepIcon name={s.icon} /></div>
                  <div className="rt-step-line"></div>
                </div>
                <div className="rt-step-body">
                  <div className="rt-step-n">STEP {s.n}</div>
                  <h3 className="rt-step-t">{s.title}</h3>
                  <p className="rt-step-d">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="rt-sec">
          <div className="rt-sec-hd">
            <div><h2 className="rt-sec-title">자주 묻는 질문</h2></div>
          </div>
          <div className="rt-faqs">
            {RT_DETAIL_FAQS.map((f, i) => <DFaq key={i} q={f.q} a={f.a} />)}
          </div>
        </section>

        {/* 하단 고정 CTA */}
        <div className="rt-bar">
          <div className="rt-bar-inner">
            <div className="rt-bar-row">
              <div className="rt-bar-price">
                <span className="rt-bar-price-k">예상 월 렌트료</span>
                <span className="rt-bar-price-v"><b>{monthly}</b><em>만원</em></span>
              </div>
              <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => setSheet(true)}>
                이 조건으로 상담 신청
              </Button>
            </div>
          </div>
        </div>
      </div>

      <RtConsultSheet open={sheet} onClose={() => setSheet(false)} car={car} priceLabel={priceLabel} accent={ACCENT} />
      {toast && (
        <div className="rt-vcmp-toast is-show">
          <span>{toast.msg}</span>
          {toast.link && <Link href="/popular-estimates-preview" data-guest="allow">비교하기 →</Link>}
        </div>
      )}
    </div>
  );
}
