'use client';

// contract-care/page.tsx — 계약 케어 (계약기간 중·만기 고객 도움)
// 원본: _design_ref/contract-care.jsx (5개 도구 화면) + 진입 허브(D-day·체크리스트·도구메뉴)는 mypage-app.jsx ContractCareSections 발췌.
//   ① 중도상환(해지)수수료 ② 초과운행료 ③ 만기 인수가·잔존가치 ④ 캐피탈 연락·서류·사고 ⑤ 계약 정보 입력·수정(OCR)
//   * 모든 계산은 "가상 계산(예상)" — 정확값은 캐피탈/리스사 확인.
// 데이터: 계약 = MY_CONTRACTS 시드(회원/contract_vehicles 의존 → ★갭). 캐피탈 = CC_CAPITAL 시드(실연동: capital_directory 테이블).
// 회원 게이트 없음 — 시드 계약으로 UI 시연.
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RtTopNav, RtTabBar } from '@/components/rentailor/RtChrome';
import { ptBalance, ptComma as ptCommaFn, ptSetCtx } from '@/lib/rentailor/points';
import './contract-care.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

/* ════════ 계약 시드 (회원/contract_vehicles 의존 → ★갭) ════════ */
interface Contract {
  carId: string;
  status: string;
  state: 'active' | 'done';
  method: string;
  term: string;
  monthly: string;
  start: string;
  end: string;
  mileage: string;
  capital: string;
  capitalId: string;
  elapsed: number;
  total: number;
  deposit: number;
  annualKm: number;
  carPrice: number;
  residualPct: number;
  kmExcessRate: number;
  earlyTermPct: number;
  docs: string[];
}
const MY_CONTRACTS: Contract[] = [
  { carId: 'gv70', status: '계약 중', state: 'active', method: '운용리스(장기렌트)', term: '36개월', monthly: '92', start: '2023.08.01', end: '2026.07.31', mileage: '연 15,000km', capital: '하나캐피탈', capitalId: 'hana', elapsed: 34, total: 36, deposit: 0, annualKm: 15000, carPrice: 5800, residualPct: 42, kmExcessRate: 130, earlyTermPct: 30, docs: ['자동차 운용리스 계약서', '개인정보 수집·이용 동의서', '자동이체 동의서', '보험가입 증명서'] },
  { carId: 'sorento', status: '계약 중', state: 'active', method: '운용리스(장기렌트)', term: '48개월', monthly: '79', start: '2026.04.01', end: '2030.03.31', mileage: '연 20,000km', capital: '우리금융캐피탈', capitalId: 'woori', elapsed: 4, total: 48, deposit: 0, annualKm: 20000, carPrice: 4150, residualPct: 38, kmExcessRate: 110, earlyTermPct: 30, docs: ['자동차 운용리스 계약서', '개인정보 수집·이용 동의서', '자동이체 동의서', '보험가입 증명서'] },
  { carId: 'ioniq5', status: '계약 종료', state: 'done', method: '운용리스(장기렌트)', term: '36개월', monthly: '72', start: '2022.05.01', end: '2025.04.30', mileage: '연 15,000km', capital: '현대캐피탈', capitalId: 'hyundai', elapsed: 36, total: 36, deposit: 0, annualKm: 15000, carPrice: 5200, residualPct: 32, kmExcessRate: 100, earlyTermPct: 30, docs: ['자동차 운용리스 계약서', '만기 반납 확인서'] },
];

const CAR_NAME: Record<string, string> = { gv70: '제네시스 GV70', sorento: '기아 쏘렌토', ioniq5: '현대 아이오닉 5' };

