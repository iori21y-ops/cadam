'use client';

// 고객 로그인/가입 — 리뉴얼 미리보기 (타깃 /login)
// 원본: _design_ref/login-app.jsx (+ rt-login.css)
// 이식 규칙: window 전역 → 모듈(import), 모킹 로그인(localStorage rt_member) → 실 verifyMemberOtp,
//   디바이스 토글/TweaksPanel/personalize/RtControlBar 제외, image-slot 미사용.
//   신원 키 = 휴대폰. 가입 = 휴대폰 + 이름 + 개인정보동의(필수) + 마케팅동의(선택).
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendMemberOtp, verifyMemberOtp, getMember, type MemberInfo } from '@/lib/member-auth';
import './login.css';

const ACCENT = '#C9A84C';
const NAVY = '#0D1B2A';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

type Step = 'loading' | 'home' | 'phone' | 'otp' | 'signup' | 'done';

// 인증 단계 인디케이터 매핑 (phone/otp/signup 3단계)
const STEP_ORDER: Record<'phone' | 'otp' | 'signup', number> = { phone: 0, otp: 1, signup: 2 };

// ── 공용 인라인 스타일 (프로토타입 유지) ─────────────────────
const authTitle: React.CSSProperties = { fontSize: 23, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', lineHeight: 1.32 };
const authSub: React.CSSProperties = { fontSize: 14, color: 'rgba(255,255,255,.6)', marginTop: 10, lineHeight: 1.6 };
const authLabel: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.7)', marginBottom: 8, display: 'block' };
const authInput: React.CSSProperties = { width: '100%', border: '1.5px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.06)', borderRadius: 13, padding: '15px 16px', fontSize: 17, fontWeight: 700, color: '#fff', outline: 'none', fontFamily: 'inherit' };
const authPrimary = (on: boolean): React.CSSProperties => ({ width: '100%', border: 'none', borderRadius: 13, padding: '16px', fontSize: 15.5, fontWeight: 800, color: on ? NAVY : 'rgba(13,27,42,.5)', background: on ? 'linear-gradient(135deg,#C9A84C,#B07A2E)' : 'rgba(255,255,255,.18)', cursor: on ? 'pointer' : 'default', marginTop: 'auto', marginBottom: 22 });

// ── 인증 단계 공용 셸 (어두운 배경 위 카드) ──────────────────
function AuthShell({ onBack, step, children }: { onBack: () => void; step: 'phone' | 'otp' | 'signup'; children: React.ReactNode }) {
  return (
    <div className="rt-login" style={{ justifyContent: 'flex-start' }}>
      <div className="rt-login-glow"></div>
      <button onClick={onBack} aria-label="뒤로" style={{ position: 'absolute', top: 18, left: 16, zIndex: 3, width: 38, height: 38, borderRadius: 11, border: 'none', background: 'rgba(255,255,255,.08)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <div style={{ position: 'relative', zIndex: 2, padding: '84px 26px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 26 }}>
          {(['phone', 'otp', 'signup'] as const).map((s, i) => {
            const active = i <= STEP_ORDER[step];
            return <span key={s} style={{ height: 4, flex: 1, borderRadius: 3, background: active ? ACCENT : 'rgba(255,255,255,.16)' }}></span>;
          })}
        </div>
        {children}
      </div>
    </div>
  );
}

