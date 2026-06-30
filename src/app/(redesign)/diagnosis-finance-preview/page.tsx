'use client';

// 금융상품 진단 — 리뉴얼 미리보기 (타깃 /diagnosis/finance)
// 원본: _design_ref/finance-app.jsx (+ rt-quote.css / rt-diagnosis.css / rt-diag-tools.css)
// 이식 규칙: window 전역(React/CadamDS) → import, 데이터/계산은 co-located data.ts,
//   디바이스 토글·TweaksPanel·personalize 제외, image-slot 미사용(이 진단엔 차량 이미지 없음).
//   장식 아이콘은 RtIcons(32 viewBox·애니메이션 래퍼)와 사이즈가 안 맞아 인라인 SVG로 둔다.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RtTopNav } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { RtTermDefs } from '@/lib/rentailor/personalize';
import {
  FQ,
  FG_ORDER,
  FIN_CMP,
  FIN_CMP_CONTRAST,
  FIN_CMP_LABEL,
  diagnoseFinance,
  type FinAnswers,
  type FinIconName,
  type FinRanked,
  type FinStep,
} from './data';
import './finance.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

// ── 인라인 SVG 아이콘 ───────────────────────────────────────
function FinIcon({ name, size }: { name: FinIconName; size: number }) {
  if (name === 'shield')
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  if (name === 'contract')
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v4h4M9.5 13h5M9.5 16.5h5" />
      </svg>
    );
  if (name === 'car')
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14l1.6-4.4A2 2 0 0 1 7.5 8.3h9a2 2 0 0 1 1.9 1.3L20 14v4h-2.5v-1.5h-11V18H4z" />
        <circle cx="7.5" cy="16" r="1.2" />
        <circle cx="16.5" cy="16" r="1.2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5M12 17h.01" />
    </svg>
  );
}
function IcCheck({ size = 17 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

interface FinFeat {
  ic: React.ReactNode;
  t: string;
  d: string;
}
const FEATS: FinFeat[] = [
  {
    ic: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      </svg>
    ),
    t: '3가지 금융 방식 정밀 비교',
    d: '렌트·리스·할부',
  },
  {
    ic: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8M8 11h3M13 11h3M8 15h3M13 15h3" />
      </svg>
    ),
    t: '내 상황 5문항으로 진단',
    d: '기간·자금·소유·비용처리',
  },
  {
    ic: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.2 2" />
      </svg>
    ),
    t: '1분이면 충분해요',
    d: '가입·전화번호 없이 바로',
  },
];

// ── 플로우 상태 ─────────────────────────────────────────────
interface Flow {
  step: FinStep;
  idx: number;
  dir: 'fwd' | 'back';
  ans: FinAnswers;
  go: (next: FinStep, dir?: 'fwd' | 'back') => void;
  next: () => void;
  back: () => void;
  pick: (key: string, v: string) => void;
  reset: () => void;
}

function useFinance(scrollRef: React.RefObject<HTMLDivElement | null>): Flow {
  const [step, setStep] = useState<FinStep>('intro');
  const [ans, setAns] = useState<FinAnswers>({});
  const dirRef = useRef<'fwd' | 'back'>('fwd');

  const go = useCallback(
    (next: FinStep, dir: 'fwd' | 'back' = 'fwd') => {
      dirRef.current = dir;
      setStep(next);
      scrollRef.current?.scrollTo({ top: 0 });
    },
    [scrollRef],
  );

  const idx = FG_ORDER.indexOf(step);
  const next = () => {
    if (idx < FG_ORDER.length - 1) go(FG_ORDER[idx + 1]);
  };
  const back = () => {
    if (idx > 0) go(FG_ORDER[idx - 1], 'back');
  };
  const pick = (key: string, v: string) => {
    setAns((p) => ({ ...p, [key]: v }));
    setTimeout(next, 240);
  };
  const reset = () => {
    setAns({});
    go('intro');
  };
  return { step, idx, dir: dirRef.current, ans, go, next, back, pick, reset };
}

// ── 진행 바 ─────────────────────────────────────────────────
function FnProgress({ flow }: { flow: Flow }) {
  const qIdx = FQ.findIndex((q) => q.key === flow.step);
  if (qIdx < 0) return null;
  const pct = (qIdx + 1) / FQ.length;
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
        {qIdx + 1}/{FQ.length}
      </span>
    </div>
  );
}

