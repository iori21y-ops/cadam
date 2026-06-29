'use client';

// HomePreview.tsx — Rentailor 랜딩 리뉴얼 + 견적 위저드 (타깃 운영 /)
// 원본 프로토타입: _design_ref/app.jsx + sections.jsx + wizard.jsx (window 전역 → 모듈 import)
// ⚠️ 제출(submit)은 실제 상담 API(/api/consultation)에 연결된다. 렌더/마운트 시 자동 POST 없음 —
//    사용자가 form 단계에서 "비대면 상담 신청" 버튼을 눌렀을 때만 fetch 가 발생한다.
// 제외(프로토타입 전용): 디바이스 토글/ControlBar/TweaksPanel, 개인화(RtPersonalizeIcon),
//    RtPopularBand(window.rtSalesRanked 데이터 없음), image-slot(→ 색상 placeholder div).

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { SelectCard } from '@/components/ui/SelectCard';
import {
  RtIconConsult,
  RtIconCompare,
  RtIconLightning,
  RtIconContract,
} from '@/components/rentailor/RtIcons';
import {
  RT_BUDGETS,
  RT_CLASSES,
  RT_CARS,
  RT_COMPARE,
  RT_FAQS,
  rtEstimate,
} from '@/lib/rentailor/landing-data';
import { RT_CATALOG, FUEL, type Car } from '@/lib/rentailor/catalog';
import { rtMarkConsulted } from '@/lib/rentailor/guest-adapter';
import { useSalesRank } from '@/lib/rentailor/useSalesRank';
import { RtPersonalizeIcon } from '@/lib/rentailor/personalize';
import { LogoAnimated } from '@/components/icons/LogoAnimated';
import './landing.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties =>
  vars as React.CSSProperties;

const STEPS_ORDER = ['intro', 'budget', 'class', 'form', 'result'] as const;
type Step = (typeof STEPS_ORDER)[number];
const PROGRESS: Partial<Record<Step, number>> = { budget: 1 / 3, class: 2 / 3, form: 1 };

// ── 신뢰 슬라이딩 레일 콘텐츠 (원본 sections.jsx RT_TRUST 이식; photo 카드는 색상 placeholder) ──
type TrustCard =
  | { t: 'promo'; tag: string; title: string; desc: string }
  | { t: 'stat'; v: string; l: string; subs: string[] }
  | { t: 'photo'; id: string; cap: string; ph: string }
  | { t: 'review'; q: string; n: string };

const RT_TRUST: TrustCard[] = [
  { t: 'promo', tag: '이달의 프로모션', title: '첫 달 렌트료 50% 할인', desc: '선착순 100명 · 블랙박스 무상 장착' },
  { t: 'stat', v: '12,800+', l: '누적 상담·계약', subs: ['재계약률 92%', '제휴 캐피탈 9곳', '평균 응답 10분'] },
  { t: 'photo', id: 'rt-proof-kakao', cap: '카카오톡 실시간 상담', ph: '카톡 상담 캡처' },
  { t: 'review', q: '매달 부담이 확 줄었어요. 보험·정비까지 한 번에 끝.', n: '김○○ 고객님 · 쏘렌토 48개월' },
  { t: 'photo', id: 'rt-proof-quote', cap: '실제 발급 견적서', ph: '견적서 사진' },
  { t: 'photo', id: 'rt-proof-contract', cap: '실 계약 인증서', ph: '실 계약 인증 사진' },
];