// ── 시작 화면 (홈) ───────────────────────────────────────────
function LoginHome({ onPhone }: { onPhone: () => void }) {
  return (
    <div className="rt-login">
      <div className="rt-login-glow"></div>
      <a className="rt-login-skip" href="/">둘러보기
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </a>

      <div className="rt-login-top">
        <div className="rt-login-mark">Ren<em>tailor</em></div>
        <p className="rt-login-tag">양복 맞추듯 딱 맞는 내 차,<br />장기렌트를 비대면으로 가장 쉽게.</p>
        <div className="rt-login-stats">
          <div className="rt-login-stat"><b>12,800+</b><span>누적 상담</span></div>
          <div className="rt-login-stat"><b>9곳</b><span>제휴 캐피탈</span></div>
          <div className="rt-login-stat"><b>10분</b><span>평균 응답</span></div>
        </div>
      </div>

      <div className="rt-login-actions">
        {/* 카카오 OAuth 미배선 → 현재는 휴대폰 OTP 플로우로 진입 (의도적 변경) */}
        <button className="rt-login-btn kakao" onClick={onPhone}>
          <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M12 3.2c-5 0-9 3.2-9 7.1 0 2.5 1.7 4.7 4.2 6-.2.7-.7 2.5-.8 2.9 0 .2.1.4.4.2.2-.1 2.7-1.8 3.7-2.5.5.1 1 .1 1.5.1 5 0 9-3.2 9-7.1S17 3.2 12 3.2z" /></svg>
          카카오로 3초 시작
        </button>
        <button className="rt-login-btn phone" onClick={onPhone}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="3" /><path d="M11 18.5h2" /></svg>
          휴대폰 번호로 시작
        </button>
        <div className="rt-login-divider">또는</div>
        <a className="rt-login-btn guest" href="/">비회원으로 둘러보기</a>
        <p className="rt-login-terms">시작하면 <a href="/terms" target="_blank" rel="noopener">이용약관</a> 및
          <a href="/privacy" target="_blank" rel="noopener"> 개인정보처리방침</a>에 동의하게 됩니다.</p>
      </div>
    </div>
  );
}

// ── 1) 휴대폰 번호 입력 → sendMemberOtp ──────────────────────
function PhoneStep({ onBack, onSent }: { onBack: () => void; onSent: (rawPhone: string, devHint?: string) => void }) {
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fmt = (v: string): string => {
    const d = v.replace(/[^0-9]/g, '').slice(0, 11);
    return d.length > 7 ? d.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3') : d.length > 3 ? d.replace(/(\d{3})(\d+)/, '$1-$2') : d;
  };
  const raw = phone.replace(/[^0-9]/g, '');
  const ok = raw.length === 11 && raw.startsWith('010');

  const submit = async (): Promise<void> => {
    if (!ok || busy) return;
    setBusy(true);
    setErr('');
    const res = await sendMemberOtp(raw);
    setBusy(false);
    if (res.ok) onSent(raw, res.devHint);
    else setErr('인증번호 발송에 실패했어요. 잠시 후 다시 시도해주세요.');
  };

  return (
    <AuthShell onBack={onBack} step="phone">
      <h1 style={authTitle}>휴대폰 번호로<br />시작하세요</h1>
      <p style={authSub}>입력하신 번호로 인증번호를 보내드려요.<br />가입·로그인이 한 번에 됩니다.</p>
      <div style={{ marginTop: 28 }}>
        <label style={authLabel}>휴대폰 번호</label>
        <input style={authInput} inputMode="numeric" autoFocus placeholder="010-0000-0000"
          value={phone} onChange={(e) => { setErr(''); setPhone(fmt(e.target.value)); }}
          onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }} />
        {err && <p style={{ color: '#F3B0B0', fontSize: 12.5, marginTop: 9, fontWeight: 600 }}>{err}</p>}
      </div>
      <button style={authPrimary(ok && !busy)} disabled={!ok || busy} onClick={() => void submit()}>
        {busy ? '발송 중…' : '인증번호 받기'}
      </button>
    </AuthShell>
  );
}

