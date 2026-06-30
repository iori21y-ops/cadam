'use client';

// 차종 추천 진단 — 리뉴얼 미리보기 (타깃 /diagnosis/vehicle)
// 원본: _design_ref/diagnosis-app.jsx (+ rt-diagnosis.css / rt-quote.css) · 감가 모델은 _design_ref/dep-data.jsx
// 이식 규칙: window 전역 → 모듈(import), React.* 훅 → 표준 import, CadamDS.Button → @/components/ui/Button,
//   디바이스 토글/TweaksPanel/personalize/image-slot 제외(색상 플레이스홀더 div 로 대체).
//   ※ 설문(diagnosis_config)·결과 저장(diagnosis_reports) 실연동 대신 프리뷰는 로컬 로직(./data) 유지.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RtTopNav } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { RtIconSpark, RtIconCompare, RtIconLightning } from '@/components/rentailor/RtIcons';
import { FUEL, type Car } from '@/lib/rentailor/catalog';
import {
  DQ,
  DG_ORDER,
  diagnose,
  rtDepAnalysis,
  type AnswerKey,
  type Answers,
  type DgStep,
  type DqQuestion,
  type ScoredCar,
} from './data';
import './diagnosis.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

// 차량 이미지 표준은 프리뷰 단계에서 색상 플레이스홀더로 대체 (image-slot 제외)
function MediaPlaceholder({ label }: { label: string }) {
  return <span aria-hidden="true">{label}</span>;
}

// ── 상태 머신 훅 ─────────────────────────────────────────────
interface Flow {
  step: DgStep;
  dir: 'fwd' | 'back';
  ans: Answers;
  go: (next: DgStep, dir?: 'fwd' | 'back') => void;
  next: () => void;
  back: () => void;
  pick: (key: AnswerKey, v: string) => void;
  reset: () => void;
}

function useDiagnose(scrollRef: React.RefObject<HTMLDivElement | null>): Flow {
  const [step, setStep] = useState<DgStep>('intro');
  const [ans, setAns] = useState<Answers>({});
  const dirRef = useRef<'fwd' | 'back'>('fwd');

  const go = useCallback(
    (next: DgStep, dir: 'fwd' | 'back' = 'fwd') => {
      dirRef.current = dir;
      setStep(next);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    },
    [scrollRef],
  );
  const idx = DG_ORDER.indexOf(step);
  const next = useCallback(() => {
    if (idx < DG_ORDER.length - 1) go(DG_ORDER[idx + 1]);
  }, [idx, go]);
  const back = useCallback(() => {
    if (idx > 0) go(DG_ORDER[idx - 1], 'back');
  }, [idx, go]);
  const pick = useCallback(
    (key: AnswerKey, v: string) => {
      setAns((p) => ({ ...p, [key]: v }));
      window.setTimeout(next, 240);
    },
    [next],
  );
  const reset = useCallback(() => {
    setAns({});
    go('intro');
  }, [go]);

  return { step, dir: dirRef.current, ans, go, next, back, pick, reset };
}

// ── 진행 바 ──────────────────────────────────────────────────
function DgProgress({ flow }: { flow: Flow }) {
  const qIdx = DQ.findIndex((q) => q.key === flow.step);
  if (qIdx < 0) return null;
  const pct = (qIdx + 1) / DQ.length;
  return (
    <div className="rt-qprogress">
      <button className="rt-qback" onClick={flow.back} aria-label="이전 단계">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div className="rt-qtrack">
        <div className="rt-qfill" style={{ width: pct * 100 + '%' }}></div>
      </div>
      <span className="rt-qstepn">
        {qIdx + 1}/{DQ.length}
      </span>
    </div>
  );
}

