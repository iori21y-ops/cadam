'use client';

// 내차 시세 조회 — 운영 라우트 /sell
// 원본: _design_ref/sell-app.jsx (window 전역 → 모듈 import).
//   폼(브랜드·모델·연식·주행·상태) → 결과(예상 매입가·시세분포·채널비교·전환 인수가).
// 이식/적응:
//   - window.RT_CATALOG → @/lib/rentailor/catalog, 계산식 → ./data
//   - window.CadamDS.Button → @/components/ui/Button
//   - TweaksPanel/useRtDevice/RtControlBar/image-slot 제외
//   - 백 링크 '정보 가이드.html' → '/info'
//   - querySelector('.rt-scroll') 스크롤 → scrollRef 로 대체(동작 동일)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RtTopNav } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { RT_CATALOG, type Car } from '@/lib/rentailor/catalog';
import { SL_YEARS, SL_MILE, SL_COND, sellCalc, won } from './data';
import './sell.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;
type Step = 'form' | 'result';

function IcCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function SellResult({ car, year, mile, cond }: { car: Car; year: number; mile: string; cond: string }) {
  const d = useMemo(() => sellCalc(car, year, mile, cond), [car, year, mile, cond]);
  const mileObj = SL_MILE.find((x) => x.v === mile) || SL_MILE[1];
  const condObj = SL_COND.find((x) => x.v === cond) || SL_COND[0];
  // 분포 막대 위치: 모델 시세 최저~최고 범위 안에서 내 차(market) 위치(%)
  const span = Math.max(1, d.distHigh - d.distLow);
  const pos = Math.min(88, Math.max(12, ((d.market - d.distLow) / span) * 100));

  const bars = [
    { name: '개인거래 직거래', value: d.market, tag: '시세 최고', plain: true, best: false },
    { name: '일반 딜러 매입', value: d.dealer, best: false },
    { name: 'Rentailor 전환 인수', value: d.rentailor, best: true, tag: '추천' },
  ];
  const barMax = Math.max(...bars.map((b) => b.value));
  const cleanModel = car.model.replace(/\s*\(.*\)/, '');

  return (
    <div className="rt-qresult">
      <div className="rt-fade-up" style={cssVar({ '--d': '0ms' })}>
        <p className="rt-qresult-kicker">
          {year}년식 · {car.brand} · {mileObj.label} · {condObj.label}
        </p>
        <h2 className="rt-qresult-title">{cleanModel} 예상 시세</h2>
      </div>

      {/* 히어로 */}
      <div className="rt-dep-hero rt-fade-up" style={cssVar({ '--d': '60ms', marginTop: 18 })}>
        <p className="rt-dep-hero-k">예상 딜러 매입가</p>
        <div className="rt-dep-now">
          <b>{won(d.dealer)}</b>
          <em>신차가 {won(d.msrp)} 대비 −{d.depPct}%</em>
        </div>
        <div className="rt-sell-range">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4" />
          </svg>
          매입 범위 <b>{won(d.buyLow)} ~ {won(d.buyHigh)}</b>
        </div>
      </div>

      {/* 시세 분포 */}
      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '130ms' })}>
        <h3 className="rt-qblock-t">{cleanModel} {year}년식 시세 분포</h3>
        <div className="rt-sell-distwrap">
          <div className="rt-sell-dist-cap" style={{ left: pos + '%' }}>내 차 시세 {won(d.market)}</div>
          <div className="rt-sell-dist">
            <div className="rt-sell-dist-band" style={{ left: '22%', right: '10%' }}></div>
            <div className="rt-sell-dist-mark" style={{ left: pos + '%' }}></div>
          </div>
        </div>
        <div className="rt-sell-dist-lbl">
          <span>최저 {won(d.distLow)}</span>
          <span>최고 {won(d.distHigh)}</span>
        </div>
      </div>

      {/* 채널별 비교 */}
      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '200ms' })}>
        <h3 className="rt-qblock-t">어디에 파는 게 유리할까요?</h3>
        <div className="rt-paybars">
          {bars.map((b, i) => (
            <div className={'rt-paybar' + (b.best ? ' best' : '')} key={i}>
              <div className="rt-paybar-top">
                <span className="rt-paybar-name">
                  {b.name}
                  {b.tag && <span className={'rt-paybar-tag' + (b.plain ? ' plain' : '')}>{b.tag}</span>}
                </span>
                <span className="rt-paybar-val">{won(b.value)}</span>
              </div>
              <div className="rt-paybar-track">
                <div className="rt-paybar-fill" style={{ width: Math.round((b.value / barMax) * 100) + '%' }}></div>
              </div>
            </div>
          ))}
        </div>
        <p className="rt-fnote" style={{ padding: '12px 0 0' }}>
          ※ 개인 직거래는 시세가 가장 높지만 시간·안전·이전등록을 직접 챙겨야 해요. Rentailor 전환 인수는 딜러보다 높은
          값에 번거로움 없이 바로 넘길 수 있어요. 엔카·KB 차차차 시세 통계 기반 추정값이에요.
        </p>
      </div>

      {/* 전환 인수가 */}
      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '270ms' })}>
        <div className="rt-sell-offer">
          <div className="rt-sell-offer-top">
            <span className="rt-sell-offer-k">
              Rentailor 전환 인수가<em>장기렌트로 갈아탈 때</em>
            </span>
            <span className="rt-sell-offer-v">
              <b>{won(d.rentailor)}</b>
              <span className="rt-sell-offer-plus">딜러 대비 +{won(d.bonus)}</span>
            </span>
          </div>
          <p className="rt-sell-offer-d">
            지금 차를 넘기고 신차 장기렌트로 갈아타면 잔존가치를 <b>딜러 매입가보다 높게</b> 인정받아요. 감가가 더
            진행되기 전인 지금이 가장 유리해요 — 1년 뒤엔 약 <b>{won(d.drop1)}</b> 더 떨어질 것으로 예상돼요.
          </p>
        </div>
        <div className="rt-sell-tags">
          <span className="rt-sell-tag"><IcCheck />무료 출장 탁송</span>
          <span className="rt-sell-tag"><IcCheck />당일 시세 확정</span>
          <span className="rt-sell-tag"><IcCheck />이전 등록 대행</span>
        </div>
      </div>
    </div>
  );
}