// ── 2) 인증번호(OTP) 입력 (로컬 검증만, 서버 검증은 signup 제출에서) ──
function OtpStep({ phone, devHint, onBack, onResend, onNext }: {
  phone: string; devHint?: string; onBack: () => void; onResend: (devHint?: string) => void; onNext: (code: string) => void;
}) {
  const [code, setCode] = useState('');
  const [left, setLeft] = useState(180);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { const id = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { if (ref.current) ref.current.focus(); }, []);
  const mm = String(Math.floor(left / 60)).padStart(1, '0');
  const ss = String(left % 60).padStart(2, '0');
  const ok = code.length === 6;
  const masked = phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');

  const resend = async (): Promise<void> => {
    const res = await sendMemberOtp(phone);
    setLeft(180);
    setCode('');
    if (res.ok) onResend(res.devHint);
  };

  return (
    <AuthShell onBack={onBack} step="otp">
      <h1 style={authTitle}>인증번호를<br />입력하세요</h1>
      <p style={authSub}>
        <b style={{ color: '#fff' }}>{masked}</b>로<br />인증번호를 보냈어요.
        {devHint && <span style={{ color: ACCENT }}> (개발 모드: 인증코드 {devHint})</span>}
      </p>
      <div style={{ marginTop: 28 }}>
        <label style={authLabel}>인증번호 6자리</label>
        <div style={{ position: 'relative' }}>
          <input ref={ref} style={{ ...authInput, letterSpacing: '0.5em', fontSize: 22, textAlign: 'center' }} inputMode="numeric" placeholder="••••••"
            value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            onKeyDown={(e) => { if (e.key === 'Enter' && ok) onNext(code); }} />
          <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 700, color: left > 0 ? ACCENT : '#EF4444' }}>{mm}:{ss}</span>
        </div>
        <button onClick={() => void resend()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: 700, marginTop: 14, cursor: 'pointer', padding: 0 }}>인증번호 다시 받기</button>
      </div>
      <button style={authPrimary(ok)} disabled={!ok} onClick={() => onNext(code)}>다음</button>
    </AuthShell>
  );
}

// ── 3) 가입 (이름 + 동의) → verifyMemberOtp(code+name+consent) ──
type Agree = { tos: boolean; privacy: boolean; mkt: boolean };
function SignupStep({ phone, code, onBack, onSuccess }: {
  phone: string; code: string; onBack: () => void; onSuccess: (member: MemberInfo, linkedLeads: number) => void;
}) {
  const [name, setName] = useState('');
  const [agree, setAgree] = useState<Agree>({ tos: false, privacy: false, mkt: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const required = agree.tos && agree.privacy;
  const allOn = agree.tos && agree.privacy && agree.mkt;
  const canSubmit = Boolean(required && name.trim()) && !busy;
  const toggle = (k: keyof Agree): void => setAgree((a) => ({ ...a, [k]: !a[k] }));
  const setAll = (v: boolean): void => setAgree({ tos: v, privacy: v, mkt: v });

  const submit = async (): Promise<void> => {
    if (!canSubmit) return;
    setBusy(true);
    setErr('');
    // 신원 키 = 휴대폰. 서버가 members upsert + 개인정보동의 이력 + 마케팅동의(consent) + 리드 연결.
    const res = await verifyMemberOtp({ phone, code, name: name.trim(), consent: agree.mkt });
    setBusy(false);
    if (res.ok && res.member) onSuccess(res.member, res.linkedLeads ?? 0);
    else setErr(res.error === 'invalid_code' ? '인증번호가 일치하지 않아요. 다시 받아주세요.' : '가입에 실패했어요. 잠시 후 다시 시도해주세요.');
  };

  const row = (k: keyof Agree, label: string, link: string | null): React.ReactElement => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 2px', cursor: 'pointer' }}>
      <span onClick={(e) => { e.preventDefault(); toggle(k); }} style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: 'grid', placeItems: 'center', background: agree[k] ? ACCENT : 'rgba(255,255,255,.1)', border: agree[k] ? 'none' : '1.5px solid rgba(255,255,255,.2)' }}>
        {agree[k] && <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={NAVY} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10" /></svg>}
      </span>
      <span style={{ flex: 1, fontSize: 13.5, color: 'rgba(255,255,255,.85)', fontWeight: 600 }} onClick={(e) => { e.preventDefault(); toggle(k); }}>{label}</span>
      {link && <a href={link} target="_blank" rel="noopener" style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', textDecoration: 'underline' }}>보기</a>}
    </label>
  );

  return (
    <AuthShell onBack={onBack} step="signup">
      <h1 style={authTitle}>반가워요!<br />이름만 알려주세요</h1>
      <p style={authSub}>맞춤 상담·견적을 위해 이름이 필요해요.</p>
      <div style={{ marginTop: 26 }}>
        <label style={authLabel}>이름</label>
        <input style={authInput} autoFocus placeholder="홍길동" value={name} onChange={(e) => { setErr(''); setName(e.target.value); }} />
      </div>
      <div style={{ marginTop: 22, borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 2px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.1)', marginBottom: 4 }} onClick={() => setAll(!allOn)}>
          <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: 'grid', placeItems: 'center', background: allOn ? ACCENT : 'rgba(255,255,255,.1)', border: allOn ? 'none' : '1.5px solid rgba(255,255,255,.2)' }}>
            {allOn && <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={NAVY} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10" /></svg>}
          </span>
          <span style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: 800 }}>전체 동의</span>
        </label>
        {row('tos', '(필수) 이용약관 동의', '/terms')}
        {row('privacy', '(필수) 개인정보 수집·이용 동의', '/privacy')}
        {row('mkt', '(선택) 마케팅 정보 수신 동의', null)}
      </div>
      {err && <p style={{ color: '#F3B0B0', fontSize: 12.5, marginTop: 4, fontWeight: 600 }}>{err}</p>}
      <button style={authPrimary(canSubmit)} disabled={!canSubmit} onClick={() => void submit()}>
        {busy ? '처리 중…' : '가입 완료하고 시작'}
      </button>
    </AuthShell>
  );
}