// ── 옵션 카드 ────────────────────────────────────────────────
function DgOption({ on, onClick, label, sub }: { on: boolean; onClick: () => void; label: string; sub?: string }) {
  return (
    <button className={'rt-opt' + (on ? ' is-on' : '')} onClick={onClick} style={cssVar({ '--rt-accent': ACCENT })}>
      <span className="rt-opt-main">
        <span className="rt-opt-label">{label}</span>
        {sub && <span className="rt-opt-sub">{sub}</span>}
      </span>
      <span className="rt-opt-check">
        <svg viewBox="0 0 12 12" width="13" height="13">
          <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

// ── 인트로 ───────────────────────────────────────────────────
function DgIntro() {
  const feats = [
    { Ic: RtIconSpark, t: '5가지 질문으로 정밀 분석', d: '사용 목적·인원·주행·예산까지' },
    { Ic: RtIconCompare, t: '20개 차종에서 딱 맞는 추천', d: '1순위 차량과 대안까지 한 번에' },
    { Ic: RtIconLightning, t: '30초면 충분해요', d: '가입·전화번호 없이 바로 확인' },
  ];
  return (
    <div className="rt-qin rt-dhero-intro">
      <span className="rt-dbadge">
        <i></i> AI 맞춤 진단
      </span>
      <h1 className="rt-dhero-title">
        몇 가지만 답하면
        <br />
        <em>내 차</em>를 찾아드려요
      </h1>
      <p className="rt-dhero-desc">양복 맞추듯, 라이프스타일에 딱 맞는 장기렌트 차량을 AI가 분석해 추천해 드려요.</p>
      <div className="rt-dfeats">
        {feats.map((f, i) => (
          <div className="rt-dfeat" key={i}>
            <span className="rt-dfeat-ic">
              <f.Ic size={22} />
            </span>
            <span>
              <span className="rt-dfeat-t">{f.t}</span>
              <span className="rt-dfeat-d" style={{ display: 'block' }}>
                {f.d}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 분석 중 ──────────────────────────────────────────────────
function DgAnalyzing({ flow }: { flow: Flow }) {
  useEffect(() => {
    const t = window.setTimeout(() => flow.go('result'), 1700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rows = ['라이프스타일 조건 분석', '20개 차종 적합도 비교', '예산 맞춤 견적 산출'];
  return (
    <div className="rt-dload">
      <div className="rt-dload-ring"></div>
      <p className="rt-dload-t">AI가 분석하고 있어요</p>
      <p className="rt-dload-d">
        12,800건의 견적 데이터로
        <br />
        가장 잘 맞는 차를 찾는 중이에요.
      </p>
      <div className="rt-dload-list">
        {rows.map((t, i) => (
          <div className={'rt-dload-row r' + (i + 1)} key={i}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 감가 등급 카드 ───────────────────────────────────────────
function DgDepCard({ car }: { car: Car }) {
  const d = rtDepAnalysis(car);
  return (
    <>
      <div className="rt-dgrade">
        <div className="rt-dgrade-head">
          <span className="rt-dgrade-badge" style={cssVar({ '--g': d.color })}>
            {d.grade}
          </span>
          <div>
            <div className="rt-dgrade-label">{d.label}</div>
            <div className="rt-dgrade-sub">{d.desc}</div>
          </div>
        </div>
        <div className="rt-dgrade-bars">
          <div className="rt-dgrade-row">
            <span className="rt-dgrade-rk">3년 후 예상 잔존가치</span>
            <span className="rt-dgrade-rv" style={{ color: d.color }}>
              {d.retentionPct}%
            </span>
          </div>
          <div className="rt-dgrade-track">
            <div className="rt-dgrade-fill" style={{ width: d.retentionPct + '%', background: d.color }}></div>
            <div className="rt-dgrade-avg" style={{ left: d.segAvgPct + '%' }}></div>
          </div>
          <div className="rt-dgrade-legend">
            <span>신차가 대비 −{d.depPct}% 감가</span>
            <span className={'rt-dgrade-delta ' + (d.betterThanAvg ? 'up' : 'down')}>
              동급 평균 {d.betterThanAvg ? '+' : ''}
              {d.deltaPts}%p
            </span>
          </div>
        </div>
        <div className="rt-dgrade-why">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16v-4M12 8h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <span>
            {d.betterThanAvg ? (
              <>
                동급 평균보다 가치가 <b>잘 유지</b>돼요. 되팔 때 유리하고, 잔존가치가 높아 <b>장기렌트료도 낮게</b> 책정돼요.
              </>
            ) : (
              <>
                감가가 <b>빠른 편</b>이라 직접 사면 손실이 커요. 감가 리스크가 없는 <b>장기렌트가 특히 유리</b>한 차예요.
              </>
            )}
          </span>
        </div>
      </div>
      {/* 시세·감가 추이 상세는 감가상각 분석 프리뷰로 (report 페이지는 id 파라미터 미수신 — rule 6 외 링크) */}
      <a className="rt-dgrade-link" href="/diagnosis-report-preview">
        이 차 시세·감가 추이 자세히 보기
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </a>
    </>
  );
}

// ── 결과 ─────────────────────────────────────────────────────
function DgResult({ ranked }: { ranked: ScoredCar[] }) {
  const top = ranked[0];
  const alts = ranked.slice(1, 3);
  return (
    <div className="rt-qresult">
      <div className="rt-fade-up" style={cssVar({ '--d': '0ms' })}>
        <p className="rt-qresult-kicker">AI 분석 완료 · 적합도 {top.match}%</p>
        <h2 className="rt-qresult-title">이 차를 추천해요</h2>
      </div>

      <div className="rt-drec rt-fade-up" style={cssVar({ '--d': '70ms', '--hue': top.car.hue, marginTop: 18 })}>
        <div className="rt-drec-media">
          <MediaPlaceholder label={top.car.brand + ' ' + top.car.model} />
          <span className="rt-drec-match">
            AI 적합도 <b>{top.match}%</b>
          </span>
          <span className="rt-drec-rank">1순위 추천</span>
        </div>
        <div className="rt-drec-body">
          <div className="rt-drec-brand">
            {top.car.brand} · {FUEL[top.car.fuel].label}
          </div>
          <div className="rt-drec-name">{top.car.model}</div>
          <div className="rt-drec-seg">{top.car.segLabel}</div>
          <div className="rt-drec-reasons">
            {top.reasons.map((rs, i) => (
              <div className="rt-drec-reason" key={i}>
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7" />
                </svg>
                {rs}
              </div>
            ))}
          </div>
          <div className="rt-drec-foot">
            <div>
              <div className="rt-drec-price-k">월 렌트료</div>
              <div className="rt-drec-price">
                <span>월</span>
                <b>{top.car.from}</b>
                <span>만원~</span>
              </div>
            </div>
            <a className="rt-drec-link" href={`/cars-detail-preview/${top.car.id}`}>
              상세 보기
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '120ms' })}>
        <h3 className="rt-qblock-t">이 차의 감가 등급</h3>
        <DgDepCard car={top.car} />
      </div>

      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '190ms' })}>
        <h3 className="rt-qblock-t">이런 차도 잘 맞아요</h3>
        <div className="rt-qcars">
          {alts.map((it) => {
            const dep = rtDepAnalysis(it.car);
            return (
              <a className="rt-qcar" key={it.car.id} href={`/cars-detail-preview/${it.car.id}`} style={cssVar({ '--hue': it.car.hue })}>
                <div className="rt-qcar-thumb">
                  <MediaPlaceholder label={it.car.model.replace(/\s*\(.*\)/, '')} />
                </div>
                <div className="rt-qcar-meta">
                  <div className="rt-qcar-brand">
                    {it.car.brand} · 적합도 {it.match}%
                  </div>
                  <div className="rt-qcar-name">{it.car.model}</div>
                  <div className="rt-qcar-seg">
                    {it.car.segLabel} · 감가 <b style={{ color: dep.color }}>{dep.grade}</b>
                  </div>
                </div>
                <div className="rt-qcar-price">
                  <b>월 {it.car.from}</b>
                  <span>만원~</span>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '230ms' })}>
        <div className="rt-qtrust">
          <div className="rt-qtrust-cell">
            <span className="rt-qtrust-v">9곳</span>
            <span className="rt-qtrust-l">제휴 캐피탈</span>
          </div>
          <div className="rt-qtrust-cell">
            <span className="rt-qtrust-v">10분</span>
            <span className="rt-qtrust-l">평균 응답</span>
          </div>
          <div className="rt-qtrust-cell">
            <span className="rt-qtrust-v">무료</span>
            <span className="rt-qtrust-l">진단·상담</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 질문 단계 셸 ─────────────────────────────────────────────
function DgQuestion({ q, flow }: { q: DqQuestion; flow: Flow }) {
  return (
    <div className="rt-qin rt-qbody" key={q.key}>
      <p className="rt-qeyebrow">{q.eyebrow}</p>
      <h2 className="rt-qtitle">{q.title}</h2>
      {q.desc && <p className="rt-qdesc">{q.desc}</p>}
      <div className="rt-qcontent">
        <div className="rt-opts">
          {q.opts.map((o) => (
            <DgOption key={o.v} on={flow.ans[q.key] === o.v} label={o.label} sub={o.sub} onClick={() => flow.pick(q.key, o.v)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 하단 바 ──────────────────────────────────────────────────
function DgBottomBar({ flow, onConsult }: { flow: Flow; onConsult: () => void }) {
  if (flow.step === 'analyzing') return null;
  let content: React.ReactNode;
  if (flow.step === 'intro') {
    content = (
      <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={flow.next}>
        AI 진단 시작하기
      </Button>
    );
  } else if (flow.step === 'result') {
    content = (
      <div className="rt-bar-row">
        <button className="rt-bar-call" onClick={flow.reset} style={{ cursor: 'pointer', background: '#fff' }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          다시 진단
        </button>
        {/* TODO(§3.4C): consultations 단일 insert 연결점 (name·phone·consent + source=inflow_page + 진단결과 context/diagnosis_reports FK). 현재는 결과 렌더만, POST 미연동. */}
        <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={onConsult}>
          추천 차로 상담 신청
        </Button>
      </div>
    );
  } else {
    const q = DQ.find((x) => x.key === flow.step);
    const ok = Boolean(q && flow.ans[q.key]);
    content = (
      <Button variant="primary" size="lg" fullWidth disabled={!ok} onClick={flow.next}>
        다음
      </Button>
    );
  }
  return (
    <div className="rt-bar" style={cssVar({ '--rt-accent': ACCENT })}>
      <div className="rt-bar-inner">{content}</div>
    </div>
  );
}

// ── 페이지 ───────────────────────────────────────────────────
export default function DiagnosisVehiclePreview() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const flow = useDiagnose(scrollRef);
  const [sheet, setSheet] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setLocked(false);
    const t = window.setTimeout(() => setLocked(true), 1000);
    return () => window.clearTimeout(t);
  }, [flow.step]);

  // 결과 랭킹은 한 번만 계산해 결과 카드/상담시트가 동일 1순위를 공유
  const ranked = useMemo<ScoredCar[] | null>(() => {
    if (flow.step !== 'result') return null;
    return diagnose(flow.ans);
  }, [flow.step, flow.ans]);
  const topCar: Car | null = ranked ? ranked[0].car : null;

  const question = DQ.find((x) => x.key === flow.step);

  let body: React.ReactNode;
  if (flow.step === 'intro') body = <DgIntro />;
  else if (flow.step === 'analyzing') body = <DgAnalyzing flow={flow} />;
  else if (flow.step === 'result' && ranked) body = <DgResult ranked={ranked} />;
  else if (question) body = <DgQuestion q={question} flow={flow} />;

  return (
    <div data-rt="diagnosis-vehicle-preview" className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-page="diagnosis">
        <div className={'rt-scroll' + (locked ? ' rt-anim-lock' : '')} ref={scrollRef}>
          {/* 진단 허브로 back (인트로만) — 질문 단계는 DgProgress 의 자체 back 사용 */}
          <RtTopNav title="차종 진단" backHref={flow.step === 'intro' ? '/diagnosis-preview' : undefined} />
          <DgProgress flow={flow} />
          <main className={(locked ? 'rt-anim-lock ' : '') + 'rt-qwrap' + (flow.dir === 'back' ? ' is-back' : '')}>{body}</main>
          <DgBottomBar flow={flow} onConsult={() => setSheet(true)} />
        </div>
      </div>
      {/* 상담 신청은 RtConsultSheet 목업(완료 화면만) — 실 POST 미연동. §3.4C 연결점은 DgBottomBar 결과 CTA 주석 참고. */}
      <RtConsultSheet open={sheet} onClose={() => setSheet(false)} car={topCar} priceLabel={topCar ? '월 ' + topCar.from + '만원~' : ''} accent={ACCENT} />
    </div>
  );
}