export default function SellPage() {
  const brands = useMemo(() => Array.from(new Set(RT_CATALOG.map((c) => c.brand))), []);

  const [step, setStep] = useState<Step>('form');
  const [brand, setBrand] = useState('현대');
  const [model, setModel] = useState('grandeur');
  const [year, setYear] = useState(2022);
  const [mile, setMile] = useState('b');
  const [cond, setCond] = useState('clean');
  const [sheet, setSheet] = useState(false);
  const [locked, setLocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocked(false);
    const t = setTimeout(() => setLocked(true), 900);
    return () => clearTimeout(t);
  }, [step]);

  const models = RT_CATALOG.filter((c) => c.brand === brand);
  const car = RT_CATALOG.find((c) => c.id === model) || models[0] || RT_CATALOG[0];
  const ready = Boolean(car && year);
  const go = (s: Step) => {
    setStep(s);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div data-rt="sell" className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-page="sell" id="top">
        <div className={'rt-scroll' + (locked ? ' rt-anim-lock' : '')} ref={scrollRef}>
          <RtTopNav title="내차 시세 조회" backHref="/info" />

          {step === 'form' ? (
            <>
              <div className="rt-fhead">
                <p className="rt-feyebrow">내차 시세</p>
                <h1 className="rt-ftitle">내 차, 지금 팔면 얼마일까요?</h1>
                <p className="rt-fsub">
                  차량 정보를 입력하면 예상 매입 시세와 시세 분포, 갈아타기 전환 인수가를 알려드려요.
                </p>
              </div>

              <div className="rt-fcard">
                <p className="rt-fcard-t">차량 정보</p>
                <div className="rt-ffield">
                  <span className="rt-flabel">브랜드</span>
                  <select
                    className="rt-fselect"
                    value={brand}
                    onChange={(e) => {
                      setBrand(e.target.value);
                      const m = RT_CATALOG.find((c) => c.brand === e.target.value);
                      setModel(m ? m.id : '');
                    }}
                  >
                    {brands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rt-ffield">
                  <span className="rt-flabel">모델</span>
                  <select className="rt-fselect" value={model} onChange={(e) => setModel(e.target.value)}>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.model.replace(/\s*\(.*\)/, '')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rt-ffield">
                  <span className="rt-flabel">연식</span>
                  <select className="rt-fselect" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                    {SL_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}년식
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rt-fcard">
                <p className="rt-fcard-t">주행거리</p>
                <div className="rt-fpill-3" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
                  {SL_MILE.map((m) => (
                    <button key={m.v} className={'rt-fpill' + (mile === m.v ? ' is-on' : '')} onClick={() => setMile(m.v)}>
                      {m.label}
                      <span>{m.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rt-fcard">
                <p className="rt-fcard-t">차량 상태</p>
                <div className="rt-fpill-3">
                  {SL_COND.map((c) => (
                    <button key={c.v} className={'rt-fpill' + (cond === c.v ? ' is-on' : '')} onClick={() => setCond(c.v)}>
                      {c.label}
                      <span>{c.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="rt-fnote">* 차량번호 없이 시세 통계로 추정해요. 정확한 매입가는 무료 현장 점검에서 확정됩니다.</p>
            </>
          ) : (
            <SellResult car={car} year={year} mile={mile} cond={cond} />
          )}

          <div className="rt-bar" style={cssVar({ '--rt-accent': ACCENT })}>
            <div className="rt-bar-inner">
              {step === 'form' ? (
                <Button variant="primary" size="lg" fullWidth className="rt-gold" disabled={!ready} onClick={() => go('result')}>
                  시세 조회하기
                </Button>
              ) : (
                <div className="rt-bar-row">
                  <button className="rt-bar-call" onClick={() => go('form')} style={{ cursor: 'pointer', background: '#fff' }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                    다시
                  </button>
                  <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => setSheet(true)}>
                    팔고 갈아타기 상담
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <RtConsultSheet open={sheet} onClose={() => setSheet(false)} car={null} accent={ACCENT} />
    </div>
  );
}