// ── 성공 화면 ────────────────────────────────────────────────
function DoneScreen({ name, linkedLeads, onContinue }: { name: string | null; linkedLeads: number; onContinue: () => void }) {
  return (
    <div className="rt-login" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 30px' }}>
      <div className="rt-login-glow"></div>
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: ACCENT, display: 'grid', placeItems: 'center', marginBottom: 22 }}>
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke={NAVY} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10" /></svg>
        </div>
        <h1 style={{ ...authTitle, textAlign: 'center' }}>{name ? `${name}님, ` : ''}환영해요!</h1>
        <p style={{ ...authSub, textAlign: 'center' }}>
          로그인이 완료됐어요.
          {linkedLeads > 0 && <><br />기존 상담 {linkedLeads}건이 연결됐어요.</>}
        </p>
        <button style={{ ...authPrimary(true), marginTop: 32, maxWidth: 280 }} onClick={onContinue}>마이페이지로 이동</button>
      </div>
    </div>
  );
}

// ── 컨테이너 ─────────────────────────────────────────────────
export default function LoginPreviewPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('loading');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [devHint, setDevHint] = useState<string | undefined>(undefined);
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [linkedLeads, setLinkedLeads] = useState(0);

  // 마운트 시 이미 로그인이면 마이페이지로
  useEffect(() => {
    let alive = true;
    void (async () => {
      const m = await getMember();
      if (!alive) return;
      if (m) router.replace('/mypage-preview');
      else setStep('home');
    })();
    return () => { alive = false; };
  }, [router]);

  const goMypage = (): void => router.replace('/mypage-preview');

  const onSuccess = (m: MemberInfo, leads: number): void => {
    setMember(m);
    setLinkedLeads(leads);
    setStep('done');
  };

  let screen: React.ReactNode;
  if (step === 'loading') {
    screen = <div className="rt-login"><div className="rt-login-glow"></div></div>;
  } else if (step === 'phone') {
    screen = <PhoneStep onBack={() => setStep('home')} onSent={(p, hint) => { setPhone(p); setDevHint(hint); setStep('otp'); }} />;
  } else if (step === 'otp') {
    screen = <OtpStep phone={phone} devHint={devHint} onBack={() => setStep('phone')} onResend={(hint) => setDevHint(hint)} onNext={(c) => { setCode(c); setStep('signup'); }} />;
  } else if (step === 'signup') {
    screen = <SignupStep phone={phone} code={code} onBack={() => setStep('otp')} onSuccess={onSuccess} />;
  } else if (step === 'done') {
    screen = <DoneScreen name={member?.name ?? null} linkedLeads={linkedLeads} onContinue={goMypage} />;
  } else {
    screen = <LoginHome onPhone={() => setStep('phone')} />;
  }

  return (
    <div className="rt-root" style={cssVar({ '--rt-accent': ACCENT })}>
      <div className="rt-page">{screen}</div>
    </div>
  );
}
