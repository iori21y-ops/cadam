'use client';

// 차량 옵션·사양 상세 미리보기 (타깃: /cars/[slug]/options)
// 원본: _design_ref/options-app.jsx (window 전역 → @/lib/rentailor/catalog import)
// 적응/제외: tweaks-panel / 디바이스 토글 / personalize 제외. 옵션 색상·사양·패키지 데이터는
//   프로토타입 전용 목업이므로 이 파일의 지역 상수로 유지. 합산 견적은 트림 base + 추가 옵션료.
import React, { Suspense, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { RtTopNav } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { Button } from '@/components/ui/Button';
import { rtFindCar, FUEL, RT_CATALOG, type Car } from '@/lib/rentailor/catalog';
import '../../cars-detail-preview/detail.css';
import '../options.css';

const ACCENT = '#C9A84C';

const OP_COLORS = [
  { l: '어비스 블랙', c: '#1A1C20' },
  { l: '스노우 화이트', c: '#EDEEF0' },
  { l: '그래비티 그레이', c: '#6E7378' },
  { l: '문라이트 블루', c: '#2C4B7C' },
  { l: '샌드 베이지', c: '#C7B79B' },
];

interface OpItem {
  n: string;
  from: number;
  add?: number;
}
interface OpGroup {
  ic: string;
  h: string;
  items: OpItem[];
}

// 사양 그룹: from = 기본 포함 최소 트림 인덱스, add = 미포함 트림에서 선택 시 월 추가요금(만원)
const OP_GROUPS: OpGroup[] = [
  { ic: 'safety', h: '안전·주행보조', items: [
    { n: '전방 충돌방지 보조 (FCA)', from: 0 },
    { n: '차로 유지·이탈방지 보조', from: 0 },
    { n: '후측방 충돌방지 보조', from: 1, add: 2 },
    { n: '고속도로 주행보조 (HDA)', from: 1, add: 3 },
    { n: '원격 스마트 주차 보조', from: 2, add: 3 },
  ] },
  { ic: 'ext', h: '외관', items: [
    { n: 'LED 헤드램프', from: 0 },
    { n: '17인치 알로이 휠', from: 0 },
    { n: '19인치 전용 휠', from: 1, add: 2 },
    { n: '파노라마 선루프', from: 1, add: 3 },
    { n: '전동 트렁크 (스마트 테일게이트)', from: 2, add: 2 },
  ] },
  { ic: 'interior', h: '실내·편의', items: [
    { n: '스마트키 · 버튼 시동', from: 0 },
    { n: '운전석 전동 시트', from: 0 },
    { n: '통풍·열선 시트 (1열)', from: 1, add: 2 },
    { n: '2열 열선 시트', from: 1, add: 1 },
    { n: '나파 가죽 시트', from: 2, add: 4 },
  ] },
  { ic: 'media', h: '인포테인먼트', items: [
    { n: '10.25인치 내비게이션', from: 0 },
    { n: '스마트폰 무선 연동', from: 0 },
    { n: '디지털 클러스터', from: 1, add: 2 },
    { n: '프리미엄 사운드 시스템', from: 1, add: 3 },
    { n: '빌트인 캠 · OTA 업데이트', from: 2, add: 2 },
  ] },
];
const OP_EV_GROUP: OpGroup = { ic: 'media', h: '전기차 전용', items: [
  { n: '400V 초급속 충전 지원', from: 0 },
  { n: 'V2L 실내외 전력 공급', from: 0 },
  { n: '히트펌프 시스템', from: 1, add: 2 },
  { n: '배터리 컨디셔닝', from: 1, add: 2 },
] };

// 트림과 무관하게 선택 가능한 선택 옵션 패키지 (월 추가요금, 만원)
const OP_PACKAGES = [
  { n: '컴포트 II 패키지', d: '2열 통풍시트 · 동승석 전동시트 · 메모리 시트', add: 3 },
  { n: '파킹 어시스트 패키지', d: '서라운드뷰 모니터 · 후방 주차 충돌방지', add: 3 },
  { n: '빌트인 캠 2', d: '전후방 영상 기록 · 클라우드 저장', add: 2 },
  { n: '현대 디지털 키 2', d: '스마트폰·워치로 차량 제어', add: 1 },
  { n: '플래티넘 외장 컬러', d: '매트·유광 프리미엄 도장', add: 2 },
];

function OpGroupIc({ name }: { name: string }) {
  const P: Record<string, React.ReactNode> = {
    safety: <><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
    ext: <><path d="M3 13l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v4.5H3z" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></>,
    interior: <><path d="M5 18v-5a3 3 0 0 1 3-3h4l4 3v5" /><path d="M5 18h12" /><circle cx="8" cy="7" r="2" /></>,
    media: <><rect x="3" y="5" width="18" height="13" rx="2" /><path d="M8 21h8M12 18v3" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {P[name]}
    </svg>
  );
}

interface SelectedOpt {
  n: string;
  add: number;
}

function OptionsApp() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  const slug = params?.slug ?? '';
  const car: Car | null = rtFindCar(slug) ?? RT_CATALOG[0] ?? null;

  const trimMax = car ? car.trims.length - 1 : 0;
  const trimParam = parseInt(search.get('trim') ?? '', 10);
  const initTrim = Number.isNaN(trimParam) ? 0 : Math.max(0, Math.min(trimMax, trimParam));

  const [trimIdx, setTrimIdx] = useState(initTrim);
  const [color, setColor] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [opts, setOpts] = useState<Record<string, boolean>>({});

  if (!car) {
    return null;
  }

  const groups: OpGroup[] = car.fuel === 'ev' ? OP_GROUPS.concat(OP_EV_GROUP) : OP_GROUPS;
  const toggleOpt = (key: string) =>
    setOpts((o) => {
      const n = { ...o };
      if (n[key]) delete n[key];
      else n[key] = true;
      return n;
    });

  // 현재 트림에서 실제 선택 중인 옵션만 합산 (트림에 기본 포함되면 자동 제외)
  const selected: SelectedOpt[] = [];
  groups.forEach((g, gi) =>
    g.items.forEach((it, ii) => {
      const key = 'g' + gi + '-' + ii;
      if (it.add && trimIdx < it.from && opts[key]) selected.push({ n: it.n, add: it.add });
    })
  );
  OP_PACKAGES.forEach((p, pi) => {
    const key = 'p' + pi;
    if (opts[key]) selected.push({ n: p.n, add: p.add });
  });
  const addTotal = selected.reduce((s, x) => s + x.add, 0);
  const total = car.trims[trimIdx].base + addTotal;
  const priceLabel = '월 ' + total + '만원';

  return (
    <div className="rt-root">
      <div className="rt-page" data-page="options" id="top">
        <RtTopNav title="옵션·사양" backHref={`/cars-detail-preview/${car.id}`} />

        <div className="rt-op-hero">
          <div className="rt-op-brand">{car.brand}</div>
          <h1 className="rt-op-name">{car.model}</h1>
          <p className="rt-op-seg">{car.segLabel} · {FUEL[car.fuel].label} · {car.trims.length}개 트림</p>
        </div>

        <div className="rt-op-trims">
          {car.trims.map((tr, i) => (
            <button key={i} className={'rt-op-trim' + (i === trimIdx ? ' is-on' : '')} onClick={() => setTrimIdx(i)}>
              <div className="rt-op-trim-n">{tr.name}</div>
              <div className="rt-op-trim-p">월 {tr.base}만원~</div>
            </button>
          ))}
        </div>

        <div className="rt-op-sect">
          <h2 className="rt-op-sect-t">외장 색상 <span>· 5color</span></h2>
          <div className="rt-op-colors">
            {OP_COLORS.map((c, i) => (
              <button key={i} className={'rt-op-color' + (i === color ? ' is-on' : '')} onClick={() => setColor(i)}>
                <span className="rt-op-color-sw" style={{ background: c.c }}></span>
                <span className="rt-op-color-l">{c.l}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rt-op-groups">
          {groups.map((g, gi) => (
            <div className="rt-op-group" key={gi}>
              <h3 className="rt-op-group-h">
                <span className="rt-op-group-ic"><OpGroupIc name={g.ic} /></span>{g.h}
              </h3>
              {g.items.map((it, ii) => {
                const key = 'g' + gi + '-' + ii;
                const on = trimIdx >= it.from;
                const addable = !on && !!it.add;
                const added = addable && !!opts[key];
                if (addable) {
                  return (
                    <button type="button" className={'rt-op-item addable' + (added ? ' added' : '')} key={ii} onClick={() => toggleOpt(key)}>
                      <span className={'rt-op-item-ck opt' + (added ? ' on' : '')}>
                        {added
                          ? <svg viewBox="0 0 24 24" width="13" height="13"><path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          : <svg viewBox="0 0 24 24" width="12" height="12"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" /></svg>}
                      </span>
                      <span className="rt-op-item-n">{it.n}</span>
                      <span className={'rt-op-item-add' + (added ? ' on' : '')}>{added ? '선택됨' : '+월 ' + it.add + '만원'}</span>
                    </button>
                  );
                }
                return (
                  <div className={'rt-op-item' + (on ? '' : ' off')} key={ii}>
                    <span className={'rt-op-item-ck' + (on ? '' : ' off')}>
                      {on
                        ? <svg viewBox="0 0 24 24" width="13" height="13"><path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        : <svg viewBox="0 0 24 24" width="11" height="11"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" /></svg>}
                    </span>
                    <span className="rt-op-item-n">{it.n}</span>
                    <span className="rt-op-item-mark on">기본</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="rt-op-sect">
          <h2 className="rt-op-sect-t">선택 옵션 패키지 <span>· 탭하여 추가</span></h2>
        </div>
        <div className="rt-op-pkgs">
          {OP_PACKAGES.map((p, pi) => {
            const key = 'p' + pi;
            const added = !!opts[key];
            return (
              <button type="button" className={'rt-op-pkg' + (added ? ' added' : '')} key={pi} onClick={() => toggleOpt(key)}>
                <span className={'rt-op-pkg-ck' + (added ? ' on' : '')}>
                  {added
                    ? <svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    : <svg viewBox="0 0 24 24" width="13" height="13"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" /></svg>}
                </span>
                <span className="rt-op-pkg-main">
                  <span className="rt-op-pkg-n">{p.n}</span>
                  <span className="rt-op-pkg-d">{p.d}</span>
                </span>
                <span className={'rt-op-pkg-add' + (added ? ' on' : '')}>+월 {p.add}만원</span>
              </button>
            );
          })}
        </div>

        <div className="rt-op-sect">
          <h2 className="rt-op-sect-t">기본 포함 서비스</h2>
        </div>
        <div className="rt-op-inc">
          {['자동차 보험', '자동차세', '정기 점검', '신차 무료 탁송'].map((t) => (
            <span className="rt-op-inc-card" key={t}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
              {t}
            </span>
          ))}
        </div>

        <div className="rt-bar">
          <div className="rt-bar-inner">
            {selected.length > 0 && (
              <div className="rt-op-selbar">
                <span className="rt-op-selbar-c">선택 옵션 {selected.length}개</span>
                <span className="rt-op-selbar-p">+월 {addTotal}만원</span>
              </div>
            )}
            <div className="rt-bar-row">
              <div style={{ flexShrink: 0, paddingRight: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--rt-muted)', fontWeight: 700 }}>{car.trims[trimIdx].name.slice(0, 8)}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--rt-ink)', letterSpacing: '-0.02em' }}>{priceLabel}~</div>
              </div>
              <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => setSheet(true)}>이 사양으로 상담</Button>
            </div>
          </div>
        </div>
      </div>

      <RtConsultSheet open={sheet} onClose={() => setSheet(false)} car={car} priceLabel={priceLabel} accent={ACCENT} />
    </div>
  );
}

export default function CarOptionsPreviewPage() {
  return (
    <Suspense fallback={null}>
      <OptionsApp />
    </Suspense>
  );
}