/* ════════ 캐피탈/리스사 디렉토리 (실연동: capital_directory 테이블) ════════ */
interface CapitalIssue {
  k: string;
  how: string;
}
interface CapitalInfo {
  name: string;
  cs: string;
  hours: string;
  accident: string;
  accidentName: string;
  issues: CapitalIssue[];
  home: string;
}
const CC_CAPITAL: Record<string, CapitalInfo> = {
  woori: { name: '우리금융캐피탈', cs: '1544-7300', hours: '평일 09:00–18:00', accident: '1588-2729', accidentName: '삼성화재 사고접수(24시간)', issues: [{ k: '부채(채무)증명서', how: '고객센터 ARS 2번 또는 홈페이지 > 증명서 발급. 본인인증 후 즉시 발급' }, { k: '상환·납입 스케줄표', how: '고객센터 또는 모바일 앱 > 내 계약 > 납입내역에서 PDF 발급' }, { k: '원천징수영수증·세금계산서', how: '사업자 고객 홈페이지 > 증명서 발급(세금계산서는 매월 발행)' }, { k: '사업자 고객 필요서류', how: '사업자등록증·대표자 신분증·법인은 법인등기부등본·인감증명 지참' }], home: '#' },
  hyundai: { name: '현대캐피탈', cs: '1588-3450', hours: '평일 09:00–18:00', accident: '1588-5656', accidentName: '현대해상 사고접수(24시간)', issues: [{ k: '부채(채무)증명서', how: '현대캐피탈 앱 > 증명서 발급 또는 고객센터' }, { k: '상환·납입 스케줄표', how: '앱 > 내 상품 > 납입스케줄 PDF' }, { k: '원천징수영수증·세금계산서', how: '홈페이지 > 마이 > 증명서 발급' }, { k: '사업자 고객 필요서류', how: '사업자등록증·대표자 신분증(법인 추가서류 안내)' }], home: '#' },
  hana: { name: '하나캐피탈', cs: '1800-1110', hours: '평일 09:00–18:00', accident: '1566-3000', accidentName: 'DB손해보험 사고접수(24시간)', issues: [{ k: '부채(채무)증명서', how: '고객센터 또는 홈페이지 > 증명서 발급' }, { k: '상환·납입 스케줄표', how: '고객센터 요청 시 카톡·이메일 발송' }, { k: '원천징수영수증·세금계산서', how: '홈페이지 > 증명서 발급' }, { k: '사업자 고객 필요서류', how: '사업자등록증·대표자 신분증 지참' }], home: '#' },
  shinhan: { name: '신한카드(리스)', cs: '1544-7000', hours: '평일 09:00–18:00', accident: '1588-5588', accidentName: 'KB손해보험 사고접수(24시간)', issues: [{ k: '부채(채무)증명서', how: '신한카드 앱 > 리스 > 증명서 또는 고객센터' }, { k: '상환·납입 스케줄표', how: '앱 > 리스 계약 > 납입스케줄' }, { k: '원천징수영수증·세금계산서', how: '홈페이지 > 증명서 발급' }, { k: '사업자 고객 필요서류', how: '사업자등록증·대표자 신분증(법인 추가서류 안내)' }], home: '#' },
  kb: { name: 'KB캐피탈', cs: '1588-1990', hours: '평일 09:00–18:00', accident: '1544-0114', accidentName: '삼성화재 사고접수(24시간)', issues: [{ k: '부채(채무)증명서', how: 'KB캐피탈 홈페이지 > 증명서 발급 또는 고객센터' }, { k: '상환·납입 스케줄표', how: '고객센터 또는 앱 > 내 계약' }, { k: '원천징수영수증·세금계산서', how: '홈페이지 > 증명서 발급' }, { k: '사업자 고객 필요서류', how: '사업자등록증·대표자 신분증 지참' }], home: '#' },
};
const CC_CAPITAL_BY_NAME: Record<string, string> = Object.fromEntries(Object.entries(CC_CAPITAL).map(([id, v]) => [v.name, id]));
function ccCapital(c: Contract): CapitalInfo | null {
  return CC_CAPITAL[c.capitalId] || CC_CAPITAL[CC_CAPITAL_BY_NAME[c.capital]] || null;
}

/* ════════ 계약 중·만기 체크리스트 ════════ */
const CC_CHECK_DURING = [
  { t: '종합보험 갱신일 확인', d: '갱신 누락 시 사고 보장 공백이 생길 수 있어요' },
  { t: '정기 점검·소모품 교체', d: '엔진오일·타이어 등 정비 주기를 지켜 감가·고장 예방' },
  { t: '약정 주행거리 관리', d: '초과하면 만기에 초과운행료가 발생해요' },
  { t: '자동이체 잔액 확인', d: '연체 시 신용도·가산금에 영향' },
  { t: '주소·연락처 변경 신고', d: '과태료·통지 누락을 막아요' },
];
const CC_CHECK_MATURITY = [
  { t: '인수 · 반납 · 재계약 결정', d: '만기 1~2개월 전 결정하는 걸 권장해요' },
  { t: '미납·과태료·자동차세 정산', d: '정산 후 명의이전·반납이 가능해요' },
  { t: '초과운행료 예상 확인', d: '반납 전 약정 대비 주행거리를 점검하세요' },
  { t: '차량 상태 점검(반납 시)', d: '감가·손상 정산 기준을 미리 확인' },
  { t: '인수 시 인수가·명의이전 준비', d: '잔존가치 기준 인수 견적을 확인하세요' },
];

