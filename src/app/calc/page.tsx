'use client';
// /calc — 비용·세금 계산기 (자차 vs 장기렌트 5년 시뮬레이션 · 취득/자동차세)
// 원본 프로토타입: _design_ref/calc-app.jsx (한 화면 2탭: 비용 시뮬레이션 / 세금 계산기)
// 이식 메모:
//  - window 전역 → 모듈 import: window.RT_CATALOG → @/lib/rentailor/catalog 의 RT_CATALOG(81종),
//    window.CadamDS.Button → @/components/ui/Button, RtTopNav/RtConsultSheet → @/components/rentailor.
//  - 비용 계산 로직(ownCost/rentCost/acqTax/autoTaxYear/ccResidual/ccMsrp)은 calc 전용이라
//    catalog.ts 에 없으므로 프로토타입 공식 그대로 co-located 이식(숫자 동일 보장).
//  - personalize(범위 밖): CTerm → 평문 span, CalcDefs(window.RtTermDefs) → 제거(폴백 null),
//    ctypeToOwner(window.rtCustomerType) → 기본 'ind', 프로필 동기화 useEffect → 제거.
//  - 제외: tweaks 패널 · 디바이스 토글(useTweaks/useRtDevice/RtControlBar/TweaksPanel).
import React, { useState, useMemo, useEffect } from 'react';
import { RtTopNav } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { RtTermDefs } from '@/lib/rentailor/personalize';
import { Button } from '@/components/ui/Button';
import { RT_CATALOG, type Car } from '@/lib/rentailor/catalog';
import './calc.css';

// ── 공통 계산 상수 ──────────────────────────────────────────
const CC_RESID = [1.0, 0.82, 0.7, 0.59, 0.5, 0.42, 0.36, 0.31, 0.27];
function ccResidual(a: number): number {
  if (a < 0) a = 0;
  if (a < CC_RESID.length) return CC_RESID[a];
  return Math.max(0.16, CC_RESID[CC_RESID.length - 1] - 0.045 * (a - CC_RESID.length + 1));
}
const CC_SEG_CC: Record<string, number> = { sedan: 1600, suv: 2000, premium: 2500 }; // 차급별 대표 배기량
const ccCarCC = (c: Car): number => (c.fuel === 'ev' ? 0 : CC_SEG_CC[c.seg] || 1600);
const round10 = (x: number): number => Math.round(x / 10) * 10;

// 취득세 (승용 7% · 전기차 최대 140만 감면)
function acqTax(priceWon: number, fuel: string): number {
  const base = Math.round(priceWon * 0.07);
  return fuel === 'ev' ? Math.max(0, base - 1400000) : base;
}
// 연 자동차세 (cc 기준 + 지방교육세 30% 포함 · 전기차 정액 13만)
function autoTaxYear(cc: number, fuel: string): number {
  if (fuel === 'ev') return 130000;
  const per = cc <= 1000 ? 80 : cc <= 1600 ? 140 : 200;
  return Math.round(cc * per * 1.3);
}

// 원 → 만원/억 문자열
function manStr(w: number): string {
  const m = Math.round(w / 10000);
  if (m >= 10000) return (m / 10000).toFixed(m % 10000 === 0 ? 0 : 1) + '억';
  return m.toLocaleString() + '만원';
}
const wonStr = (w: number): string => Math.round(w).toLocaleString() + '원';

// 차량 추정 신차가 (사이트 표시 최저 월렌트료 기반)
const ccMsrp = (c: Car): number => round10(c.from * 45) * 10000;