// ── §3.4C 단일 consultations 매핑 — 기존 POST /api/consultation 재사용. ───────────
// 공통: name·phone·privacyAgreed / 맥락(budget 경로): selectionPath·monthlyBudget·contractMonths
// 비정규(차급 cls·예산 라벨) → vehicleAnswers(record) → 서버가 lead_dimensions 로 흡수.
// 출처(inflow_page·utm·referrer)는 서버가 쿠키에서 읽음(바디 불필요, §14.1 ⚠ 정합).
async function submitConsultation(args: {
  name: string;
  phone: string;
  budgetKey: string | null;
  clsKey: string | null;
  term: number;
}): Promise<{ ok: boolean; duplicate?: boolean }> {
  const budget = RT_BUDGETS.find((b) => b.key === args.budgetKey);
  const cls = RT_CLASSES.find((c) => c.key === args.clsKey);
  const vehicleAnswers: Record<string, { value: string; label: string }> = {
    term: { value: String(args.term), label: `${args.term}개월` },
  };
  if (budget) vehicleAnswers.budget = { value: budget.key, label: budget.label };
  if (cls) vehicleAnswers.class = { value: cls.key, label: cls.label };
  const payload = {
    name: args.name.trim(),
    phone: args.phone.trim(),
    privacyAgreed: true as const,
    selectionPath: 'budget' as const,
    monthlyBudget: budget?.mid ?? null, // 만원 단위(예산 구간 대표값) — 운영 정합 시 단위 확인
    contractMonths: args.term,
    stepCompleted: 3,
    vehicleAnswers,
  };
  try {
    const res = await fetch('/api/consultation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true };
    if (res.status === 409) return { ok: true, duplicate: true }; // 이미 접수 = 전환 완료로 간주
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

// ── 상태 훅 ──────────────────────────────────────────────────
function useQuoteFlow() {
  const [step, setStep] = useState<Step>('intro');
  const [budget, setBudget] = useState<string | null>(null);
  const [cls, setCls] = useState<string | null>(null);
  const [term, setTerm] = useState(36);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agree, setAgree] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirRef = useRef<'fwd' | 'back'>('fwd');
  const scrollRef = useRef<HTMLDivElement>(null);

  const go = (next: Step, dir: 'fwd' | 'back' = 'fwd') => {
    dirRef.current = dir;
    setStep(next);
    // deprec 프레임: 스크롤러는 .rt-page 가 아니라 .rt-scroll 이다 (ref 기반으로 최상단 이동)
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  };

  const idx = STEPS_ORDER.indexOf(step);
  const next = () => { if (idx < STEPS_ORDER.length - 1) go(STEPS_ORDER[idx + 1]); };
  const back = () => { if (idx > 0) go(STEPS_ORDER[idx - 1], 'back'); };

  const estimate = rtEstimate(budget ?? '', cls ?? '', term);
  const valid = Boolean(name.trim() && phone.trim() && agree);

  // 실 API 제출: 유효할 때만, 진행 중 재진입 가드. 성공/중복 → 게스트 가드 해제 후 결과로.
  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitConsultation({ name, phone, budgetKey: budget, clsKey: cls, term });
      if (res.ok) {
        rtMarkConsulted();
        go('result');
      } else {
        setError('상담 신청에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setBudget(null);
    setCls(null);
    setName('');
    setPhone('');
    setAgree(true);
    setError(null);
    setSubmitting(false);
    go('budget');
  };

  return {
    step, idx, go, next, back, dir: dirRef.current, scrollRef,
    budget, setBudget, cls, setCls, term, setTerm,
    name, setName, phone, setPhone, agree, setAgree,
    submitting, error, submit, reset, estimate, valid,
  };
}
type Flow = ReturnType<typeof useQuoteFlow>;

// ── 요약 ─────────────────────────────────────────────────────
function summary(flow: Flow) {
  const b = RT_BUDGETS.find((x) => x.key === flow.budget);
  const c = RT_CLASSES.find((x) => x.key === flow.cls);
  return [b && { k: '예산', v: b.label }, c && { k: '차급', v: c.label }].filter(Boolean) as {
    k: string;
    v: string;
  }[];
}

// ── 상단 네비 (LogoAnimated 로고 — 디자인 일치) ─────
function RtNav() {
  return (
    <header className="rt-nav">
      <div className="rt-nav-inner">
        <a className="rt-brand" href="#top" aria-label="Rentailor 홈">
          <LogoAnimated size={28} />
        </a>
        <nav className="rt-nav-links">
          <Link href="/terms-preview">이용약관</Link>
          <Link href="/privacy">개인정보</Link>
        </nav>
      </div>
      {/* 디자인 복원: 우측 상단 개인화 아이콘(FAB+패널) — 이해도·고객유형·계약여정 */}
      <RtPersonalizeIcon />
    </header>
  );
}

// ── 진행 표시 바 ─────────────────────────────────────────────
function RtProgress({ flow }: { flow: Flow }) {
  const pct = PROGRESS[flow.step];
  if (pct == null) return null;
  return (
    <div className="rt-progress">
      <button className="rt-progress-back" onClick={flow.back} aria-label="이전 단계">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div className="rt-progress-track">
        <div className="rt-progress-fill" style={{ width: pct * 100 + '%' }} />
      </div>
      <span className="rt-progress-step">{Math.round(pct * 3)}/3</span>
    </div>
  );
}

// ── 신뢰 슬라이딩 레일 (intro) ───────────────────────────────
function trustCard(c: TrustCard, key: number, n: number, N: number) {
  const count = <span className="rt-trust-count">{n}/{N}</span>;
  if (c.t === 'promo') {
    return (
      <div className="rt-trust-card rt-trust-promo" key={key}>
        <span className="rt-trust-promo-tag">{c.tag}</span>
        <p className="rt-trust-promo-title">{c.title}</p>
        <span className="rt-trust-promo-desc">{c.desc}</span>
        {count}
      </div>
    );
  }
  if (c.t === 'stat') {
    return (
      <div className="rt-trust-card rt-trust-stat" key={key}>
        <span className="rt-trust-v">{c.v}</span>
        <span className="rt-trust-l">{c.l}</span>
        <ul className="rt-trust-subs">{c.subs.map((s) => <li key={s}>{s}</li>)}</ul>
        {count}
      </div>
    );
  }
  if (c.t === 'review') {
    return (
      <div className="rt-trust-card rt-trust-review" key={key}>
        <div className="rt-trust-stars">★★★★★</div>
        <p className="rt-trust-quote">“{c.q}”</p>
        <span className="rt-trust-name">{c.n}</span>
        {count}
      </div>
    );
  }
  return (
    <div className="rt-trust-card rt-trust-photo" key={key}>
      <div className="rt-img-slot">{c.ph}</div>
      <span className="rt-trust-cap">{c.cap}</span>
      {count}
    </div>
  );
}

function RtTrustRail() {
  const railRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const N = RT_TRUST.length; // 원본 카드 수 (리스트는 2번 이어붙임 → 이음매 무seam)
    const HOLD = 3000; // 한 카드에 머무는 시간(ms)
    let i = 0;
    let resetT: ReturnType<typeof setTimeout> | undefined;
    let paused = false;
    const padL = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    const goTo = (idx: number, smooth: boolean) => {
      const c = el.children[idx] as HTMLElement | undefined;
      if (!c) return;
      el.scrollTo({ left: c.offsetLeft - padL, behavior: smooth ? 'smooth' : 'auto' });
    };
    const stepFn = () => {
      if (paused) return;
      i += 1;
      goTo(i, true);
      if (i >= N) {
        resetT = setTimeout(() => { i = 0; goTo(0, false); }, 650);
      }
    };
    const timer = setInterval(stepFn, HOLD);
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('pointerdown', pause);
    window.addEventListener('pointerup', resume);
    return () => {
      clearInterval(timer);
      if (resetT) clearTimeout(resetT);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('pointerdown', pause);
      window.removeEventListener('pointerup', resume);
    };
  }, []);
  const loop = RT_TRUST.concat(RT_TRUST);
  return (
    <div className="rt-trust">
      <p className="rt-trust-title">진행 중인 <b>렌테일러 혜택</b></p>
      <div className="rt-trust-rail" ref={railRef}>
        {loop.map((c, i) => trustCard(c, i, (i % RT_TRUST.length) + 1, RT_TRUST.length))}
      </div>
    </div>
  );
}

// ── 히어로 (intro 본문) ──────────────────────────────────────
// 디자인 복원: 이번 달 판매순위 밴드(TOP3). car_sales_monthly 실데이터(useSalesRank). 데이터 없으면 미렌더.
function RtPopularBand() {
  const { rows } = useSalesRank();
  const top = rows.slice(0, 3);
  if (!top.length) return null;
  return (
    <div style={{ margin: '6px 0 2px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0D1B2A' }}>
          이번 달 <b style={{ color: '#B07A2E' }}>가장 많이 고른 차</b>
        </p>
        <Link href="/popular-estimates" style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textDecoration: 'none' }}>전체 순위 →</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {top.map((r) => (
          <Link
            key={r.car.id}
            href={`/cars/${r.car.id}`}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2, padding: 12, border: '1px solid #e8eaee', borderRadius: 14, background: '#fff', textDecoration: 'none' }}
          >
            <span style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: '#C9A84C', color: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{r.rank}</span>
            <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{r.car.brand}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0D1B2A', lineHeight: 1.2 }}>{r.car.model.replace(/\s*\(.*\)/, '')}</span>
            <span style={{ marginTop: 4, fontSize: 13, color: '#0D1B2A', fontWeight: 700 }}>
              <em style={{ fontStyle: 'normal', fontSize: 11, color: '#9ca3af' }}>월 </em>{r.car.from}<i style={{ fontStyle: 'normal', fontSize: 11, color: '#9ca3af' }}>만원~</i>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RtHero() {
  const feats = [
    { Ic: RtIconConsult, label: '비대면 간편 상담' },
    { Ic: RtIconCompare, label: '리스·렌트·할부 맞춤 견적' },
    { Ic: RtIconLightning, label: '실시간 특가 차량 알림' },
    { Ic: RtIconContract, label: '약관까지 꼼꼼 비교' },
  ];
  return (
    <div className="rt-hero rt-step-in">
      <p className="rt-hero-eyebrow">리스 · 렌트 · 할부 한 번에 비교</p>
      <h1 className="rt-hero-title">
        차는 사지 말고,<br /><span className="rt-hero-em">빌려서</span> 타세요
      </h1>
      <p className="rt-hero-sub">
        리스·렌트·할부까지 한 번에 비교. 예산과 차급만 고르면 30초 만에 맞춤 견적을 받아보세요.
      </p>
      <div className="rt-feats">
        {feats.map((f, i) => (
          <div className="rt-feat rt-fade-up" style={cssVar({ '--d': i * 70 + 'ms' })} key={f.label}>
            <span className="rt-feat-ic"><f.Ic size={22} /></span>
            <span className="rt-feat-label">{f.label}</span>
          </div>
        ))}
      </div>
      <RtPopularBand />
      <RtTrustRail />
    </div>
  );
}

// ── 선택 카드 (DS SelectCard 래핑) ───────────────────────────
function Opt({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <SelectCard
      selected={selected}
      color={ACCENT}
      onClick={onClick}
      style={{
        background: selected ? 'rgba(201,168,76,.07)' : '#fff',
        borderColor: selected ? ACCENT : 'var(--rt-line)',
        boxShadow: selected ? '0 10px 30px rgba(201,168,76,.20)' : '0 2px 14px rgba(13,27,42,.05)',
      }}
    >
      {children}
    </SelectCard>
  );
}

function StepShell({
  eyebrow,
  title,
  desc,
  children,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rt-step-in rt-stepbody">
      <p className="rt-step-eyebrow">{eyebrow}</p>
      <h2 className="rt-step-title">{title}</h2>
      {desc && <p className="rt-step-desc">{desc}</p>}
      <div className="rt-step-content">{children}</div>
    </div>
  );
}

function LockMini({ color }: { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="10" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function OpenLockMini({ color }: { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="10" rx="2.5" />
      <path d="M8 10V6a4 4 0 0 1 7.5-1.9" />
    </svg>
  );
}
function CarMini() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13M5 13h14v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
      <circle cx="7.5" cy="15.5" r="0.6" /><circle cx="16.5" cy="15.5" r="0.6" />
    </svg>
  );
}
function ArrowMini() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// ── 상담 신청 폼 (게이트) ────────────────────────────────────
function FormStep({ flow }: { flow: Flow }) {
  const fmtPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return d.slice(0, 3) + '-' + d.slice(3);
    return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
  };
  const e = flow.estimate || { lo: 39, hi: 49, center: 44 };
  const cars = (() => {
    const m = RT_CARS.filter((c) => c.cls === flow.cls);
    return (m.length ? m : RT_CARS).slice().sort((a, b) => a.from - b.from).slice(0, 3);
  })();
  const teasers: { tag: string; body: React.ReactNode }[] = [
    {
      tag: '렌트 / 리스 / 할부 월 비용 비교',
      body: <span className="rt-teaser-amount">렌트 {e.lo} · 리스 {e.lo + 4} · 할부 {e.hi + 9}<em> 만원</em></span>,
    },
    { tag: `조건에 맞는 추천 차량 ${cars.length}대`, body: cars.map((c) => c.brand + ' ' + c.model).join(' · ') },
    { tag: '리스·렌트 계약 시 모르면 당하는 정보', body: '잔존가치 · 중도해지 위약금 · 보험 승계 · 명의·과태료 처리' },
    { tag: '실시간 특가 차량 알림', body: '이번 주 즉시 출고 특가 차량 · 한정 프로모션 안내' },
    { tag: '자주 묻는 질문', body: RT_FAQS[0].q },
  ];
  // 토스식 점진 노출: 이름 1자 이상 입력되면 연락처·동의·안내문 노출. (CTA는 valid=phone필수라 그 전엔 자동 비활성)
  const showContact = flow.name.trim().length > 0;
  return (
    <div className="rt-step-in rt-stepbody">
      <p className="rt-step-eyebrow">마지막 단계</p>
      <h2 className="rt-step-title">비대면 상담 받아보세요</h2>
      <p className="rt-step-desc">이름과 연락처만 남기면 리스·렌트·할부 견적을 한 번에 받아보고, 전문가가 1:1 맞춤 비교해 드려요.</p>
      <div className="rt-step-content">
        <div className="rt-chips">
          {summary(flow).map((s) => <span className="rt-chip" key={s.k}>{s.v}</span>)}
        </div>
        <form className="rt-form" onSubmit={(ev) => { ev.preventDefault(); void flow.submit(); }}>
          <label className="rt-field">
            <span className="rt-field-label">이름</span>
            <input className="rt-input" type="text" placeholder="홍길동" value={flow.name} onChange={(ev) => flow.setName(ev.target.value)} />
          </label>
          {showContact && (
            <label className="rt-field rt-reveal">
              <span className="rt-field-label">연락처</span>
              <input
                className="rt-input"
                type="tel"
                inputMode="numeric"
                placeholder="010-0000-0000"
                value={flow.phone}
                onFocus={() => { if (!flow.phone) flow.setPhone('010-'); }}
                onChange={(ev) => flow.setPhone(fmtPhone(ev.target.value))}
              />
            </label>
          )}
          {showContact && (
            <label className="rt-consent rt-reveal">
              <input type="checkbox" checked={flow.agree} onChange={(ev) => flow.setAgree(ev.target.checked)} />
              <span className="rt-consent-box" style={cssVar({ '--rt-accent': ACCENT })} aria-hidden="true">
                <svg viewBox="0 0 12 12" width="12" height="12">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="rt-consent-text">
                <Link href="/privacy" target="_blank" rel="noopener" onClick={(ev) => ev.stopPropagation()}>개인정보 처리방침</Link>에 동의합니다. <em>(필수)</em>
              </span>
            </label>
          )}
          <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
        </form>
        {showContact && <p className="rt-form-note rt-reveal">입력하신 정보는 상담 목적 외에 사용되지 않습니다.</p>}
        {flow.error && <p className="rt-form-error" role="alert">{flow.error}</p>}

        <div className="rt-teaser">
          <Link className="rt-afree" href="/popular-estimates-preview">
            <span className="rt-afree-ic"><CarMini /></span>
            <span className="rt-afree-main">
              <span className="rt-afree-eyebrow"><OpenLockMini /> 로그인 없이 · 바로 열람</span>
              <span className="rt-afree-title">인기 차종 바로 보기</span>
              <span className="rt-afree-sub">선택하신 예산·차급에 맞춰 바로 필터링해 드려요</span>
            </span>
            <span className="rt-afree-arrow"><ArrowMini /></span>
          </Link>
          <div className="rt-teaser-hd">
            <LockMini color={ACCENT} />
            <p>신청을 완료하면 아래 정보도 함께 열려요</p>
          </div>
          <div className="rt-teaser-grid">
            {teasers.map((t) => (
              <div className="rt-teaser-card" key={t.tag} aria-hidden="true">
                <span className="rt-teaser-tag">{t.tag}</span>
                <div className="rt-teaser-body">{t.body}</div>
                <div className="rt-teaser-pill"><LockMini /> 상담 신청 후 공개</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 추천 차량 카드 (.rt-vcard) · 클릭 시 차종 상세 프리뷰로 이동 ──
function recoBadges(c: Car): { label: string; cls: string }[] {
  const out: { label: string; cls: string }[] = [];
  if (c.best) out.push({ label: 'BEST', cls: 'rt-badge-best' });
  if (c.fuel === 'ev') out.push({ label: '전기차', cls: 'rt-badge-ev' });
  else if (c.fuel === 'hybrid') out.push({ label: '하이브리드', cls: 'rt-badge-low' });
  (c.badges || []).forEach((b) => {
    if (b === '전기차') return;
    if (b === '인기') out.push({ label: '인기', cls: 'rt-badge-hot' });
    else if (b === '최저가') out.push({ label: '최저가', cls: 'rt-badge-low' });
  });
  return out.slice(0, 3);
}

function RtRecoCard({ car }: { car: Car }) {
  const fuel = FUEL[car.fuel] || { label: '' };
  const isRange = car.fuel === 'ev';
  const badges = recoBadges(car);
  return (
    <Link className="rt-vcard" href={`/cars-detail-preview/${car.id}`} style={cssVar({ '--hue': car.hue })}>
      <div className="rt-vcard-media">
        <div className="rt-img-slot" style={{ background: `hsl(${car.hue} 42% 92%)` }}>
          {car.brand} {car.model}
        </div>
        {badges.length > 0 && (
          <div className="rt-vcard-badges">
            {badges.map((b, i) => <span className={'rt-badge ' + b.cls} key={i}>{b.label}</span>)}
          </div>
        )}
      </div>
      <div className="rt-vcard-body">
        <div className="rt-vcard-top">
          <span className="rt-vcard-brand">{car.brand}</span>
          <span className="rt-vcard-fuel" data-fuel={car.fuel}>{fuel.label}</span>
        </div>
        <h3 className="rt-vcard-name">{car.model}</h3>
        <p className="rt-vcard-seg">{car.segLabel}</p>
        <dl className="rt-vcard-specs">
          <div className="rt-vcard-spec">
            <dt>{isRange ? '1회 충전 주행' : '복합 연비'}</dt>
            <dd>{car.spec.eff}</dd>
          </div>
          <div className="rt-vcard-spec">
            <dt>최고 출력</dt>
            <dd>{car.spec.power}</dd>
          </div>
          <div className="rt-vcard-spec">
            <dt>승차 인원</dt>
            <dd>{car.spec.seatLabel || (car.spec.seats != null ? car.spec.seats + '인승' : '')}</dd>
          </div>
        </dl>
        <div className="rt-vcard-foot">
          <div>
            <div className="rt-vcard-price-k">월 렌트료</div>
            <div className="rt-vcard-price">
              <span className="rt-vcard-from">월</span>
              <span className="rt-vcard-num">{car.from}</span>
              <span className="rt-vcard-unit">만원~</span>
            </div>
          </div>
          <span className="rt-vcard-cta">
            자세히 보기
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── FAQ 아코디언 ─────────────────────────────────────────────
function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={'rt-faq' + (open ? ' is-open' : '')}>
      <button className="rt-faq-q" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rt-faq-chev">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className="rt-faq-a"><p>{a}</p></div>
    </div>
  );
}

// ── 결과 + 이어보기 ──────────────────────────────────────────
const CLS_TO_SEG: Record<string, string> = { compact: 'sedan', midsize: 'sedan', suv: 'suv', premium: 'premium' };
const BUDGET_BAND: Record<string, [number, number]> = { u40: [0, 45], '40_60': [40, 64], '60_80': [58, 84], o80: [78, 9999] };

function pickRecoCars(clsKey: string | null, budgetKey: string | null): Car[] {
  const all = RT_CATALOG;
  if (!all.length) return [];
  const seg = clsKey ? CLS_TO_SEG[clsKey] : undefined;
  let pool = seg ? all.filter((c) => c.seg === seg) : all.slice();
  if (!pool.length) pool = all.slice();
  const byPrice = (l: Car[]) => l.slice().sort((a, b) => a.from - b.from);
  const band = budgetKey ? BUDGET_BAND[budgetKey] : undefined;
  // 예산대에 맞는 차 우선, 부족하면 차급 내 가까운 가격으로 채워 3대
  let picked = byPrice(band ? pool.filter((c) => c.from >= band[0] && c.from <= band[1]) : pool);
  if (picked.length < 3) {
    const ids = new Set(picked.map((c) => c.id));
    picked = picked.concat(byPrice(pool.filter((c) => !ids.has(c.id))));
  }
  return picked.slice(0, 3);
}

function ResultStep({ flow }: { flow: Flow }) {
  const e = flow.estimate || { lo: 39, hi: 49, center: 44 };
  const cars = pickRecoCars(flow.cls, flow.budget);
  return (
    <div className="rt-step-in rt-stepbody rt-result">
      <div className="rt-result-hd rt-fade-up" style={cssVar({ '--d': '0ms' })}>
        <div className="rt-result-check" style={{ background: ACCENT }}>
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <p className="rt-result-kicker">신청 완료 · {flow.name || '고객'}님</p>
        <h2 className="rt-step-title">예상 월 렌탈료예요</h2>
      </div>

      <div className="rt-estimate rt-fade-up" style={cssVar({ '--d': '60ms' })}>
        <div className="rt-estimate-chips">
          {summary(flow).map((s) => <span className="rt-chip rt-chip-dark" key={s.k}>{s.v}</span>)}
        </div>
        <div className="rt-estimate-amount">
          <span className="rt-estimate-num">{e.lo}</span>
          <span className="rt-estimate-tilde">~</span>
          <span className="rt-estimate-num">{e.hi}</span>
          <span className="rt-estimate-unit">만원<em>/ 월</em></span>
        </div>
        <p className="rt-estimate-note">보험·자동차세·정비 포함 · 제휴 캐피탈 9곳 비교 기준</p>
        <p className="rt-estimate-sub">전담 매니저가 10분 내로 연락드려 가장 낮은 조건을 찾아드려요.</p>
      </div>

      {cars.length > 0 && (
        <div className="rt-cont rt-fade-up" style={cssVar({ '--d': '140ms' })}>
          <h3 className="rt-cont-title">조건에 맞는 추천 차량</h3>
          <div className="rt-cars">
            {cars.map((c) => <RtRecoCard key={c.id} car={c} />)}
          </div>
        </div>
      )}

      <div className="rt-cont rt-fade-up" style={cssVar({ '--d': '220ms' })}>
        <h3 className="rt-cont-title">사지 말고, 빌려서 타세요</h3>
        <div className="rt-compare">
          <div className="rt-compare-head">
            <div className="rt-compare-c0" />
            <div className="rt-compare-buy">구매</div>
            <div className="rt-compare-rent">장기렌터카</div>
          </div>
          {RT_COMPARE.map((r) => (
            <div className="rt-compare-row" key={r.label}>
              <div className="rt-compare-c0">{r.label}</div>
              <div className="rt-compare-buy">{r.buy}</div>
              <div className="rt-compare-rent">
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8.5l3 3 7-7" stroke={ACCENT} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {r.rent}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rt-cont rt-fade-up" style={cssVar({ '--d': '300ms' })}>
        <h3 className="rt-cont-title">자주 묻는 질문</h3>
        <div className="rt-faqs">
          {RT_FAQS.map((f, i) => <Faq key={i} q={f.q} a={f.a} />)}
        </div>
      </div>
    </div>
  );
}

// ── 단계 본문 ────────────────────────────────────────────────
function QuoteBody({ flow }: { flow: Flow }) {
  const { step } = flow;
  let stepInner: React.ReactNode = null;
  if (step === 'budget') {
    stepInner = (
      <StepShell eyebrow="STEP 1 · 예산" title="월 예산은 얼마가 좋으세요?" desc="원하는 월 예산 범위를 골라주세요. 범위에 맞춰 차량을 추천해 드려요.">
        <div className="rt-opts">
          {RT_BUDGETS.map((b) => (
            <Opt key={b.key} selected={flow.budget === b.key} onClick={() => { flow.setBudget(b.key); setTimeout(flow.next, 260); }}>
              <div className="rt-opt-main">
                <span className="rt-opt-label">{b.label}</span>
                <span className="rt-opt-sub">{b.sub}</span>
              </div>
            </Opt>
          ))}
        </div>
      </StepShell>
    );
  } else if (step === 'class') {
    stepInner = (
      <StepShell eyebrow="STEP 2 · 차급" title="어떤 차급을 찾으세요?" desc="차급만 정해도 충분해요. 세부 모델은 상담에서 함께 골라드립니다.">
        <div className="rt-opts">
          {RT_CLASSES.map((c) => (
            <Opt key={c.key} selected={flow.cls === c.key} onClick={() => { flow.setCls(c.key); setTimeout(flow.next, 260); }}>
              <div className="rt-opt-main">
                <span className="rt-opt-label">{c.label}</span>
                <span className="rt-opt-sub">{c.eg}</span>
              </div>
            </Opt>
          ))}
        </div>
      </StepShell>
    );
  } else if (step === 'form') {
    stepInner = <FormStep flow={flow} />;
  } else if (step === 'result') {
    stepInner = <ResultStep flow={flow} />;
  }
  return <div className={'rt-stepwrap' + (flow.dir === 'back' ? ' is-back' : '')}>{stepInner}</div>;
}

// ── 고정 하단 CTA 바 ────────────────────────────────────────
function RtBottomBar({ flow }: { flow: Flow }) {
  const { step } = flow;
  let content: React.ReactNode = null;
  if (step === 'intro') {
    content = <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={flow.next}>내 차량 찾기</Button>;
  } else if (step === 'budget' || step === 'class') {
    const ok = step === 'budget' ? flow.budget : flow.cls;
    content = <Button variant="primary" size="lg" fullWidth disabled={!ok} onClick={flow.next}>다음</Button>;
  } else if (step === 'form') {
    content = (
      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="rt-gold"
        disabled={!flow.valid || flow.submitting}
        onClick={() => void flow.submit()}
      >
        {flow.submitting ? '신청 중…' : '비대면 상담 신청하고 정보 확인'}
      </Button>
    );
  } else if (step === 'result') {
    content = (
      <div className="rt-bar-result">
        <a className="rt-bar-call" href="tel:16667000">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          전화 상담
        </a>
        <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={flow.reset}>다른 조건으로 다시 견적</Button>
      </div>
    );
  }
  return <div className="rt-bar"><div className="rt-bar-inner">{content}</div></div>;
}

// ── 푸터 ─────────────────────────────────────────────────────
function RtFooter() {
  return (
    <footer className="rt-footer">
      <div className="rt-footer-row">
        <span className="rt-footer-brand">Rentailor</span>
        <div className="rt-footer-links">
          <Link href="/terms-preview">이용약관</Link>
          <Link href="/privacy">개인정보</Link>
        </div>
      </div>
    </footer>
  );
}

// ── 루트 ─────────────────────────────────────────────────────
export default function HomePreview() {
  const flow = useQuoteFlow();
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    setLocked(false);
    const t = setTimeout(() => setLocked(true), 900);
    return () => clearTimeout(t);
  }, [flow.step]);

  return (
    <div data-rt="home-preview" className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-dir="c" data-step={flow.step} id="top">
        <div className={'rt-scroll' + (locked ? ' rt-anim-lock' : '')} ref={flow.scrollRef}>
          <RtNav />
          <RtProgress flow={flow} />
          <main className="rt-main">
            {flow.step === 'intro' ? <RtHero /> : <QuoteBody flow={flow} />}
          </main>
          {flow.step === 'intro' && <RtFooter />}
          <RtBottomBar flow={flow} />
        </div>
      </div>
    </div>
  );
}