/* ════════ 계산 helper (대략적 가상계산 · 정확값은 캐피탈 확인) ════════ */
function ccDday(end: string): number | null {
  const m = String(end || '').match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (!m) return null;
  const today = new Date(2026, 5, 23); // 데모 기준일 (실연동 시 Date.now)
  const t = new Date(+m[1], +m[2] - 1, +m[3]);
  return Math.round((t.getTime() - today.getTime()) / 86400000);
}
function ccRemain(c: Contract): number {
  return Math.max(0, (+c.total || 0) - (+c.elapsed || 0));
}
function ccEarlyTerm(c: Contract, afterMonths: number, penaltyPct: number) {
  const remainAtPoint = Math.max(0, +c.total - +c.elapsed - afterMonths);
  const monthly = +c.monthly || 0;
  const remainSum = remainAtPoint * monthly;
  const fee = Math.round(remainSum * (penaltyPct / 100));
  return { remainAtPoint, monthly, remainSum, fee, penaltyPct };
}
function ccExcess(c: Contract, expectedTotalKm: number) {
  const contracted = Math.round((+c.annualKm || 0) * ((+c.total || 0) / 12));
  const over = Math.max(0, expectedTotalKm - contracted);
  const won = over * (+c.kmExcessRate || 0);
  return { contracted, over, rate: +c.kmExcessRate || 0, won, fee: won / 10000 };
}
function ccBuyout(c: Contract) {
  const price = +c.carPrice || 0;
  const buyout = Math.round((price * (+c.residualPct || 0)) / 100);
  return { price, residualPct: +c.residualPct || 0, buyout };
}
function ccResidualNow(c: Contract): number {
  const r = 100 - (100 - (+c.residualPct || 0)) * ((+c.elapsed || 0) / (+c.total || 1));
  return Math.round(r);
}
function ccComma(n: number): string {
  return (Math.round(n) || 0).toLocaleString('ko-KR');
}

/* ════════ 아이콘 ════════ */
function CcIcon({ name, size = 16 }: { name: string; size?: number }) {
  const p: Record<string, React.ReactNode> = {
    chev: <path d="M9 6l6 6-6 6" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v.01M11 12h1v4h1" />
      </>
    ),
    check: <path d="M5 12.5l4 4 10-10" />,
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
      </>
    ),
    doc: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    camera: (
      <>
        <path d="M14.5 4h-5L8 6H4v14h16V6h-4z" />
        <circle cx="12" cy="13" r="3.5" />
      </>
    ),
  };
  const sw = name === 'check' ? 3 : 1.9;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {p[name]}
    </svg>
  );
}
const RtCheck = () => <CcIcon name="check" size={12} />;

/* 공통: 가상계산 안내 */
function CcNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rt-cc-note">
      <CcIcon name="info" size={14} />
      <span>{children}</span>
    </p>
  );
}
function CcBig({ value, unit, tone }: { value: string; unit: string; tone?: string }) {
  return (
    <div className={'rt-cc-big' + (tone ? ' is-' + tone : '')}>
      <b>{value}</b>
      <span>{unit}</span>
    </div>
  );
}

/* 서브 화면 셸 */
function CcSub({ title, intro, desc, onBack, children }: { title: string; intro?: string; desc?: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <>
      <RtTopNav title={title} onBack={onBack} />
      {(intro || desc) && (
        <div className="rt-sub-intro">
          {intro && <h1 className="rt-sub-intro-t">{intro}</h1>}
          {desc && <p className="rt-sub-intro-d">{desc}</p>}
        </div>
      )}
      {children}
      <div style={{ height: 8 }} />
    </>
  );
}

/* 포인트 지원 CTA (잔액 있을 때) */
function PtSupportCta({ type, amountWon, label }: { type: 'earlyterm' | 'excess'; amountWon: number; label: string }) {
  const router = useRouter();
  const [bal, setBal] = useState(0);
  useEffect(() => setBal(ptBalance()), []);
  if (bal <= 0) return null;
  return (
    <button
      className="rt-pt-cta"
      style={{ marginTop: 14 }}
      type="button"
      onClick={() => {
        ptSetCtx({ type, amount: Math.round(amountWon), label });
        router.push('/points');
      }}
    >
      <span>
        <b>{ptCommaFn(bal)}P</b> 보유 · 포인트로 지원받기
      </span>
      <CcIcon name="chev" size={16} />
    </button>
  );
}