interface OwnCost {
  msrp: number; acq: number; cc: number; taxY: number; taxTotal: number;
  insurY: number; insurTotal: number; maintY: number; maintTotal: number;
  depLoss: number; resale: number; upfront: number; total: number; monthly: number;
}
// ── 보유 비용 (자차) ────────────────────────────────────────
function ownCost(c: Car, years: number): OwnCost {
  const msrp = ccMsrp(c);
  const acq = acqTax(msrp, c.fuel);
  const cc = ccCarCC(c);
  const taxY = autoTaxYear(cc, c.fuel);
  const insurY = msrp < 30000000 ? 900000 : msrp < 50000000 ? 1300000 : 1750000;
  const maintY = c.fuel === 'ev' ? 300000 : 520000;
  const depLoss = Math.round(msrp * (1 - ccResidual(years)));
  const total = depLoss + acq + taxY * years + insurY * years + maintY * years;
  return {
    msrp, acq, cc, taxY, taxTotal: taxY * years, insurY, insurTotal: insurY * years,
    maintY, maintTotal: maintY * years, depLoss, resale: msrp - depLoss,
    upfront: msrp + acq, total, monthly: Math.round(total / (years * 12)),
  };
}
function rentCost(c: Car, years: number) {
  const base = c.from * 10000;
  const months = years * 12;
  return { base, months, total: base * months, monthly: base, upfront: 0 };
}

const CC_TERMS = [{ y: 3, label: '3년' }, { y: 4, label: '4년' }, { y: 5, label: '5년' }];
const CC_OWNER = [
  { v: 'ind', label: '개인', rate: 0 },
  { v: 'biz', label: '개인사업자', rate: 0.24 },
  { v: 'corp', label: '법인', rate: 0.2 },
];
const ACCENT_DOT = '#C9A84C';

// ── 체크/엑스 아이콘 ────────────────────────────────────────
const IcCk = () => (
  <svg className="ck" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
);
const IcXk = () => (
  <svg className="xk" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
);

