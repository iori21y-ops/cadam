'use client';

// 감가상각 분석 — 리뉴얼 미리보기 (타깃 /diagnosis/report)
// 원본: _design_ref/deprec-app.jsx (+ rt-diag-tools.css)
// 이식 규칙: window 전역 → 모듈(import), CadamDS.Button → @/components/ui/Button,
//   디바이스 토글/TweaksPanel/personalize 제외, image-slot 미사용(감가 리포트엔 없음).
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RtTopNav } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { RT_CATALOG, type Car } from '@/lib/rentailor/catalog';
import { DP_MILEAGE, DP_OWNER, DP_AGES, DP_YEARS, calcDep, won } from './data';
import './deprec.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

type Step = 'form' | 'result';

function DepResult({ car, year, mile, owner }: { car: Car; year: number; mile: string; owner: string }) {
  const d = React.useMemo(() => calcDep(car, year, mile), [car, year, mile]);
  const maxV = d.cols[0].value;
  const corp = owner === 'corp' || owner === 'biz';
  const mileSub = DP_MILEAGE.find((x) => x.v === mile)?.sub ?? '';
  return (
    <div className="rt-qresult">
      <div className="rt-fade-up" style={cssVar({ '--d': '0ms' })}>
        <p className="rt-qresult-kicker">
          {year}년식 · {car.brand} · 주행 {mileSub}
        </p>
        <h2 className="rt-qresult-title">{car.model.replace(/\s*\(.*\)/, '')} 감가 분석</h2>
      </div>

      <div className="rt-dep-hero rt-fade-up" style={cssVar({ '--d': '60ms', marginTop: 18 })}>
        <p className="rt-dep-hero-k">현재 예상 중고 시세</p>
        <div className="rt-dep-now">
          <b>{won(d.now)}</b>
          <em>신차가 {won(d.msrp)} 대비 −{d.depPct}%</em>
        </div>
        <p className="rt-dep-meta">
          출고 후 {d.age}년 · 향후 3년간 약 <b style={{ color: ACCENT }}>{won(d.drop3)}</b>이 추가 감가될 것으로
          예상돼요.
        </p>
      </div>

      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '140ms' })}>
        <h3 className="rt-qblock-t">감가 추이</h3>
        <div className="rt-dep-curve">
          {d.cols.map((c) => (
            <div
              className={'rt-dep-col' + (c.d === 0 ? ' now' : '') + (c.d === 3 ? ' best' : '')}
              key={c.d}
            >
              <span className="rt-dep-colv">{won(c.value)}</span>
              <div
                className="rt-dep-colbar"
                style={{ height: Math.max(6, Math.round((c.value / maxV) * 118)) + 'px' }}
              ></div>
              <span className="rt-dep-coll">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '210ms' })}>
        <div className="rt-dep-timing">
          <span className="rt-dep-timing-ic">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 8v4l3 2" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <div>
            <div className="rt-dep-timing-h">지금이 전환 적기예요</div>
            <div className="rt-dep-timing-d">
              감가가 더 진행되기 전에 장기렌트로 전환하면, 잔존가치를 인정받고 감가 부담 없이 신차로 갈아탈 수
              있어요.
            </div>
          </div>
        </div>
      </div>

      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '280ms' })}>
        <div className="rt-dep-swap">
          <div className="rt-dep-swap-cell">
            <div className="rt-dep-swap-v">{won(d.now)}</div>
            <div className="rt-dep-swap-l">현재 시세</div>
          </div>
          <div className="rt-dep-swap-cell">
            <div className="rt-dep-swap-v">{won(d.after3)}</div>
            <div className="rt-dep-swap-l">3년 후 예상</div>
          </div>
          <div className="rt-dep-swap-cell">
            <div className="rt-dep-swap-v gold">−{won(d.drop3)}</div>
            <div className="rt-dep-swap-l">예상 감가 손실</div>
          </div>
        </div>
        <p className="rt-fnote" style={{ padding: '12px 0 0' }}>
          ※ 엔카·KB 시세 통계 기반 추정값으로 실제 매입가와 다를 수 있어요.
          {corp ? ' 법인은 전환 시 비용처리 혜택도 함께 검토해 드려요.' : ''}
        </p>
      </div>
    </div>
  );
}

