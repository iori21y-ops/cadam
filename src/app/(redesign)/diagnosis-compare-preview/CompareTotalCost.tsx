'use client';

// 총비용 탭 — 4스텝(가격대·고객유형·보험경력·연령) 진단 → 할부·리스·장기렌트 3년 총비용
// 원본: _design_ref/paycompare-app.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PC_STEPS, PC_CUST, calcPay, won, type PcAnswers } from './data';

const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

type Step = 'form' | 'result';

function PcOption({ on, label, sub, onClick }: { on: boolean; label: string; sub?: string; onClick: () => void }) {
  return (
    <button className={'rt-opt' + (on ? ' is-on' : '')} onClick={onClick}>
      <span className="rt-opt-main">
        <span className="rt-opt-label">{label}</span>
        {sub ? <span className="rt-opt-sub">{sub}</span> : null}
      </span>
      <span className="rt-opt-check">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      </span>
    </button>
  );
}

function PcResult({ price, cust, ins, age, accent }: { price: number; cust: string; ins: string; age: string; accent: string }) {
  const r = useMemo(() => calcPay(price, cust, ins, age), [price, cust, ins, age]);
  const sorted = r.methods.slice().sort((a, b) => a.total - b.total);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const max = worst.total;
  const save = worst.total - best.total;
  const custLabel = PC_CUST.find((x) => x.v === cust)?.label ?? '고객';
  const inclRows: [string, 'ins' | 'tax' | 'acq'][] = [
    ['보험 포함', 'ins'],
    ['세금 포함', 'tax'],
    ['취득세 포함', 'acq'],
  ];
  return (
    <div className="rt-qresult">
      <div className="rt-fade-up" style={cssVar({ '--d': '0ms' })}>
        <p className="rt-qresult-kicker">3년 총비용 기준 · {custLabel}</p>
        <h2 className="rt-qresult-title">결제 방식별 비교 결과</h2>
      </div>

      <div className="rt-pay-rec rt-fade-up" style={cssVar({ '--d': '60ms', marginTop: 18 })}>
        <p className="rt-pay-rec-k">가장 합리적인 방법</p>
        <p className="rt-pay-rec-h">
          <b>{best.name}</b>가 가장 부담이 적어요
        </p>
        <p className="rt-pay-rec-d">
          {worst.name} 대비 3년간 약 <b style={{ color: accent }}>{won(save)}</b> 절감 · 월 {best.monthly}만원 수준이에요
          {r.corp ? ' · 법인 비용처리까지 유리해요.' : '.'}
        </p>
      </div>

      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '140ms' })}>
        <h3 className="rt-qblock-t">3년 총비용</h3>
        <div className="rt-paybars">
          {r.methods.map((m) => (
            <div className={'rt-paybar' + (m.key === best.key ? ' best' : '')} key={m.key}>
              <div className="rt-paybar-top">
                <span className="rt-paybar-name">
                  {m.name}
                  {m.key === best.key && <span className="rt-paybar-best">최저</span>}
                </span>
                <span className="rt-paybar-val">{won(m.total)}</span>
              </div>
              <div className="rt-paybar-track">
                <div className="rt-paybar-fill" style={{ width: Math.round((m.total / max) * 100) + '%' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '220ms' })}>
        <h3 className="rt-qblock-t">월 납부 · 포함 항목</h3>
        <div className="rt-pay-break">
          <div className="rt-pay-brow h">
            <div className="rt-pay-bcell k">구분</div>
            {r.methods.map((m) => (
              <div className="rt-pay-bcell" key={m.key}>
                {m.name}
              </div>
            ))}
          </div>
          <div className="rt-pay-brow">
            <div className="rt-pay-bcell k">월 납부</div>
            {r.methods.map((m) => (
              <div className={'rt-pay-bcell' + (m.key === best.key ? ' on' : '')} key={m.key}>
                {m.monthly}만원
              </div>
            ))}
          </div>
          {inclRows.map(([label, k]) => (
            <div className="rt-pay-brow" key={k}>
              <div className="rt-pay-bcell k">{label}</div>
              {r.methods.map((m) => (
                <div className={'rt-pay-bcell' + (m.key === best.key ? ' on' : '')} key={m.key}>
                  {m.incl[k] ? '✓' : '—'}
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="rt-fnote" style={{ padding: '12px 0 0' }}>
          ※ 엔카 시세·법정 세율 기준의 추정값이며, 차량·신용·캐피탈사 조건에 따라 달라질 수 있어요.
        </p>
      </div>
    </div>
  );
}

export interface CompareTotalCostProps {
  accent: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onConsult: () => void;
}

export function CompareTotalCost({ accent, scrollRef, onConsult }: CompareTotalCostProps) {
  const [step, setStep] = useState<Step>('form');
  const [qi, setQi] = useState(0);
  const [ans, setAns] = useState<PcAnswers>({ price: null, cust: null, ins: null, age: null });
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setLocked(false);
    const t = setTimeout(() => setLocked(true), 900);
    return () => clearTimeout(t);
  }, [qi, step]);

  const total = PC_STEPS.length;
  const q = PC_STEPS[qi];
  const answered = ans[q.key] != null;
  const scrollTop = () => scrollRef.current?.scrollTo({ top: 0 });

  const next = () => {
    if (qi < total - 1) {
      setDir('fwd');
      setQi(qi + 1);
    } else {
      setStep('result');
    }
    scrollTop();
  };
  const stepBack = () => {
    if (step === 'result') {
      setStep('form');
      setDir('back');
      scrollTop();
    } else if (qi > 0) {
      setDir('back');
      setQi(qi - 1);
      scrollTop();
    }
  };
  const pick = (key: keyof PcAnswers, v: string | number) => {
    setAns((p) => ({ ...p, [key]: v }) as PcAnswers);
    setDir('fwd');
    setTimeout(next, 240);
  };
  const restart = () => {
    setAns({ price: null, cust: null, ins: null, age: null });
    setQi(0);
    setStep('form');
    setDir('back');
    scrollTop();
  };

  const canBack = step === 'result' || qi > 0;

  return (
    <>
      {step === 'form' ? (
        <div className="rt-qprogress">
          <button className="rt-qback" onClick={stepBack} aria-label="이전 단계" disabled={!canBack} style={{ opacity: canBack ? 1 : 0.4 }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="rt-qtrack">
            <div className="rt-qfill" style={{ width: ((qi + 1) / total) * 100 + '%' }}></div>
          </div>
          <span className="rt-qstepn">
            {qi + 1}/{total}
          </span>
        </div>
      ) : null}

      <main className={(locked ? 'rt-anim-lock ' : '') + 'rt-qwrap' + (dir === 'back' ? ' is-back' : '')}>
        {step === 'form' ? (
          <div className="rt-qin rt-qbody" key={q.key}>
            <p className="rt-qeyebrow">{q.eyebrow}</p>
            <h2 className="rt-qtitle">{q.title}</h2>
            {q.desc ? <p className="rt-qdesc">{q.desc}</p> : null}
            <div className="rt-qcontent">
              <div className="rt-opts">
                {q.opts.map((o) => (
                  <PcOption key={String(o.v)} on={ans[q.key] === o.v} label={o.label} sub={o.sub} onClick={() => pick(q.key, o.v)} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          ans.price != null &&
          ans.cust != null &&
          ans.ins != null &&
          ans.age != null && <PcResult price={ans.price} cust={ans.cust} ins={ans.ins} age={ans.age} accent={accent} />
        )}
      </main>

      <div className="rt-bar" style={cssVar({ '--rt-accent': accent })}>
        <div className="rt-bar-inner">
          {step === 'form' ? (
            <Button variant="primary" size="lg" fullWidth className="rt-gold" disabled={!answered} onClick={next}>
              {qi === total - 1 ? '총비용 비교하기' : '다음'}
            </Button>
          ) : (
            <div className="rt-bar-row">
              <button className="rt-bar-call" onClick={restart} style={{ cursor: 'pointer', background: '#fff' }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                다시
              </button>
              {/* TODO(§3.4C): consultations 단일 insert 연결점 (name·phone·consent + source=inflow_page +
                  context jsonb: 총비용 계산 입력(가격대·고객유형·보험경력·연령)과 방식별 3년 총비용 결과). 현재 결과 렌더만, POST 미연동. */}
              <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={onConsult}>
                이 조건으로 상담 신청
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