// ════════════════ 비용 시뮬레이션 탭 ════════════════
function CostTab({ car, years, owner, accent }: { car: Car; years: number; owner: string; accent: string }) {
  const own = useMemo(() => ownCost(car, years), [car, years]);
  const rent = useMemo(() => rentCost(car, years), [car, years]);
  const ownerObj = CC_OWNER.find((o) => o.v === owner) || CC_OWNER[0];
  const taxSave = Math.round(rent.total * ownerObj.rate);
  const rentNet = rent.total - taxSave;
  const cheaper = rentNet < own.total;
  const diff = Math.abs(own.total - rentNet);

  const brk = [
    { k: '취득세', sub: '신차가 7% (등록 시 1회)', v: own.acq },
    { k: '자동차세', sub: years + '년분 · 지방교육세 포함', v: own.taxTotal },
    { k: '자동차 보험', sub: '연 ' + manStr(own.insurY) + ' × ' + years + '년', v: own.insurTotal },
    { k: '정비·소모품', sub: '연 ' + manStr(own.maintY) + ' × ' + years + '년', v: own.maintTotal },
    { k: '감가 손실', sub: years + '년 후 잔존가치 ' + manStr(own.resale), v: own.depLoss },
  ];

  return (
    <>
      {/* 히어로 */}
      <div className="rt-cblock rt-fade-up" style={{ '--d': '0ms' } as React.CSSProperties}>
        <div className="rt-chero">
          <p className="rt-chero-k">{car.brand} {car.model.replace(/\s*\(.*\)/, '')} · 장기렌트 월 정액</p>
          <div className="rt-chero-big">
            <b>{car.from}</b><span>만원</span><em>/ 월</em>
          </div>
          <div className="rt-chero-chips">
            <span className="rt-chero-chip"><IcCk />초기 비용 0원</span>
            <span className="rt-chero-chip"><IcCk />보험·세금·정비 포함</span>
            <span className="rt-chero-chip"><IcCk />감가 리스크 0</span>
          </div>
          <p className="rt-chero-note">
            자차로 {years}년 보유 시 <b>초기 {manStr(own.upfront)}</b>의 목돈과 감가·보험·세금을 직접 부담해요.
            {cheaper
              ? <> 장기렌트는 {ownerObj.rate ? '비용처리까지 더하면 ' : ''}총 지출이 <b>{manStr(diff)} 더 적어요.</b></>
              : <> 장기렌트는 목돈·리스크 없이 월 정액으로 같은 차를 타요.</>}
          </p>
        </div>
      </div>

      {/* 자차 vs 렌트 비교 */}
      <div className="rt-cblock rt-fade-up" style={{ '--d': '70ms' } as React.CSSProperties}>
        <p className="rt-csec">자차 구매 vs 장기렌트 <span>· {years}년 기준</span></p>
        <div className="rt-cmp">
          <div className="rt-cmp-head">
            <div className="rt-cmp-hcell">구분</div>
            <div className="rt-cmp-hcell">자차 구매</div>
            <div className="rt-cmp-hcell rent">장기렌트</div>
          </div>
          <div className="rt-cmp-row hl">
            <div className="rt-cmp-cell k">초기 비용</div>
            <div className="rt-cmp-cell">{manStr(own.upfront)}</div>
            <div className="rt-cmp-cell rent">0원</div>
          </div>
          <div className="rt-cmp-row">
            <div className="rt-cmp-cell k">월 평균 부담</div>
            <div className="rt-cmp-cell">{manStr(own.monthly)}</div>
            <div className="rt-cmp-cell rent">{car.from}만원</div>
          </div>
          <div className="rt-cmp-row">
            <div className="rt-cmp-cell k">{years}년 총 지출</div>
            <div className="rt-cmp-cell">{manStr(own.total)}</div>
            <div className="rt-cmp-cell rent">{manStr(ownerObj.rate ? rentNet : rent.total)}</div>
          </div>
          <div className="rt-cmp-row">
            <div className="rt-cmp-cell k">보험·세금·정비</div>
            <div className="rt-cmp-cell muted">직접 부담</div>
            <div className="rt-cmp-cell rent"><IcCk />포함</div>
          </div>
          <div className="rt-cmp-row">
            <div className="rt-cmp-cell k">감가 리스크</div>
            <div className="rt-cmp-cell"><IcXk /><small>본인 부담</small></div>
            <div className="rt-cmp-cell rent"><IcCk />없음</div>
          </div>
          <div className="rt-cmp-row">
            <div className="rt-cmp-cell k">중도 교체·해지</div>
            <div className="rt-cmp-cell muted">중고 매각</div>
            <div className="rt-cmp-cell rent"><IcCk />유연</div>
          </div>
        </div>
      </div>

      {/* 사업자 절세 */}
      {ownerObj.rate > 0 && (
        <div className="rt-cblock rt-fade-up" style={{ '--d': '140ms' } as React.CSSProperties}>
          <div className="rt-csave">
            <span className="rt-csave-ic">
              <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            </span>
            <div>
              <div className="rt-csave-h">{ownerObj.label} 비용처리 절세 <b>약 {manStr(taxSave)}</b></div>
              <div className="rt-csave-d">렌트료는 전액 손비처리돼요. {years}년 렌트료 {manStr(rent.total)} 기준,
                적용세율 {Math.round(ownerObj.rate * 100)}% 가정 시 실부담이 <b style={{ color: accent }}>{manStr(rentNet)}</b>까지 낮아져요.</div>
            </div>
          </div>
        </div>
      )}

      {/* 자차 비용 구성 */}
      <div className="rt-cblock rt-fade-up" style={{ '--d': '200ms' } as React.CSSProperties}>
        <p className="rt-csec">자차 {years}년 비용 구성 <span>· 추정</span></p>
        <div className="rt-brk">
          {brk.map((r, i) => (
            <div className="rt-brk-row" key={i}>
              <span className="rt-brk-l"><span className="rt-brk-dot"></span>{r.k}<small>{r.sub}</small></span>
              <span className="rt-brk-v">{manStr(r.v)}</span>
            </div>
          ))}
          <div className="rt-brk-row total">
            <span className="rt-brk-l">{years}년 총 보유비용</span>
            <span className="rt-brk-v">{manStr(own.total)}</span>
          </div>
        </div>
      </div>

      <p className="rt-fnote">※ 엔카·KB 시세 통계와 공시 세율 기준 추정값으로 실제와 다를 수 있어요. 자차 비용은 일시불 기준(할부 시 이자 별도),
        유류비는 양측 동일해 제외했어요. 렌트료는 차종 최저가 기준이며 조건에 따라 달라져요.</p>
    </>
  );
}