/* ════════ ① 중도상환(해지)수수료 ════════ */
function CCEarlyTerm({ c, onBack }: { c: Contract; onBack: () => void }) {
  const remainNow = ccRemain(c);
  const [after, setAfter] = useState(0);
  const [pen, setPen] = useState(c.earlyTermPct != null ? +c.earlyTermPct : 30);
  const r = ccEarlyTerm(c, after, pen);
  return (
    <CcSub title="중도상환 수수료" intro="중도상환(해지) 수수료" desc="지금 또는 원하는 시점에 해지하면 얼마일까요?" onBack={onBack}>
      <div className="rt-cc-tool">
        <div className="rt-cc-tool-cap">예상 위약금</div>
        <CcBig value={ccComma(r.fee)} unit="만원" tone="accent" />
        <div className="rt-cc-tool-sub">잔여 {r.remainAtPoint}개월 · 월 {r.monthly}만원 · 위약금율 {pen}%</div>
      </div>

      <div className="rt-dt-sect">
        <div className="rt-dt-sect-t">해지 시점</div>
        <div className="rt-cc-field">
          <div className="rt-cc-field-top"><span>지금부터</span><span className="rt-cc-field-v">{after}개월 뒤</span></div>
          <input className="rt-cc-range" type="range" min={0} max={remainNow} step={1} value={after} onChange={(e) => setAfter(+e.target.value)} />
          <div className="rt-cc-field-ends"><span>지금</span><span>만기({remainNow}개월 뒤)</span></div>
        </div>
        <div className="rt-cc-field">
          <div className="rt-cc-field-top"><span>위약금율(가정)</span><span className="rt-cc-field-v">{pen}%</span></div>
          <input className="rt-cc-range" type="range" min={10} max={50} step={5} value={pen} onChange={(e) => setPen(+e.target.value)} />
          <div className="rt-cc-field-ends"><span>10%</span><span>50%</span></div>
        </div>
      </div>

      <div className="rt-dt-sect">
        <div className="rt-dt-sect-t">계산 내역</div>
        <div className="rt-dl">
          <div className="rt-dl-row"><span className="rt-dl-k">잔여 렌트료 합계</span><span className="rt-dl-v">{ccComma(r.remainSum)}만원</span></div>
          <div className="rt-dl-row"><span className="rt-dl-k">위약금율 적용</span><span className="rt-dl-v">× {pen}%</span></div>
          <div className="rt-dl-row"><span className="rt-dl-k">예상 위약금</span><span className="rt-dl-v" style={{ color: 'var(--rt-accent,#B07A2E)' }}>{ccComma(r.fee)}만원</span></div>
        </div>
      </div>

      <PtSupportCta type="earlyterm" amountWon={r.fee * 10000} label="중도해지 수수료" />

      <CcNote>실제 중도해지 위약금은 캐피탈·상품·잔여기간에 따라 <b>규정손해금</b> 방식 등으로 다르게 산정됩니다. 정확한 금액은 <b>{c.capital} 고객센터</b>에서 확인하세요.</CcNote>
    </CcSub>
  );
}

/* ════════ ② 초과운행료 ════════ */
function CCExcess({ c, onBack }: { c: Contract; onBack: () => void }) {
  const base = ccExcess(c, 0);
  const paceDefault = Math.round((+c.annualKm || 15000) * ((+c.total || 1) / 12) * 1.15);
  const [expected, setExpected] = useState(paceDefault);
  const r = ccExcess(c, expected);
  const chips = [base.contracted, Math.round(base.contracted * 1.1), Math.round(base.contracted * 1.25)];
  return (
    <CcSub title="초과운행료" intro="초과운행료 가상계산" desc="만기까지 예상 주행거리로 초과분을 미리 계산해요" onBack={onBack}>
      <div className="rt-cc-tool">
        <div className="rt-cc-tool-cap">예상 초과운행료</div>
        <CcBig value={ccComma(r.fee)} unit="만원" tone={r.over > 0 ? 'danger' : 'ok'} />
        <div className="rt-cc-tool-sub">{r.over > 0 ? '초과 ' + ccComma(r.over) + 'km · km당 ' + ccComma(r.rate) + '원' : '약정 이내 · 추가요금 없음'}</div>
      </div>

      <div className="rt-dt-sect">
        <div className="rt-dt-sect-t">만기까지 예상 총주행거리</div>
        <div className="rt-cc-field">
          <div className="rt-cc-num-row">
            <input className="rt-cc-input" type="number" value={expected} step={1000} onChange={(e) => setExpected(Math.max(0, +e.target.value || 0))} />
            <span className="rt-cc-input-unit">km</span>
          </div>
          <div className="rt-cc-chips">
            {chips.map((v, i) => (
              <button key={i} className={'rt-cc-chip' + (expected === v ? ' is-on' : '')} onClick={() => setExpected(v)}>{ccComma(v)}km</button>
            ))}
          </div>
        </div>
      </div>

      <div className="rt-dt-sect">
        <div className="rt-dt-sect-t">계산 내역</div>
        <div className="rt-dl">
          <div className="rt-dl-row"><span className="rt-dl-k">약정 총주행 ({ccComma(+c.annualKm)}km × {Math.round(+c.total / 12)}년)</span><span className="rt-dl-v">{ccComma(r.contracted)}km</span></div>
          <div className="rt-dl-row"><span className="rt-dl-k">예상 총주행</span><span className="rt-dl-v">{ccComma(expected)}km</span></div>
          <div className="rt-dl-row"><span className="rt-dl-k">초과 거리</span><span className="rt-dl-v">{ccComma(r.over)}km</span></div>
          <div className="rt-dl-row"><span className="rt-dl-k">km당 단가</span><span className="rt-dl-v">{ccComma(r.rate)}원</span></div>
        </div>
      </div>

      {r.fee > 0 && <PtSupportCta type="excess" amountWon={r.fee * 10000} label="초과운행금" />}

      <CcNote>km당 단가·정산 기준은 계약서·캐피탈마다 다릅니다(반납 정산 시 확정). 정확한 기준은 <b>{c.capital}</b> 또는 계약서를 확인하세요.</CcNote>
    </CcSub>
  );
}

