'use client';

// garage/page.tsx — 내 차고 (계약 차량 케어 허브)
// 원본: _design_ref/garage-app.jsx
//   리콜·자동차검사·자동차세·자동차보험·소모품 교체 안내. 계약 유형(렌트·리스=렌테일러 관리 / 할부=직접)에 따라 톤 분기.
// 데이터: 계약 = MY_CONTRACTS 시드 + 차량등록정보 = GARAGE_VEHICLE 시드 (회원/contract_vehicles 의존 → ★갭).
//   리콜 = GARAGE_RECALLS 시드 (실연동: 자동차리콜센터 data.go.kr). 번호조회 = GARAGE_PLATE_LOOKUP 목업 (실연동: 국토부 자동차종합정보 OpenAPI).
//   번호조회 등록 차량은 localStorage("rt_garage_reg")에 저장.
// 회원 게이트 없음 — 시드 계약/차량으로 UI 시연.
import React, { useEffect, useState } from 'react';
import { RtTopNav, RtTabBar } from '@/components/rentailor/RtChrome';
import { rtFindCar, type Car } from '@/lib/rentailor/catalog';
import './garage.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

/* ════════ 계약 시드 (회원/contract_vehicles 의존 → ★갭) ════════ */
interface Contract {
  carId: string;
  method: string;
  state: 'active' | 'done';
  start: string;
  end?: string;
  annualKm: number;
  total: number;
}
const MY_CONTRACTS: Contract[] = [
  { carId: 'gv70', method: '운용리스(장기렌트)', state: 'active', start: '2023.08.01', end: '2026.07.31', annualKm: 15000, total: 36 },
  { carId: 'sorento', method: '운용리스(장기렌트)', state: 'active', start: '2026.04.01', end: '2030.03.31', annualKm: 20000, total: 48 },
  { carId: 'ioniq5', method: '운용리스(장기렌트)', state: 'done', start: '2022.05.01', end: '2025.04.30', annualKm: 15000, total: 36 },
];

/* 계약완료 시 수집하는 차량 상세 (VIN 기준 정밀 매칭) */
interface VehicleInfo {
  vin: string;
  plate: string;
  regDate: string;
  color: string;
  odo: number;
  source?: string;
  maker?: string;
  model?: string;
}
const GARAGE_VEHICLE: Record<string, VehicleInfo> = {
  gv70: { vin: 'KMTG*****NU012345', plate: '12가 3456', regDate: '2023.08.01', color: '우유니 화이트', odo: 41200 },
  sorento: { vin: 'KNAR*****PG098765', plate: '247허 8801', regDate: '2026.04.01', color: '오로라 블랙', odo: 6800 },
  ioniq5: { vin: 'KMHK*****MU054321', plate: '31주 1122', regDate: '2022.05.01', color: '그래비티 골드', odo: 58400 },
};

/* 차량별 리콜 (실연동: 자동차리콜센터 data.go.kr) */
interface Recall {
  date: string;
  part: string;
  title: string;
  action: string;
  status: string;
  open: boolean;
}
const GARAGE_RECALLS: Record<string, Recall[]> = {
  sorento: [{ date: '2026.05.20', part: '전기 장치', title: 'IEB(통합전자제동) 소프트웨어 업데이트', action: '무상 업데이트 (약 30분)', status: '조치 필요', open: true }],
  gv70: [{ date: '2024.11.02', part: '연료 장치', title: '고압연료펌프 점검·교체', action: '무상 점검·교체', status: '조치 완료', open: false }],
  ioniq5: [],
};

/* 소모품 주기 */
interface Part {
  key: string;
  label: string;
  everyKm: number;
  everyMonth: number;
}
const GARAGE_PARTS: Part[] = [
  { key: 'oil', label: '엔진오일·필터', everyKm: 15000, everyMonth: 12 },
  { key: 'tire', label: '타이어', everyKm: 50000, everyMonth: 48 },
  { key: 'brake', label: '브레이크 패드', everyKm: 40000, everyMonth: 36 },
  { key: 'cabin', label: '에어컨 필터', everyKm: 15000, everyMonth: 12 },
  { key: 'wiper', label: '와이퍼 블레이드', everyKm: 0, everyMonth: 12 },
  { key: 'coolant', label: '냉각수', everyKm: 200000, everyMonth: 120 },
];