// ════════════════ 세금 계산기 탭 ════════════════
function TaxTab({
  price, cc, fuel, setPrice, setCc, setFuel,
}: {
  price: string; cc: string; fuel: string;
  setPrice: (v: string) => void; setCc: (v: string) => void; setFuel: (v: string) => void;
}) {
  const priceWon = (Number(price) || 0) * 10000;
  const acq = acqTax(priceWon, fuel);
  const taxY = autoTaxYear(fuel === 'ev' ? 0 : Number(cc) || 0, fuel);
  const bond = fuel === 'ev' ? 0 : Math.round(priceWon * 0.005); // 도시철도채권 할인부담 추정
  const regTotal = acq + bond;

  const FUELS = [{ v: 'gas', label: '일반(내연)' }, { v: 'ev', label: '전기·수소' }];

  const brk = [
    { k: '취득세', sub: fuel === 'ev' ? '7% − 전기차 감면(최대 140만)' : '과세표준 7%', v: acq, dot: ACCENT_DOT },
    { k: '도시철도채권', sub: '매입 후 할인매도 부담(추정)', v: bond, dot: '#9CA3AF' },
  ];

  return (
    <>
      <div className="rt-fcard" style={{ marginTop: 16 }}>
        <p className="rt-fcard-t">차량 정보</p>
        <div className="rt-cfields">
          <div className="rt-ffield">
            <span className="rt-flabel">차량 가격</span>
            <div className="rt-cinput-wrap">
              <input className="rt-cinput" inputMode="numeric" value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))} />
              <span className="rt-cinput-suffix">만원</span>
            </div>
          </div>
          <div className="rt-ffield">
            <span className="rt-flabel">배기량 <em>{fuel === 'ev' ? '해당 없음' : ''}</em></span>
            <div className="rt-cinput-wrap">
              <input className="rt-cinput" inputMode="numeric" value={fuel === 'ev' ? '' : cc}
                disabled={fuel === 'ev'} placeholder="—"
                onChange={(e) => setCc(e.target.value.replace(/[^\d]/g, ''))} />
              <span className="rt-cinput-suffix">cc</span>
            </div>
          </div>
        </div>
        <div className="rt-ffield" style={{ marginTop: 13 }}>
          <span className="rt-flabel">차량 구분</span>
          <div className="rt-fpills" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: 2 }}>
            {FUELS.map((f) => (
              <button key={f.v} className={'rt-fpill' + (fuel === f.v ? ' is-on' : '')}
                style={{ textAlign: 'center' }} onClick={() => setFuel(f.v)}>{f.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 취득세 결과 */}
      <div className="rt-cblock rt-fade-up" style={{ '--d': '0ms' } as React.CSSProperties} key={acq + '-' + taxY}>
        <div className="rt-taxhero">
          <p className="rt-taxhero-k">차량 구입 시 취득세</p>
          <div className="rt-taxhero-big"><b>{acq.toLocaleString()}</b><span>원</span></div>
          <p className="rt-taxhero-sub">차량가 <b>{manStr(priceWon)}</b>의 7%
            {fuel === 'ev' ? <> 에서 전기차 감면 적용 후 금액이에요.</> : <>예요. 등록 시 1회 납부해요.</>}
          </p>
        </div>
      </div>

      {/* 등록 세금 내역 */}
      <div className="rt-cblock rt-fade-up" style={{ '--d': '70ms' } as React.CSSProperties}>
        <p className="rt-csec">등록 시 부담 <span>· 추정</span></p>
        <div className="rt-brk">
          {brk.map((r, i) => (
            <div className="rt-brk-row" key={i}>
              <span className="rt-brk-l"><span className="rt-brk-dot" style={{ background: r.dot }}></span>{r.k}<small>{r.sub}</small></span>
              <span className="rt-brk-v">{wonStr(r.v)}</span>
            </div>
          ))}
          <div className="rt-brk-row total">
            <span className="rt-brk-l">등록 시 합계</span>
            <span className="rt-brk-v">{wonStr(regTotal)}</span>
          </div>
        </div>
      </div>

      {/* 자동차세 */}
      <div className="rt-cblock rt-fade-up" style={{ '--d': '140ms' } as React.CSSProperties}>
        <p className="rt-csec">매년 내는 자동차세 <span>· 지방교육세 포함</span></p>
        <div className="rt-brk">
          <div className="rt-brk-row">
            <span className="rt-brk-l"><span className="rt-brk-dot"></span>연 자동차세
              <small>{fuel === 'ev' ? '전기차 정액' : (cc || 0) + 'cc 기준'}</small></span>
            <span className="rt-brk-v">{wonStr(taxY)}</span>
          </div>
          <div className="rt-brk-row total">
            <span className="rt-brk-l">5년 누적 자동차세</span>
            <span className="rt-brk-v">{wonStr(taxY * 5)}</span>
          </div>
        </div>
      </div>

      <p className="rt-fnote">※ 비영업용 승용 기준. 자동차세는 cc당 80원(~1,000cc)·140원(~1,600cc)·200원(1,600cc~)에 지방교육세 30%를 더한 값이에요.
        전기·수소차는 13만원 정액. 취득세 과세표준·채권 매입률은 지역·차종별로 달라질 수 있어요.</p>
    </>
  );
}

// ════════════════ 페이지 ════════════════
function CalcPage({ accent }: { accent: string }) {
  const cat = RT_CATALOG;
  const brands = Array.from(new Set(cat.map((c) => c.brand)));

  const [tab, setTab] = useState<'cost' | 'tax'>('cost');
  const [brand, setBrand] = useState(() => (cat.find((c) => c.brand === '현대') ? '현대' : cat[0].brand));
  const [model, setModel] = useState(() => {
    const m = cat.find((c) => c.id === 'grandeur') || cat.find((c) => c.brand === '현대') || cat[0];
    return m.id;
  });
  const [years, setYears] = useState(5);
  const [owner, setOwner] = useState('ind'); // personalize 범위 밖 → 기본 개인
  const [sheet, setSheet] = useState(false);
  const [locked, setLocked] = useState(false);

  // 세금 탭 입력
  const [price, setPrice] = useState('3850');
  const [cc, setCc] = useState('2500');
  const [fuel, setFuel] = useState('gas');

  const models = cat.filter((c) => c.brand === brand);
  const car = cat.find((c) => c.id === model) || models[0] || cat[0];

  useEffect(() => {
    setLocked(false);
    const t = setTimeout(() => setLocked(true), 800);
    return () => clearTimeout(t);
  }, [tab, model, years, owner]);

  return (
    <div className="rt-page" data-page="calc" id="top">
      <div className={'rt-scroll' + (locked ? ' rt-anim-lock' : '')}>
        <RtTopNav title="비용·세금 계산기" backHref="/info" />

        <div className="rt-fhead">
          <p className="rt-feyebrow">비용·세금 계산기</p>
          <h1 className="rt-ftitle">사기 전에, 진짜 비용을 계산해 보세요</h1>
          <p className="rt-fsub">자차 구매와 장기렌트의 총 비용을 비교하고, 취득세·자동차세를 미리 확인해요.</p>
        </div>

        {/* A2 personalize: 이해도 레벨별 용어설명(초급 펼침/중급 접힘/고급 숨김) */}
        <RtTermDefs
          title="비용·세금 용어"
          items={[
            ['취득세', '차를 등록할 때 한 번 내는 세금(보통 차값의 7%).'],
            ['자동차세', '차를 가진 동안 매년 내는 세금. 배기량 기준.'],
            ['감가', '시간이 지나며 차값이 떨어지는 것. 구매의 숨은 비용.'],
            ['장기렌트', '렌트료에 보험·세금·정비가 포함돼 별도 세금 부담이 없어요.'],
          ]}
        />

        <div className="rt-ctab">
          <button className={'rt-ctab-btn' + (tab === 'cost' ? ' is-on' : '')} onClick={() => setTab('cost')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>
            비용 시뮬레이션
          </button>
          <button className={'rt-ctab-btn' + (tab === 'tax' ? ' is-on' : '')} onClick={() => setTab('tax')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7h6M9 12h6M9 17h4" /><rect x="4" y="3" width="16" height="18" rx="2" /></svg>
            세금 계산기
          </button>
        </div>

        {tab === 'cost' ? (
          <>
            <div className="rt-fcard" style={{ marginTop: 16 }}>
              <p className="rt-fcard-t">차량 선택</p>
              <div className="rt-cfields">
                <div className="rt-ffield">
                  <span className="rt-flabel">브랜드</span>
                  <select className="rt-fselect" value={brand}
                    onChange={(e) => { setBrand(e.target.value); const m = cat.find((c) => c.brand === e.target.value); setModel(m ? m.id : ''); }}>
                    {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="rt-ffield">
                  <span className="rt-flabel">모델</span>
                  <select className="rt-fselect" value={model} onChange={(e) => setModel(e.target.value)}>
                    {models.map((m) => <option key={m.id} value={m.id}>{m.model.replace(/\s*\(.*\)/, '')}</option>)}
                  </select>
                </div>
              </div>
              <div className="rt-ffield" style={{ marginTop: 14 }}>
                <span className="rt-flabel">보유 기간</span>
                <div className="rt-fpill-3" style={{ marginTop: 2 }}>
                  {CC_TERMS.map((t) => (
                    <button key={t.y} className={'rt-fpill' + (years === t.y ? ' is-on' : '')}
                      onClick={() => setYears(t.y)}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div className="rt-ffield" style={{ marginTop: 14 }}>
                <span className="rt-flabel">이용 주체 <em>비용처리 반영</em></span>
                <div className="rt-fpills" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginTop: 2 }}>
                  {CC_OWNER.map((o) => (
                    <button key={o.v} className={'rt-fpill' + (owner === o.v ? ' is-on' : '')}
                      style={{ textAlign: 'center' }} onClick={() => setOwner(o.v)}>{o.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <CostTab car={car} years={years} owner={owner} accent={accent} />
          </>
        ) : (
          <TaxTab price={price} cc={cc} fuel={fuel} setPrice={setPrice} setCc={setCc} setFuel={setFuel} />
        )}

        <div className="rt-bar" style={{ '--rt-accent': accent } as React.CSSProperties}>
          <div className="rt-bar-inner">
            <div className="rt-bar-row">
              <div className="rt-bar-price">
                <span className="rt-bar-price-k">{tab === 'cost' ? car.brand + ' 월 렌트' : '예상 취득세'}</span>
                <span className="rt-bar-price-v">
                  <b>{tab === 'cost' ? car.from : Math.round(acqTax((Number(price) || 0) * 10000, fuel) / 10000)}</b>
                  <em>{tab === 'cost' ? '만원~' : '만원'}</em>
                </span>
              </div>
              <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => setSheet(true)}>
                {tab === 'cost' ? '이 차로 견적 상담받기' : '맞춤 견적 상담받기'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <RtConsultSheet open={sheet} onClose={() => setSheet(false)} car={tab === 'cost' ? car : null}
        priceLabel={car.from + '만원~'} accent={accent} />
    </div>
  );
}

export default function CalcPageRoute() {
  const accent = '#C9A84C';
  return (
    <div className="rt-root" data-rt="calc" style={{ '--rt-accent': accent, '--rt-radius': '20px' } as React.CSSProperties}>
      <CalcPage accent={accent} />
    </div>
  );
}