/* ════════ ③ 만기 인수가 · 잔존가치 ════════ */
function CCBuyout({ c, onBack }: { c: Contract; onBack: () => void }) {
  const b = ccBuyout(c);
  const curPct = ccResidualNow(c);
  const pts: Array<{ y: number; pct: number; val: number }> = [];
  const yrs = Math.max(1, Math.round(+c.total / 12));
  for (let y = 0; y <= yrs; y++) {
    const pct = Math.round(100 - (100 - b.residualPct) * (y / yrs));
    pts.push({ y, pct, val: Math.round((b.price * pct) / 100) });
  }
  const elapsedY = +c.elapsed / 12;
  return (
    <CcSub title="만기 인수가·잔존가치" intro="만기 예상 인수가" desc="만기에 이 차를 인수한다면 예상 가격이에요" onBack={onBack}>
      <div className="rt-cc-tool">
        <div className="rt-cc-tool-cap">만기 예상 인수가</div>
        <CcBig value={ccComma(b.buyout)} unit="만원" tone="accent" />
        <div className="rt-cc-tool-sub">취득가 {ccComma(b.price)}만원 · 만기 잔존율 {b.residualPct}%</div>
      </div>

      <div className="rt-dt-sect">
        <div className="rt-dt-sect-t">잔존가치 추이 (리스 감가율)</div>
        <div className="rt-cc-curve">
          {pts.map((p, i) => {
            const past = p.y <= elapsedY + 0.001;
            return (
              <div className="rt-cc-bar-col" key={i}>
                <span className="rt-cc-bar-v">{p.pct}%</span>
                <div className="rt-cc-bar" style={{ height: Math.max(8, p.pct * 0.92) + 'px', opacity: past ? 1 : 0.4 }} />
                <span className="rt-cc-bar-x">{p.y}년</span>
              </div>
            );
          })}
        </div>
        <div className="rt-cc-curve-legend"><span><i className="on" />경과</span><span><i />예상</span></div>
      </div>

      <div className="rt-dt-sect">
        <div className="rt-dt-sect-t">현재 시점</div>
        <div className="rt-dl">
          <div className="rt-dl-row"><span className="rt-dl-k">경과</span><span className="rt-dl-v">{c.elapsed}/{c.total}개월</span></div>
          <div className="rt-dl-row"><span className="rt-dl-k">현재 추정 잔존율</span><span className="rt-dl-v">{curPct}%</span></div>
          <div className="rt-dl-row"><span className="rt-dl-k">현재 추정 잔존가치</span><span className="rt-dl-v">{ccComma((b.price * curPct) / 100)}만원</span></div>
          <div className="rt-dl-row"><span className="rt-dl-k">만기 예상 인수가</span><span className="rt-dl-v" style={{ color: 'var(--rt-accent,#B07A2E)' }}>{ccComma(b.buyout)}만원</span></div>
        </div>
      </div>

      <CcNote>잔존율·감가는 차종·주행·시장에 따라 달라지는 <b>추정치</b>입니다. 실제 만기 인수가는 <b>{c.capital}</b> 잔존가치 정책으로 확정돼요.</CcNote>
    </CcSub>
  );
}