export default function DiagnosisReportPreview() {
  const brands = Array.from(new Set(RT_CATALOG.map((c) => c.brand)));

  const [step, setStep] = useState<Step>('form');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [mile, setMile] = useState('mid');
  const [owner, setOwner] = useState('ind');
  const [age, setAge] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [sheet, setSheet] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocked(false);
    const t = setTimeout(() => setLocked(true), 900);
    return () => clearTimeout(t);
  }, [step]);

  const models = RT_CATALOG.filter((c) => c.brand === brand);
  const car = RT_CATALOG.find((c) => c.id === model) ?? null;
  const ready = Boolean(car && year);

  const go = (s: Step) => {
    setStep(s);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-page="deprec">
        <div className={'rt-scroll' + (locked ? ' rt-anim-lock' : '')} ref={scrollRef}>
          <RtTopNav title="감가상각 분석" backHref="/diagnosis" />

          {step === 'form' ? (
            <>
              <div className="rt-fhead">
                <p className="rt-feyebrow">감가상각 분석</p>
                <h1 className="rt-ftitle">내 차, 지금 얼마일까요?</h1>
                <p className="rt-fsub">
                  차량 정보를 입력하면 현재 시세와 감가 추이, 전환 최적 시점을 분석해 드려요.
                </p>
              </div>

              <div className="rt-fcard">
                <p className="rt-fcard-t">차량 정보 입력</p>
                <div className="rt-ffield">
                  <span className="rt-flabel">브랜드</span>
                  <select
                    className="rt-fselect"
                    value={brand}
                    onChange={(e) => {
                      setBrand(e.target.value);
                      setModel('');
                    }}
                  >
                    <option value="">브랜드 선택</option>
                    {brands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rt-ffield">
                  <span className="rt-flabel">모델</span>
                  <select
                    className="rt-fselect"
                    value={model}
                    disabled={!brand}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    <option value="">{brand ? '모델 선택' : '브랜드를 먼저 선택하세요'}</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.model}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rt-ffield">
                  <span className="rt-flabel">연식</span>
                  <select
                    className="rt-fselect"
                    value={year}
                    onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">연식 선택</option>
                    {DP_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}년식
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rt-fcard">
                <p className="rt-fcard-t">
                  주행거리 구간 <span>현재 주행거리 기준</span>
                </p>
                <div className="rt-fpill-3">
                  {DP_MILEAGE.map((m) => (
                    <button
                      key={m.v}
                      className={'rt-fpill' + (mile === m.v ? ' is-on' : '')}
                      onClick={() => setMile(m.v)}
                    >
                      {m.label}
                      <span>{m.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rt-fcard">
                <p className="rt-fcard-t">사업자 여부</p>
                <div className="rt-fpills" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
                  {DP_OWNER.map((o) => (
                    <button
                      key={o.v}
                      className={'rt-fpill' + (owner === o.v ? ' is-on' : '')}
                      style={{ textAlign: 'center' }}
                      onClick={() => setOwner(o.v)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rt-fcard">
                <p className="rt-fcard-t">
                  운전자 연령대 <span>선택 — 전환 견적 참고</span>
                </p>
                <div className="rt-fpills" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
                  {DP_AGES.map((a) => (
                    <button
                      key={a.v}
                      className={'rt-fpill' + (age === a.v ? ' is-on' : '')}
                      style={{ textAlign: 'center' }}
                      onClick={() => setAge(a.v)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="rt-fnote">
                * 차량 선택 후 시세 통계로 감가 곡선을 자동 산출해요. 개인정보는 수집하지 않아요.
              </p>
            </>
          ) : (
            car &&
            year !== '' && <DepResult car={car} year={year} mile={mile} owner={owner} />
          )}

          <div className="rt-bar" style={cssVar({ '--rt-accent': ACCENT })}>
            <div className="rt-bar-inner">
              {step === 'form' ? (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="rt-gold"
                  disabled={!ready}
                  onClick={() => go('result')}
                >
                  진단 시작
                </Button>
              ) : (
                <div className="rt-bar-row">
                  <button
                    className="rt-bar-call"
                    onClick={() => go('form')}
                    style={{ cursor: 'pointer', background: '#fff' }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                    다시
                  </button>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="rt-gold"
                    onClick={() => setSheet(true)}
                  >
                    장기렌트로 갈아타기 상담
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