const GG_TODAY = new Date('2026-06-25');
function ggParseDate(s: string): Date {
  return new Date(s.replace(/\./g, '-').replace(/-$/, ''));
}
function ggAddYears(d: Date, y: number): Date {
  const n = new Date(d);
  n.setFullYear(n.getFullYear() + y);
  return n;
}
function ggFmt(d: Date): string {
  return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
}
function ggDday(d: Date): number {
  return Math.ceil((d.getTime() - GG_TODAY.getTime()) / 86400000);
}
function ggDdayLabel(dday: number): string {
  return dday < 0 ? Math.abs(dday) + '일 지남' : dday === 0 ? '오늘' : 'D-' + dday;
}
function ggNextInspection(reg: Date): Date {
  let d = ggAddYears(reg, 4);
  while (ggDday(d) < -30) d = ggAddYears(d, 2);
  return d;
}
function ggNextInsurance(reg: Date): Date {
  let d = ggAddYears(reg, 1);
  while (ggDday(d) < 0) d = ggAddYears(d, 1);
  return d;
}
function ggNextTax(): Date {
  const y = GG_TODAY.getFullYear();
  const dates = [new Date(y, 5, 16), new Date(y, 11, 16), new Date(y + 1, 5, 16)];
  return dates.find((d) => ggDday(d) >= 0) as Date;
}
interface PartStatus {
  byKm: number | null;
  monthsLeft: number;
  soon: boolean;
}
function ggPartStatus(p: Part, odo: number, reg: Date): PartStatus {
  const byKm = p.everyKm ? p.everyKm - (odo % p.everyKm) : Infinity;
  const monthsSince = (GG_TODAY.getTime() - reg.getTime()) / (86400000 * 30.4);
  const cyc = p.everyMonth || 999;
  const monthsLeft = cyc - (monthsSince % cyc);
  const kmSoon = byKm <= 2000;
  const moSoon = monthsLeft <= 1.5;
  return { byKm: byKm === Infinity ? null : Math.round(byKm), monthsLeft: Math.round(monthsLeft), soon: kmSoon || moSoon };
}
function isRental(method: string): boolean {
  return /렌트|리스/.test(method || '');
}

interface PartView extends Part, PartStatus {
  covered: boolean;
}
interface Care {
  rental: boolean;
  recall: { open: number; total: number; list: Recall[] };
  inspection: { date: Date; dday: number };
  tax: { date: Date; dday: number; covered: boolean };
  insurance: { date: Date; dday: number; covered: boolean };
  parts: PartView[];
}
function buildCare(c: Contract, v: VehicleInfo): Care {
  const reg = ggParseDate(v.regDate);
  const rental = isRental(c.method);
  const recalls = GARAGE_RECALLS[c.carId] || [];
  const openRecalls = recalls.filter((r) => r.open);
  const insp = ggNextInspection(reg);
  const ins = ggNextInsurance(reg);
  const tax = ggNextTax();
  return {
    rental,
    recall: { open: openRecalls.length, total: recalls.length, list: recalls },
    inspection: { date: insp, dday: ggDday(insp) },
    tax: { date: tax, dday: ggDday(tax), covered: rental },
    insurance: { date: ins, dday: ggDday(ins), covered: rental },
    parts: GARAGE_PARTS.map((p) => ({ ...p, ...ggPartStatus(p, v.odo, reg), covered: rental })),
  };
}
interface UpItem {
  k: string;
  urgent?: boolean;
  txt: string;
  dday: number;
  ic: string;
}
function upcomingItems(care: Care): UpItem[] {
  const items: UpItem[] = [];
  if (care.recall.open) items.push({ k: '리콜', urgent: true, txt: care.recall.open + '건 조치 필요', dday: -1, ic: 'recall' });
  items.push({ k: '정기검사', txt: ggFmt(care.inspection.date), dday: care.inspection.dday, ic: 'inspect' });
  if (!care.tax.covered) items.push({ k: '자동차세', txt: ggFmt(care.tax.date), dday: care.tax.dday, ic: 'tax' });
  if (!care.insurance.covered) items.push({ k: '보험 갱신', txt: ggFmt(care.insurance.date), dday: care.insurance.dday, ic: 'shield' });
  const soonParts = care.parts.filter((p) => p.soon);
  soonParts.forEach((p) => items.push({ k: p.label, txt: p.byKm != null ? p.byKm.toLocaleString() + 'km 후' : p.monthsLeft + '개월 후', dday: 0, ic: 'wrench' }));
  return items.sort((a, b) => a.dday - b.dday).slice(0, 4);
}