/* ════════ ④ 캐피탈 연락·서류·사고 ════════ */
function CCContacts({ c, onBack }: { c: Contract; onBack: () => void }) {
  const cap = ccCapital(c);
  return (
    <CcSub title="연락처·서류 발급" intro="내 캐피탈사 연락·서류" desc={cap ? cap.name + ' · 내 계약 기준 안내예요' : '계약 캐피탈 정보를 확인하세요'} onBack={onBack}>
      {cap && (
        <>
          <div className="rt-dt-sect">
            <div className="rt-dt-sect-t">고객센터</div>
            <div className="rt-cc-contact">
              <div className="rt-cc-contact-main">
                <div className="rt-cc-contact-n">{cap.name}</div>
                <div className="rt-cc-contact-h">{cap.hours}</div>
              </div>
              <a className="rt-cc-call" href={'tel:' + cap.cs.replace(/[^0-9]/g, '')}>
                <CcIcon name="phone" size={16} />
                {cap.cs}
              </a>
            </div>
          </div>

          <div className="rt-dt-sect">
            <div className="rt-dt-sect-t">서류 발급 안내</div>
            <div className="rt-cc-issues">
              {cap.issues.map((it, i) => (
                <div className="rt-cc-issue" key={i}>
                  <div className="rt-cc-issue-k">{it.k}</div>
                  <div className="rt-cc-issue-how">{it.how}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rt-dt-sect">
            <div className="rt-dt-sect-t">사고·긴급·정비</div>
            <div className="rt-cc-contact">
              <div className="rt-cc-contact-main">
                <div className="rt-cc-contact-n">{cap.accidentName}</div>
                <div className="rt-cc-contact-h">사고 접수·긴급출동 24시간</div>
              </div>
              <a className="rt-cc-call is-danger" href={'tel:' + cap.accident.replace(/[^0-9]/g, '')}>
                <CcIcon name="phone" size={16} />
                {cap.accident}
              </a>
            </div>
            <a className="rt-cc-2nd" href="tel:16667000">
              <span><b>렌테일러 고객지원</b> 1666-7000 · 사고·정비 동행 안내</span>
              <span className="rt-cc-2nd-chev"><CcIcon name="chev" size={16} /></span>
            </a>
          </div>
        </>
      )}
      <CcNote>연락처·발급 방법은 캐피탈 정책에 따라 변경될 수 있어요. 최신 정보는 각 사 홈페이지를 확인하세요.</CcNote>
    </CcSub>
  );
}

/* ════════ ⑤ 계약 정보 직접 입력·수정 (+ OCR) ════════ */
interface EditForm {
  method: string;
  capital: string;
  termMonths: number | '';
  monthly: number | '';
  annualKm: number | '';
  deposit: number | '';
  start: string;
  end: string;
  carPrice: number | '';
  residualPct: number | '';
}
type EditFieldKey = keyof EditForm;
interface EditField {
  k: EditFieldKey;
  label: string;
  type: 'select' | 'capital' | 'num' | 'text';
  opts?: string[];
  unit?: string;
  ph?: string;
}
const CC_EDIT_FIELDS: EditField[] = [
  { k: 'method', label: '계약 방식', type: 'select', opts: ['운용리스(장기렌트)', '금융리스', '오토할부'] },
  { k: 'capital', label: '캐피탈/리스사', type: 'capital' },
  { k: 'termMonths', label: '계약 기간', type: 'num', unit: '개월' },
  { k: 'monthly', label: '월 렌트료', type: 'num', unit: '만원' },
  { k: 'annualKm', label: '약정 주행거리(연)', type: 'num', unit: 'km' },
  { k: 'deposit', label: '보증금', type: 'num', unit: '만원' },
  { k: 'start', label: '계약 시작일', type: 'text', ph: '2026.04.01' },
  { k: 'end', label: '만기일', type: 'text', ph: '2030.03.31' },
  { k: 'carPrice', label: '차량 취득가', type: 'num', unit: '만원' },
  { k: 'residualPct', label: '만기 잔존율', type: 'num', unit: '%' },
];
function ccFormFromContract(c: Contract): EditForm {
  return {
    method: c.method || '운용리스(장기렌트)',
    capital: c.capital || '',
    termMonths: +c.total || '',
    monthly: +c.monthly || '',
    annualKm: +c.annualKm || '',
    deposit: c.deposit != null ? +c.deposit : 0,
    start: c.start || '',
    end: c.end || '',
    carPrice: +c.carPrice || '',
    residualPct: +c.residualPct || '',
  };
}
type OcrState = 'idle' | 'reading' | 'done';
function CCEdit({ c, onBack, onSave }: { c: Contract; onBack: () => void; onSave: (form: EditForm) => void }) {
  const [form, setForm] = useState<EditForm>(() => ccFormFromContract(c));
  const [ocr, setOcr] = useState<Partial<Record<EditFieldKey, number>>>({});
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const set = (k: EditFieldKey, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const runOcr = () => {
    setOcrState('reading');
    setTimeout(() => {
      const draft = ccFormFromContract(c);
      draft.carPrice = '';
      setForm(draft);
      setOcr({ method: 1, capital: 1, termMonths: 1, monthly: 1, annualKm: 1, deposit: 1, start: 1, end: 1, residualPct: 1 });
      setOcrState('done');
    }, 1300);
  };
  const save = () => {
    onSave(form);
    onBack();
  };

  return (
    <CcSub title="계약 정보 입력·수정" intro="내 계약 정보" desc="직접 입력하거나, 계약서 사진으로 자동 입력할 수 있어요" onBack={onBack}>
      <div className="rt-dt-sect">
        <div className={'rt-cc-ocr' + (ocrState === 'done' ? ' is-done' : '')}>
          <div className="rt-cc-ocr-head">
            <span className="rt-cc-ocr-ic"><CcIcon name="doc" size={20} /></span>
            <div className="rt-cc-ocr-main">
              <div className="rt-cc-ocr-t">계약서로 자동 입력</div>
              <div className="rt-cc-ocr-d">카카오톡 채널로 계약서 사진을 보내면 자동으로 읽어 채워드려요</div>
            </div>
          </div>
          {ocrState === 'idle' && (
            <button className="rt-cc-ocr-btn" type="button" onClick={runOcr}>
              <CcIcon name="camera" size={16} />
              계약서 사진 불러오기
            </button>
          )}
          {ocrState === 'reading' && <div className="rt-cc-ocr-reading"><span className="rt-cc-spin" />계약서를 읽는 중…</div>}
          {ocrState === 'done' && (
            <div className="rt-cc-ocr-done">
              <RtCheck /> 인식 완료 · 아래 값을 <b>확인하고 정확히 수정</b>한 뒤 저장하세요
            </div>
          )}
        </div>
      </div>

      <div className="rt-dt-sect">
        <div className="rt-dt-sect-t">계약 정보</div>
        <div className="rt-cc-form">
          {CC_EDIT_FIELDS.map((f) => (
            <div className="rt-cc-frow" key={f.k}>
              <label className="rt-cc-flabel">
                {f.label}
                {ocr[f.k] && <span className="rt-cc-ocr-tag">OCR 인식</span>}
              </label>
              {f.type === 'select' ? (
                <select className="rt-cc-finput" value={form[f.k] as string} onChange={(e) => set(f.k, e.target.value)}>
                  {f.opts!.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'capital' ? (
                <select className="rt-cc-finput" value={form[f.k] as string} onChange={(e) => set(f.k, e.target.value)}>
                  <option value="">선택하세요</option>
                  {Object.values(CC_CAPITAL).map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
                </select>
              ) : (
                <div className="rt-cc-fnum">
                  <input
                    className="rt-cc-finput"
                    type={f.type === 'num' ? 'number' : 'text'}
                    value={form[f.k] as string | number}
                    placeholder={f.ph || ''}
                    onChange={(e) => set(f.k, f.type === 'num' ? (e.target.value === '' ? '' : +e.target.value) : e.target.value)}
                  />
                  {f.unit && <span className="rt-cc-funit">{f.unit}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <CcNote>입력하신 정보는 <b>내 계약</b>에만 저장되어 계약 케어 계산에 쓰여요. 계약서 원본과 다르면 캐피탈/리스사 기준이 우선합니다.</CcNote>

      <div className="rt-dt-cta">
        <button className="rt-prim-btn" type="button" onClick={save}>저장하기</button>
      </div>
    </CcSub>
  );
}

/* ════════ 허브 (계약 선택 + D-day + 체크리스트 + 도구 메뉴) ════════ */
type View = 'hub' | 'early' | 'excess' | 'buyout' | 'contacts' | 'edit';

export default function ContractCarePage() {
  // 계약 편집 오버라이드 (localStorage rt_cc_override) 병합
  const [overrides, setOverrides] = useState<Record<string, Partial<Contract>>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem('rt_cc_override');
      if (raw) setOverrides(JSON.parse(raw) as Record<string, Partial<Contract>>);
    } catch {
      /* ignore */
    }
  }, []);
  const contracts = useMemo(() => MY_CONTRACTS.map((c) => ({ ...c, ...(overrides[c.carId] || {}) })), [overrides]);

  const [idx, setIdx] = useState(0);
  const [view, setView] = useState<View>('hub');
  const [toast, setToast] = useState<string | null>(null);
  const c = contracts[idx];

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const saveContract = (form: EditForm) => {
    const patch: Partial<Contract> = {
      method: form.method,
      capital: form.capital,
      total: +form.termMonths || c.total,
      monthly: String(form.monthly || c.monthly),
      annualKm: +form.annualKm || c.annualKm,
      deposit: +form.deposit || 0,
      start: form.start || c.start,
      end: form.end || c.end,
      carPrice: +form.carPrice || c.carPrice,
      residualPct: +form.residualPct || c.residualPct,
    };
    const next = { ...overrides, [c.carId]: { ...(overrides[c.carId] || {}), ...patch } };
    setOverrides(next);
    try {
      localStorage.setItem('rt_cc_override', JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setToast('계약 정보를 저장했어요');
  };

  const dday = ccDday(c.end);
  const maturity = dday != null && dday <= 60;
  const checks = maturity ? CC_CHECK_MATURITY : CC_CHECK_DURING;
  const tools: Array<{ tag: string; l: string; v: View }> = [
    { tag: '계산', l: '중도상환 수수료', v: 'early' },
    { tag: '계산', l: '초과운행료', v: 'excess' },
    { tag: '잔존', l: '만기 인수가·잔존가치', v: 'buyout' },
    { tag: '연락', l: '캐피탈 연락·서류·사고', v: 'contacts' },
  ];

  return (
    <div data-rt="contract-care" className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-page="contract-care">
        <div className="rt-scroll">
          {view === 'early' && <CCEarlyTerm c={c} onBack={() => setView('hub')} />}
          {view === 'excess' && <CCExcess c={c} onBack={() => setView('hub')} />}
          {view === 'buyout' && <CCBuyout c={c} onBack={() => setView('hub')} />}
          {view === 'contacts' && <CCContacts c={c} onBack={() => setView('hub')} />}
          {view === 'edit' && <CCEdit c={c} onBack={() => setView('hub')} onSave={saveContract} />}

          {view === 'hub' && (
            <>
              <RtTopNav title="계약 케어" backHref="/mypage" />
              <div className="rt-sub-intro">
                <h1 className="rt-sub-intro-t">계약 케어</h1>
                <p className="rt-sub-intro-d">계약 기간 중·만기에 필요한 계산과 안내를 한 곳에서</p>
              </div>

              {/* 계약 선택 */}
              {contracts.length > 1 && (
                <div className="rt-cc-chips" style={{ margin: '14px var(--rt-pad) 0' }}>
                  {contracts.map((ct, i) => (
                    <button key={ct.carId} className={'rt-cc-chip' + (i === idx ? ' is-on' : '')} onClick={() => setIdx(i)}>
                      {CAR_NAME[ct.carId] || ct.carId}
                    </button>
                  ))}
                </div>
              )}

              {/* 계약 요약 */}
              <div className="rt-dt-sect">
                <div className="rt-dl">
                  <div className="rt-dl-row"><span className="rt-dl-k">차량</span><span className="rt-dl-v">{CAR_NAME[c.carId] || c.carId}</span></div>
                  <div className="rt-dl-row"><span className="rt-dl-k">계약 방식</span><span className="rt-dl-v">{c.method}</span></div>
                  <div className="rt-dl-row"><span className="rt-dl-k">월 렌트료 · 기간</span><span className="rt-dl-v">{c.monthly}만원 · {c.term}</span></div>
                  <div className="rt-dl-row"><span className="rt-dl-k">제휴 캐피탈</span><span className="rt-dl-v">{c.capital}</span></div>
                  <div className="rt-dl-row"><span className="rt-dl-k">계약 기간</span><span className="rt-dl-v">{c.start} ~ {c.end}</span></div>
                </div>
              </div>

              {/* 만기 D-day */}
              {dday != null && dday >= 0 && (
                <div className="rt-dt-sect">
                  <div className={'rt-cc-dday' + (maturity ? ' is-soon' : '')}>
                    <div className="rt-cc-dday-l">
                      <span className="rt-cc-dday-cap">만기까지</span>
                      <span className="rt-cc-dday-num">D-{dday}</span>
                    </div>
                    <div className="rt-cc-dday-r">{maturity ? '만기가 가까워요. 인수·반납·재계약을 결정할 시기예요.' : '만기 ' + c.end + ' · 2개월 전 인수·반납·재계약 안내를 보내드려요.'}</div>
                  </div>
                </div>
              )}

              {/* 체크리스트 */}
              <div className="rt-dt-sect">
                <div className="rt-dt-sect-t">{maturity ? '만기 준비 체크' : '계약 기간 중 체크'}</div>
                <div className="rt-cc-check">
                  {checks.map((it, i) => (
                    <div className="rt-cc-check-item" key={i}>
                      <span className="rt-cc-check-ck"><RtCheck /></span>
                      <span className="rt-cc-check-main"><b>{it.t}</b><span>{it.d}</span></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 계약 케어 도구 */}
              <div className="rt-dt-sect">
                <div className="rt-dt-sect-t">계약 케어 도구 <span style={{ fontWeight: 600, color: '#9CA3AF' }}>· 가상계산</span></div>
                <div className="rt-gd">
                  {tools.map((t, i) => (
                    <button className="rt-gd-row" key={i} type="button" onClick={() => setView(t.v)}>
                      <span className="rt-gd-tag">{t.tag}</span>
                      <span className="rt-gd-main"><span className="rt-gd-t">{t.l}</span></span>
                      <span className="rt-gd-chev"><CcIcon name="chev" size={16} /></span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 계약 정보 입력·수정 진입 */}
              <div className="rt-dt-sect">
                <button className="rt-cc-edit-entry" type="button" onClick={() => setView('edit')}>
                  <span className="rt-cc-edit-ic"><CcIcon name="edit" size={17} /></span>
                  <span className="rt-cc-edit-main"><b>계약 정보 직접 입력·수정</b><span>계약서 사진(OCR)으로 자동 입력도 가능해요</span></span>
                  <span className="rt-cc-edit-chev"><CcIcon name="chev" size={16} /></span>
                </button>
              </div>
            </>
          )}

          <div style={{ height: 18 }} />
          <RtTabBar active="mypage" />
        </div>
      </div>

      {toast && <div className="rt-cc-toast">{toast}</div>}
    </div>
  );
}