function FnOption({ on, onClick, label, sub }: { on: boolean; onClick: () => void; label: string; sub?: string }) {
  return (
    <button className={'rt-opt' + (on ? ' is-on' : '')} onClick={onClick}>
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

function FnIntro() {
  return (
    <div className="rt-qin rt-dhero-intro">
      <span className="rt-dbadge">
        <i></i> AI 금융 진단
      </span>
      <h1 className="rt-dhero-title">
        나에게 맞는
        <br />
        <em>금융 방식</em>을 찾아드려요
      </h1>
      <p className="rt-dhero-desc">렌트·리스·할부 중 내 상황에 가장 유리한 방법을 AI가 1분 만에 진단해 드려요.</p>
      <div className="rt-dfeats">
        {FEATS.map((f) => (
          <div className="rt-dfeat" key={f.t}>
            <span className="rt-dfeat-ic">{f.ic}</span>
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

function FnAnalyzing({ flow }: { flow: Flow }) {
  useEffect(() => {
    const t = setTimeout(() => flow.go('result'), 1700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rows = ['보유 기간·자금 여력 분석', '3가지 금융 방식 적합도 비교', '비용처리·혜택 반영'];
  return (
    <div className="rt-dload">
      <div className="rt-dload-ring"></div>
      <p className="rt-dload-t">AI가 진단하고 있어요</p>
      <p className="rt-dload-d">
        내 상황에 가장 유리한
        <br />
        금융 방식을 찾는 중이에요.
      </p>
      <div className="rt-dload-list">
        {rows.map((t, i) => (
          <div className={'rt-dload-row r' + (i + 1)} key={t}>
            <IcCheck size={16} />
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

function FnResult({ flow }: { flow: Flow }) {
  const ranked: FinRanked[] = useMemo(() => diagnoseFinance(flow.ans), [flow.ans]);
  const top = ranked[0];
  const alts = ranked.slice(1, 3);
  const contrast = FIN_CMP_CONTRAST[top.key];
  return (
    <div className="rt-qresult">
      <div className="rt-fade-up" style={cssVar({ '--d': '0ms' })}>
        <p className="rt-qresult-kicker">AI 진단 완료 · 적합도 {top.match}%</p>
        <h2 className="rt-qresult-title">이 금융 방식을 추천해요</h2>
      </div>

      {/* A2 personalize: 이해도 레벨별 용어설명(초급 펼침/중급 접힘/고급 숨김) */}
      <RtTermDefs
        title="추천 결과 핵심 용어"
        items={[
          ['장기렌트', '차를 빌려 타고 보험·세금·정비를 월납에 포함.'],
          ['오토리스', '운용리스 — 비용처리·명의에 유리한 금융 상품.'],
          ['할부', '내 명의로 사고 매달 나눠 갚음. 만기 후 내 차.'],
          ['잔존가치', '계약 종료 시 차의 예상 가치. 높을수록 월납이 낮아져요.'],
          ['인수(만기 매입)', '계약 끝에 차를 사들이는 것. 인수가만큼 지불.'],
        ]}
      />

      <div className="rt-fin-hero rt-fade-up" style={cssVar({ '--d': '70ms', marginTop: 18 })}>
        <div className="rt-fin-top">
          <span className="rt-fin-ic">
            <FinIcon name={top.icon} size={28} />
          </span>
          <div>
            <div className="rt-fin-match">AI 적합도 {top.match}% · 1순위</div>
            <div className="rt-fin-name">{top.name}</div>
          </div>
        </div>
        <p className="rt-fin-tag">{top.tag}</p>
        <div className="rt-fin-pros">
          {top.pros.map((p) => (
            <span className="rt-fin-pro" key={p}>
              {p}
            </span>
          ))}
        </div>
        <div className="rt-fin-reasons">
          {top.pros.map((p) => (
            <div className="rt-fin-reason" key={p}>
              <IcCheck />
              {p}
            </div>
          ))}
        </div>
      </div>

      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '150ms' })}>
        <h3 className="rt-qblock-t">이런 방식도 고려해 보세요</h3>
        <div className="rt-hub-list" style={{ padding: 0, gap: 11 }}>
          {alts.map((it) => (
            <div className="rt-hub-card" key={it.key} style={{ cursor: 'default' }}>
              <span className="rt-hub-ic">
                <FinIcon name={it.icon} size={22} />
              </span>
              <span className="rt-hub-main">
                <span className="rt-hub-h">
                  <b>{it.name}</b>
                  <span className="rt-hub-new" style={{ background: 'var(--rt-soft)', color: 'var(--rt-sub)' }}>
                    적합도 {it.match}%
                  </span>
                </span>
                <span className="rt-hub-d">{it.tag}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '210ms' })}>
        <h3 className="rt-qblock-t">왜 {top.name}인가요? — 직접 비교</h3>
        <div className="rt-pay-break">
          <div className="rt-pay-brow h">
            <div className="rt-pay-bcell k">구분</div>
            <div className="rt-pay-bcell">{top.name}</div>
            <div className="rt-pay-bcell">{FIN_CMP_LABEL[contrast]}</div>
          </div>
          {FIN_CMP.map((r) => (
            <div className="rt-pay-brow" key={r.k}>
              <div className="rt-pay-bcell k">{r.k}</div>
              <div className="rt-pay-bcell on">{r[top.key]}</div>
              <div className="rt-pay-bcell">{r[contrast]}</div>
            </div>
          ))}
        </div>
        {/* 차종 무관 결제방식 비교 허브로 연결 (총비용·조건·약관 3탭) */}
        <a className="rt-fin-cmp-link" href="/diagnosis-compare-preview">
          3가지 방식 총비용·약관까지 전체 비교하기
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </a>
      </div>

      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '290ms' })}>
        <div className="rt-qtrust">
          <div className="rt-qtrust-cell">
            <span className="rt-qtrust-v">6곳</span>
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

function FnQuestion({ flow }: { flow: Flow }) {
  const q = FQ.find((x) => x.key === flow.step);
  if (!q) return null;
  return (
    <div className="rt-qin rt-qbody" key={q.key}>
      <p className="rt-qeyebrow">{q.eyebrow}</p>
      <h2 className="rt-qtitle">{q.title}</h2>
      {q.desc && <p className="rt-qdesc">{q.desc}</p>}
      <div className="rt-qcontent">
        <div className="rt-opts">
          {q.opts.map((o) => (
            <FnOption key={o.v} on={flow.ans[q.key] === o.v} label={o.label} sub={o.sub} onClick={() => flow.pick(q.key, o.v)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FnBottomBar({ flow, onConsult }: { flow: Flow; onConsult: () => void }) {
  if (flow.step === 'analyzing') return null;
  let content: React.ReactNode;
  if (flow.step === 'intro') {
    content = (
      <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={flow.next}>
        금융 진단 시작하기
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
          다시
        </button>
        {/* TODO(§3.4C): consultations 단일 insert 연결점 (name·phone·consent + source=inflow_page +
            진단 결과 context jsonb: 추천 금융방식·5문항 답변). 현재는 결과 렌더만, POST 미연동. 상담은 RtConsultSheet(목업). */}
        <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={onConsult}>
          이 방식으로 상담 신청
        </Button>
      </div>
    );
  } else {
    const q = FQ.find((x) => x.key === flow.step);
    content = (
      <Button variant="primary" size="lg" fullWidth disabled={!(q && flow.ans[q.key])} onClick={flow.next}>
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

export default function DiagnosisFinancePreview() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const flow = useFinance(scrollRef);
  const [sheet, setSheet] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setLocked(false);
    const t = setTimeout(() => setLocked(true), 1000);
    return () => clearTimeout(t);
  }, [flow.step]);

  let body: React.ReactNode;
  if (flow.step === 'intro') body = <FnIntro />;
  else if (flow.step === 'analyzing') body = <FnAnalyzing flow={flow} />;
  else if (flow.step === 'result') body = <FnResult flow={flow} />;
  else body = <FnQuestion flow={flow} />;

  return (
    <div data-rt="diagnosis-finance-preview" className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-page="finance">
        <div className="rt-scroll" ref={scrollRef}>
          {/* 인트로에서만 상단 back(진단 허브로). 질문 단계 back은 진행바의 rt-qback가 담당. */}
          <RtTopNav title="상품 진단" backHref={flow.step === 'intro' ? '/diagnosis-preview' : undefined} />
          <FnProgress flow={flow} />
          <main className={(locked ? 'rt-anim-lock ' : '') + 'rt-qwrap' + (flow.dir === 'back' ? ' is-back' : '')}>{body}</main>
          <FnBottomBar flow={flow} onConsult={() => setSheet(true)} />
        </div>
      </div>
      <RtConsultSheet open={sheet} onClose={() => setSheet(false)} car={null} accent={ACCENT} />
    </div>
  );
}