/* ════════ 국토부 차량번호 조회 (목업) ════════ */
interface PlateResult {
  maker: string;
  model: string;
  year: string;
  fuel: string;
  cc: string;
  color: string;
  regDate: string;
  vin: string;
  odo: number;
  slug: string;
  plate: string;
}
const GARAGE_PLATE_LOOKUP: Record<string, Omit<PlateResult, 'plate'>> = {
  '12가3456': { maker: '제네시스', model: 'GV70', year: '2023', fuel: '가솔린', cc: '2497', color: '우유니 화이트', regDate: '2023.08.01', vin: 'KMTG*****NU012345', odo: 41200, slug: 'gv70' },
  '247허8801': { maker: '기아', model: '쏘렌토 HEV', year: '2026', fuel: '하이브리드', cc: '1598', color: '오로라 블랙', regDate: '2026.04.01', vin: 'KNAR*****PG098765', odo: 6800, slug: 'sorento' },
  '31주1122': { maker: '현대', model: '아이오닉 5', year: '2022', fuel: '전기', cc: '—', color: '그래비티 골드', regDate: '2022.05.01', vin: 'KMHK*****MU054321', odo: 58400, slug: 'ioniq5' },
};
function ggNormPlate(s: string): string {
  return (s || '').replace(/\s/g, '');
}
function ggLookupPlate(plate: string): PlateResult | null {
  const k = ggNormPlate(plate);
  if (GARAGE_PLATE_LOOKUP[k]) return { ...GARAGE_PLATE_LOOKUP[k], plate: k };
  if (!/^\d{2,3}[가-힣]\d{4}$/.test(k)) return null;
  return { maker: '현대', model: '아반떼', year: '2024', fuel: '가솔린', cc: '1598', color: '—', regDate: '2024.03.15', vin: '조회필요', odo: 22000, slug: 'avante', plate: k };
}
interface RegVehicle extends PlateResult {
  id: string;
}
function ggLoadReg(): RegVehicle[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('rt_garage_reg') || '[]') as RegVehicle[];
  } catch {
    return [];
  }
}
function ggSaveReg(arr: RegVehicle[]): void {
  try {
    localStorage.setItem('rt_garage_reg', JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}
function ggAddReg(info: PlateResult): string {
  const arr = ggLoadReg();
  const exist = arr.find((r) => r.plate === info.plate);
  if (exist) return exist.id;
  const id = 'reg-' + (info.plate.match(/\d+/g) || ['0']).join('') + '-' + arr.length;
  arr.push({ id, ...info });
  ggSaveReg(arr);
  return id;
}
// 번호조회 등록 차량 → 케어 허브용 계약형 객체
function ggRegToContract(reg: RegVehicle): Contract {
  return { carId: reg.id, method: '자가 보유', start: reg.regDate, state: 'active', annualKm: 15000, total: 0 };
}
function ggRegToVehicle(reg: RegVehicle): VehicleInfo {
  return { vin: reg.vin, plate: reg.plate, regDate: reg.regDate, color: reg.color, odo: reg.odo, source: 'molit', maker: reg.maker, model: reg.model };
}

/* ════════ 아이콘 ════════ */
function GgIcon({ name, size = 20 }: { name: string; size?: number }) {
  const p: Record<string, React.ReactNode> = {
    recall: (
      <>
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      </>
    ),
    inspect: (
      <>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
    tax: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 14h3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3l7 2.5v5.5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V5.5z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    wrench: <path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18l3 3 6.5-6.5a4 4 0 0 0 5.2-5.2l-2.4 2.4-2.5-.6-.6-2.5z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    chev: <path d="M9 6l6 6-6 6" />,
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {p[name]}
    </svg>
  );
}

function carName(c: Car | null): string {
  return c ? c.model.replace(/\s*\(.*\)/, '') : '';
}

/* 이미지 자리 (프로토타입 <image-slot> 대체 — 디자인 동일, 실 이미지 연동 보류) */
function ThumbPh({ label }: { label: string }) {
  return <div className="gg-thumb-ph">{label}</div>;
}

/* 서브 화면 셸 */
function GgSub({ title, intro, desc, onBack, children }: { title: string; intro?: string; desc?: string; onBack: () => void; children: React.ReactNode }) {
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
    </>
  );
}

/* 케어 모듈 카드 */
function CareCard({
  ic,
  title,
  status,
  statusTone,
  desc,
  onAction,
  actionLabel,
  children,
}: {
  ic: string;
  title: string;
  status?: string;
  statusTone?: string;
  desc?: string;
  onAction?: (() => void) | null;
  actionLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={'gg-care' + (statusTone ? ' t-' + statusTone : '')}>
      <div className="gg-care-hd">
        <span className="gg-care-ic"><GgIcon name={ic} size={19} /></span>
        <span className="gg-care-t">{title}</span>
        {status && <span className={'gg-care-st t-' + (statusTone || 'neutral')}>{status}</span>}
      </div>
      {desc && <p className="gg-care-d">{desc}</p>}
      {children}
      {onAction && (
        <button className="gg-care-act" type="button" onClick={onAction}>
          {actionLabel}
          <GgIcon name="chev" size={15} />
        </button>
      )}
    </div>
  );
}

/* ════════ 차량 1대 케어 허브 ════════ */
function GarageCarScreen({ c, car, veh, onBack, onToast }: { c: Contract; car: Car | null; veh: VehicleInfo; onBack: () => void; onToast: (m: string) => void }) {
  const v = veh;
  const care = buildCare(c, v);
  const up = upcomingItems(care);
  const title = car ? car.brand + ' ' + carName(car) : v.maker ? v.maker + ' ' + v.model : c.carId;

  return (
    <GgSub title="내 차고" onBack={onBack}>
      <div style={{ height: 14 }} />
      {/* 차량 카드 */}
      <div className="gg-veh" style={cssVar({ '--hue': car ? car.hue : 210 })}>
        <div className="gg-veh-thumb"><ThumbPh label={car ? car.model : v.model || '차량 이미지'} /></div>
        <div className="gg-veh-meta">
          <div className="gg-veh-name">{title}</div>
          <div className="gg-veh-plate">{v.plate}</div>
          <div className="gg-veh-sub">{[v.color, v.odo != null ? v.odo.toLocaleString() + 'km' : null, v.regDate ? v.regDate + ' 등록' : null].filter(Boolean).join(' · ')}</div>
          <div className="gg-veh-tags">
            <span className={'gg-veh-tag' + (care.rental ? ' is-rental' : '')}>{care.rental ? '렌테일러 관리' : '직접 관리'}</span>
            <span className="gg-veh-tag">{c.method}</span>
            {v.source === 'molit' || (v.vin && !car) ? <span className="gg-veh-tag">국토부 조회</span> : null}
          </div>
        </div>
      </div>

      {/* 다가오는 일정 */}
      <div className="rt-dt-sect">
        <div className="rt-dt-sect-t">다가오는 일정</div>
        <div className="gg-up">
          {up.map((u, i) => (
            <div className={'gg-up-row' + (u.urgent ? ' is-urgent' : '')} key={i}>
              <span className="gg-up-ic"><GgIcon name={u.ic} size={16} /></span>
              <span className="gg-up-k">{u.k}</span>
              <span className="gg-up-txt">{u.txt}</span>
              {u.dday > 0 ? (
                <span className="gg-up-d">{ggDdayLabel(u.dday)}</span>
              ) : u.urgent ? (
                <span className="gg-up-d is-now">조치</span>
              ) : (
                <span className="gg-up-d is-now">임박</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 리콜 */}
      <div className="rt-dt-sect">
        <CareCard
          ic="recall"
          title="안전 리콜"
          status={care.recall.open ? care.recall.open + '건 조치 필요' : care.recall.total ? '조치 완료' : '해당 없음'}
          statusTone={care.recall.open ? 'warn' : 'ok'}
          desc={care.recall.open ? '내 차량(VIN 기준)에 해당하는 리콜이 있어요. 렌테일러가 무상 입고를 대행해 드려요.' : care.recall.total ? '과거 리콜은 모두 조치 완료됐어요.' : '현재 진행 중인 리콜이 없어요. 안심하세요.'}
          onAction={care.recall.open ? () => onToast('무상 입고 예약 — 가까운 제휴 정비소 안내 (연동 예정)') : null}
          actionLabel="무상 입고 예약"
        >
          {care.recall.list.length > 0 && (
            <div className="gg-recalls">
              {care.recall.list.map((r, i) => (
                <div className={'gg-recall' + (r.open ? ' is-open' : '')} key={i}>
                  <div className="gg-recall-top"><span className="gg-recall-part">{r.part}</span><span className={'gg-recall-st' + (r.open ? ' is-open' : '')}>{r.status}</span></div>
                  <div className="gg-recall-title">{r.title}</div>
                  <div className="gg-recall-act">{r.action} · {r.date}</div>
                </div>
              ))}
            </div>
          )}
        </CareCard>
      </div>

      {/* 정기검사 */}
      <div className="rt-dt-sect">
        <CareCard
          ic="inspect"
          title="자동차 정기검사"
          status={ggDdayLabel(care.inspection.dday)}
          statusTone={care.inspection.dday <= 30 ? 'warn' : 'neutral'}
          desc={'다음 검사 ' + ggFmt(care.inspection.date) + ' · 신차는 등록 4년 후 첫 검사, 이후 2년마다예요.' + (care.rental ? ' 렌테일러가 미리 안내·예약을 도와드려요.' : '')}
          onAction={() => onToast('검사소 찾기·예약 안내 (TS 한국교통안전공단 연동 예정)')}
          actionLabel="검사소 찾기"
        />
      </div>

      {/* 자동차세 */}
      <div className="rt-dt-sect">
        <CareCard
          ic="tax"
          title="자동차세"
          status={care.tax.covered ? '포함' : ggDdayLabel(care.tax.dday)}
          statusTone={care.tax.covered ? 'ok' : 'neutral'}
          desc={care.tax.covered ? '장기렌트·리스는 차량이 회사 소유라 자동차세를 렌테일러가 납부해요. 따로 내실 필요 없어요.' : '다음 납부 ' + ggFmt(care.tax.date) + ' · 연 2회(6·12월) 또는 1월 연납 시 할인돼요.'}
          onAction={care.tax.covered ? null : () => onToast('위택스 자동차세 납부 안내 (연동 예정)')}
          actionLabel="납부 안내"
        />
      </div>

      {/* 자동차보험 */}
      <div className="rt-dt-sect">
        <CareCard
          ic="shield"
          title="자동차보험"
          status={care.insurance.covered ? '포함' : ggDdayLabel(care.insurance.dday)}
          statusTone={care.insurance.covered ? 'ok' : 'warn'}
          desc={care.insurance.covered ? '장기렌트·리스는 책임·종합보험이 월 납부액에 포함돼요. 사고 시 전담 매니저가 접수·대차까지 안내해요.' : '보험 만기 ' + ggFmt(care.insurance.date) + ' · 만기 전 갱신 견적을 비교해 알려드려요.'}
          onAction={care.insurance.covered ? () => onToast('사고 접수·대차 안내 (전담 매니저 연결, 연동 예정)') : () => onToast('보험 갱신 견적 비교 (연동 예정)')}
          actionLabel={care.insurance.covered ? '사고 접수·문의' : '갱신 견적 비교'}
        />
      </div>

      {/* 소모품 교체 */}
      <div className="rt-dt-sect">
        <CareCard ic="wrench" title="소모품 교체" desc={care.rental ? '정비 서비스가 포함돼 있어요. 교체 시기가 되면 제휴 정비소 예약을 안내해 드려요.' : '주행거리·기간 기준 교체 시기를 알려드려요.'}>
          <div className="gg-parts">
            {care.parts.map((p, i) => (
              <div className={'gg-part' + (p.soon ? ' is-soon' : '')} key={i}>
                <span className="gg-part-l">{p.label}</span>
                <span className="gg-part-v">
                  {p.byKm != null && <span>{p.byKm.toLocaleString()}km 후</span>}
                  {p.byKm != null && <span className="gg-part-dot">·</span>}
                  <span>{p.monthsLeft}개월 후</span>
                </span>
                {p.soon && <span className="gg-part-soon">교체 임박</span>}
              </div>
            ))}
          </div>
          <button className="gg-care-act" type="button" onClick={() => onToast('제휴 정비소 예약 (연동 예정)')}>
            정비소 예약·교체 안내
            <GgIcon name="chev" size={15} />
          </button>
        </CareCard>
      </div>

      <div style={{ height: 8 }} />
    </GgSub>
  );
}

/* ════════ 차량번호로 불러오기 ════════ */
function GarageAddScreen({ onBack, onAdded, onToast }: { onBack: () => void; onAdded: (id: string) => void; onToast: (m: string) => void }) {
  const [plate, setPlate] = useState('');
  const [owner, setOwner] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlateResult | null>(null);
  const [err, setErr] = useState('');

  const lookup = () => {
    setErr('');
    setResult(null);
    const r = ggLookupPlate(plate);
    if (!r) {
      setErr('차량번호 형식을 확인해 주세요. 예) 12가3456');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setResult(r);
      setLoading(false);
    }, 900);
  };
  const add = () => {
    if (!result) return;
    const id = ggAddReg(result);
    onAdded(id);
    onToast(result.maker + ' ' + result.model + ' 차량을 내 차고에 추가했어요');
  };

  return (
    <GgSub title="차량 불러오기" intro="차량번호로 불러오기" desc="국토교통부 자동차종합정보로 내 차 정보를 자동으로 채워요" onBack={onBack}>
      <div className="gg-add">
        <label className="gg-add-label">차량번호</label>
        <input className="gg-add-input" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="예) 12가 3456" inputMode="text" />
        <label className="gg-add-label">
          소유자 성명 <span className="gg-add-opt">· 본인확인</span>
        </label>
        <input className="gg-add-input" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="등록원부상 소유자 성명" />
        <button className="rt-prim-btn" type="button" onClick={lookup} disabled={loading || !plate}>
          {loading ? '조회 중…' : '내 차 정보 조회'}
        </button>
        {err && <p className="gg-add-err">{err}</p>}
        <p className="gg-add-note">
          국토교통부 <b>자동차종합정보</b>에서 차량 제원·연식·등록·검사 정보를 가져와요. 소유자 본인확인을 거치며, 조회 정보는 안내 목적에만 사용됩니다.
        </p>
      </div>

      {loading && (
        <div className="gg-add-skel">
          <div className="gg-skel-bar" />
          <div className="gg-skel-bar" />
          <div className="gg-skel-bar short" />
        </div>
      )}

      {result && !loading && (
        <div className="rt-dt-sect">
          <div className="rt-dt-sect-t">조회 결과</div>
          <div className="gg-veh" style={cssVar({ '--hue': 210 })}>
            <div className="gg-veh-thumb"><ThumbPh label={result.model} /></div>
            <div className="gg-veh-meta">
              <div className="gg-veh-name">{result.maker} {result.model}</div>
              <div className="gg-veh-plate">{result.plate}</div>
              <div className="gg-veh-sub">{result.year}년식 · {result.fuel}{result.cc !== '—' ? ' · ' + Number(result.cc).toLocaleString() + 'cc' : ''} · {result.color}</div>
            </div>
          </div>
          <div className="rt-dl" style={{ marginTop: 12 }}>
            <div className="rt-dl-row"><span className="rt-dl-k">최초 등록일</span><span className="rt-dl-v">{result.regDate}</span></div>
            <div className="rt-dl-row"><span className="rt-dl-k">차대번호(VIN)</span><span className="rt-dl-v" style={{ fontFamily: 'var(--rt-mono,monospace)' }}>{result.vin}</span></div>
            <div className="rt-dl-row"><span className="rt-dl-k">주행거리</span><span className="rt-dl-v">{result.odo.toLocaleString()}km</span></div>
          </div>
          <div className="rt-dt-cta">
            <button className="rt-prim-btn" type="button" onClick={add}>내 차고에 추가</button>
          </div>
        </div>
      )}
      <div style={{ height: 8 }} />
    </GgSub>
  );
}

/* ════════ 차량 목록 ════════ */
type View = { name: 'list' } | { name: 'car'; idx: number } | { name: 'reg'; id: string } | { name: 'add' };

export default function GaragePage() {
  const [view, setView] = useState<View>({ name: 'list' });
  const [toast, setToast] = useState<string | null>(null);
  const [reg, setReg] = useState<RegVehicle[]>([]);
  useEffect(() => setReg(ggLoadReg()), [view]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const active = MY_CONTRACTS.filter((c) => c.state === 'active');
  const total = active.length + reg.length;

  const renderList = () => (
    <GgSub title="내 차고" intro="내 차고" desc={total ? total + '대의 차량을 관리하고 있어요' : '내 차를 등록하고 케어 안내를 받아보세요'} onBack={() => (window.location.href = '/mypage')}>
      <div className="gg-list">
        {active.map((c) => {
          const car = rtFindCar(c.carId);
          const v = GARAGE_VEHICLE[c.carId] || { plate: '—', odo: 0, vin: '', regDate: c.start, color: '—' };
          const care = buildCare(c, v);
          const up = upcomingItems(care);
          const urgent = up.filter((u) => u.urgent || u.dday <= 30).length;
          const idx = MY_CONTRACTS.indexOf(c);
          return (
            <button className="gg-list-card" key={c.carId} type="button" onClick={() => setView({ name: 'car', idx })} style={cssVar({ '--hue': car ? car.hue : 210 })}>
              <div className="gg-list-thumb">{car && <ThumbPh label={car.model} />}</div>
              <div className="gg-list-main">
                <div className="gg-list-name">{car ? car.brand + ' ' + carName(car) : c.carId}</div>
                <div className="gg-list-plate">{v.plate} · {v.odo.toLocaleString()}km</div>
                <div className="gg-list-alert">
                  {care.recall.open ? <span className="gg-list-badge is-warn">리콜 {care.recall.open}건</span> : null}
                  {urgent ? <span className="gg-list-badge">다가오는 일정 {up.length}건</span> : <span className="gg-list-badge is-ok">안심 상태</span>}
                  <span className="gg-list-badge">{c.method}</span>
                </div>
              </div>
              <span className="gg-list-chev"><GgIcon name="chev" /></span>
            </button>
          );
        })}
        {reg.map((r) => (
          <button className="gg-list-card" key={r.id} type="button" onClick={() => setView({ name: 'reg', id: r.id })} style={cssVar({ '--hue': 210 })}>
            <div className="gg-list-thumb"><ThumbPh label={r.model} /></div>
            <div className="gg-list-main">
              <div className="gg-list-name">{r.maker} {r.model}</div>
              <div className="gg-list-plate">{r.plate} · {(r.odo || 0).toLocaleString()}km</div>
              <div className="gg-list-alert">
                <span className="gg-list-badge">자가 보유</span>
                <span className="gg-list-badge is-ok">국토부 조회</span>
              </div>
            </div>
            <span className="gg-list-chev"><GgIcon name="chev" /></span>
          </button>
        ))}
        <button className="gg-addbtn" type="button" onClick={() => setView({ name: 'add' })}>
          <span className="gg-addbtn-ic"><GgIcon name="plus" size={18} /></span>
          <span className="gg-addbtn-main">
            <b>차량번호로 불러오기</b>
            <span>국토부 자동차종합정보로 내 차 등록</span>
          </span>
          <GgIcon name="chev" size={16} />
        </button>
      </div>
      <p className="gg-note">
        계약 차량은 자동 등록돼요. 그 외 보유 차량은 <b>차량번호</b>로 불러오면 리콜·검사·세금·보험·소모품 안내를 함께 받을 수 있어요.
      </p>
    </GgSub>
  );

  return (
    <div data-rt="garage" className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-page="garage">
        <div className="rt-scroll">
          {view.name === 'list' && renderList()}
          {view.name === 'car' &&
            (() => {
              const c = MY_CONTRACTS[view.idx];
              const car = rtFindCar(c.carId);
              const v = GARAGE_VEHICLE[c.carId] || { vin: '—', plate: '—', regDate: c.start, color: '—', odo: 0 };
              return <GarageCarScreen c={c} car={car} veh={v} onBack={() => setView({ name: 'list' })} onToast={setToast} />;
            })()}
          {view.name === 'reg' &&
            (() => {
              const r = reg.find((x) => x.id === view.id);
              if (!r) return renderList();
              return <GarageCarScreen c={ggRegToContract(r)} car={null} veh={ggRegToVehicle(r)} onBack={() => setView({ name: 'list' })} onToast={setToast} />;
            })()}
          {view.name === 'add' && <GarageAddScreen onBack={() => setView({ name: 'list' })} onAdded={(id) => setView({ name: 'reg', id })} onToast={setToast} />}

          <div style={{ height: 18 }} />
          <RtTabBar active="mypage" />
        </div>
      </div>

      {toast && <div className="gg-toast">{toast}</div>}
    </div>
  );
}
