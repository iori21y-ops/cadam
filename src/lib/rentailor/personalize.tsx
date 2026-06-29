'use client';
// personalize.tsx — 고객 개인화(이해도 초급/중급/고급 + 고객유형). 원본 _design_ref/personalize.jsx 이식.
//   저장: localStorage rt_profile {literacy, ctype}. rt-profile 이벤트로 전 화면 동기화(SSR 안전).
//   실연동: 카톡 견적정보 입력 시 members.profile → 전 페이지 공유(갭문서).
import React from 'react';

export type Literacy = 'beginner' | 'intermediate' | 'expert';
export type Ctype = 'individual' | 'sole' | 'corp';
export interface RtProfile { literacy: Literacy; ctype: Ctype }

export const RT_LIT: [Literacy, string][] = [['beginner', '초급'], ['intermediate', '중급'], ['expert', '고급']];
export const RT_CTYPE: [Ctype, string][] = [['individual', '개인'], ['sole', '개인사업자'], ['corp', '법인사업자']];
export const RT_LIT_DESC: Record<Literacy, string> = {
  beginner: '용어를 쉽게 풀어주고 단계 가이드를 보여드려요',
  intermediate: '용어는 눌러서 펼쳐볼 수 있어요',
  expert: '가이드·용어 설명 없이 그대로 보여드려요',
};
const DEFAULT: RtProfile = { literacy: 'beginner', ctype: 'individual' };

function load(): RtProfile {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const p = JSON.parse(localStorage.getItem('rt_profile') || 'null');
    if (p && p.literacy && p.ctype) return p as RtProfile;
  } catch { /* ignore */ }
  return DEFAULT;
}
function save(p: RtProfile) {
  try { localStorage.setItem('rt_profile', JSON.stringify(p)); localStorage.setItem('rt_profile_set', '1'); } catch { /* ignore */ }
  window.dispatchEvent(new Event('rt-profile'));
}
// 프로필을 한 번이라도 직접 설정했는지(첫방문 모달 노출 판정). SSR/미설정 시 false.
export function rtProfileIsSet(): boolean {
  if (typeof window === 'undefined') return false;
  try { return localStorage.getItem('rt_profile_set') === '1'; } catch { return false; }
}

export function useRtProfile(): [RtProfile, (patch: Partial<RtProfile>) => void] {
  const [p, setP] = React.useState<RtProfile>(DEFAULT);
  React.useEffect(() => {
    setP(load());
    const h = () => setP(load());
    window.addEventListener('rt-profile', h);
    return () => window.removeEventListener('rt-profile', h);
  }, []);
  return [p, (patch) => save({ ...load(), ...patch })];
}

// 어려운 용어 — 초급=상시 설명 / 중급=눌러 펼침 / 고급=그대로
export function RtTerm({ term, explain }: { term: string; explain: string }) {
  const [p] = useRtProfile();
  const [open, setOpen] = React.useState(false);
  if (p.literacy === 'expert') return <span>{term}</span>;
  if (p.literacy === 'beginner')
    return (
      <span style={{ whiteSpace: 'nowrap' }}>
        {term}<span style={{ color: '#9a7d2e', fontSize: '0.86em', marginLeft: 4 }}>({explain})</span>
      </span>
    );
  return (
    <span style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={{ background: 'none', border: 'none', borderBottom: '1px dotted #9ca3af', cursor: 'pointer', font: 'inherit', padding: 0, color: 'inherit' }}>
        {term}<i style={{ color: '#9ca3af', fontStyle: 'normal', fontSize: '0.8em' }}> ?</i>
      </button>
      {open && <span style={{ display: 'block', fontSize: '0.86em', color: '#4a5568', marginTop: 2 }}>{explain}</span>}
    </span>
  );
}

// 고객 유형 필터 — types 포함 시만 노출(없으면 항상)
export function RtTypeOnly({ types, children }: { types?: Ctype[]; children: React.ReactNode }) {
  const [p] = useRtProfile();
  if (types && types.length && !types.includes(p.ctype)) return null;
  return <>{children}</>;
}

// 쉬운 용어 설명 — 초급=펼침 / 중급=접힘(눌러 펼침) / 고급=숨김
export function RtTermDefs({ items, title }: { items: [string, string][]; title?: string }) {
  const [p] = useRtProfile();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { setOpen(p.literacy === 'beginner'); }, [p.literacy]);
  if (p.literacy === 'expert' || !items?.length) return null;
  return (
    <div style={{ margin: '12px 0', border: '1px solid #e8eaee', borderRadius: 14, overflow: 'hidden' }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f6f7f9', border: 'none', cursor: 'pointer', font: 'inherit', fontWeight: 700 }}>
        <span>{title || '쉬운 용어 설명'}</span><span>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div style={{ padding: '10px 14px' }}>
          {items.map(([t, ex], i) => (
            <div key={i} style={{ padding: '6px 0', borderTop: i ? '1px solid #f0f0f0' : 'none' }}>
              <b style={{ marginRight: 6 }}>{t}</b><span style={{ color: '#4a5568', fontSize: '0.92em' }}>{ex}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 상담→계약 6단계 가이드 (초급 상시·중급 접힘·고급 없음)
const RT_JOURNEY = [
  ['상담 신청', '이름·연락처만 남기면 끝'], ['전담 매니저 배정', '1:1 컨설턴트 연결'], ['견적 비교', '캐피탈 9곳 비교'],
  ['서류·심사', '카톡으로 간편 제출(OCR)'], ['계약 체결', '비대면 전자계약'], ['차량 인도', '신차 탁송'],
];
export function RtJourney() {
  const [p] = useRtProfile();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { setOpen(p.literacy === 'beginner'); }, [p.literacy]);
  if (p.literacy === 'expert') return null;
  return (
    <div style={{ margin: '12px 0' }}>
      {p.literacy === 'intermediate' && (
        <button type="button" onClick={() => setOpen((v) => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', fontWeight: 700, color: '#0D1B2A', padding: 0 }}>상담부터 계약까지 6단계 {open ? '▴' : '▾'}</button>
      )}
      {(p.literacy === 'beginner' || open) && (
        <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
          {RT_JOURNEY.map(([t, d], i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: '#0D1B2A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{i + 1}</span>
              <span><b>{t}</b> <span style={{ color: '#4a5568', fontSize: '0.9em' }}>{d}</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 이해도 레벨 토글 (전 화면 공통 — RtTopNav 등에 마운트)
export function RtLevelToggle() {
  const [p, setP] = useRtProfile();
  return (
    <div style={{ display: 'inline-flex', gap: 2, padding: 2, background: '#f0f0f0', borderRadius: 999 }} title="화면 개인화: 이해도 수준">
      {RT_LIT.map(([k, label]) => (
        <button key={k} type="button" onClick={() => setP({ literacy: k })}
          style={{ border: 'none', cursor: 'pointer', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700, background: p.literacy === k ? '#0D1B2A' : 'transparent', color: p.literacy === k ? '#fff' : '#6b7280' }}>
          {label}
        </button>
      ))}
    </div>
  );
}

// 우측 상단 상시 개인화 아이콘(FAB) — 디자인 원본 personalize.jsx RtPersonalizeIcon 이식.
//   클릭 시 패널: 이해도(초급/중급/고급) + 고객유형(개인/개인사업자/법인) + 초급이면 계약 6단계 가이드.
//   초급(할 일 남음)엔 펄스 링 + 단계수 배지로 '다음 할 일 있음'을 표시.
export function RtPersonalizeIcon() {
  const [p, setProf] = useRtProfile();
  const [open, setOpen] = React.useState(false);
  const beginner = p.literacy === 'beginner';
  const segBtn = (on: boolean): React.CSSProperties => ({
    flex: 1, border: 'none', cursor: 'pointer', borderRadius: 8, padding: '7px 0', fontSize: 13, fontWeight: 700,
    background: on ? '#0D1B2A' : '#fff', color: on ? '#fff' : '#6b7280',
  });
  const segWrap: React.CSSProperties = { display: 'flex', gap: 4, marginTop: 6, padding: 3, background: '#f3f4f6', borderRadius: 10 };
  const fieldK: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#6b7280' };
  return (
    <div style={{ position: 'fixed', top: 64, right: 14, zIndex: 60 }}>
      <style>{'@keyframes rtPziPulse{0%{transform:scale(1);opacity:.55}70%{transform:scale(1.9);opacity:0}100%{opacity:0}}'}</style>
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0 }} aria-hidden="true" />}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="내게 맞춘 보기"
        aria-expanded={open}
        style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', border: '1px solid #e8eaee', background: beginner ? '#C9A84C' : '#fff', color: beginner ? '#0D1B2A' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,27,42,0.12)' }}
      >
        {beginner && !open && <span aria-hidden="true" style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: '2px solid #C9A84C', animation: 'rtPziPulse 1.8s ease-out infinite' }} />}
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 4.5H7A1.5 1.5 0 0 0 5.5 6v13A1.5 1.5 0 0 0 7 20.5h10A1.5 1.5 0 0 0 18.5 19V6A1.5 1.5 0 0 0 17 4.5h-2" />
          <rect x="9" y="3" width="6" height="3.2" rx="1.1" />
          <path d="M8.8 13.2l2 2 4.4-4.4" />
        </svg>
        {beginner && <span aria-hidden="true" style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: '#0D1B2A', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{RT_JOURNEY.length}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="맞춤 보기 설정" style={{ position: 'absolute', top: 48, right: 0, width: 268, background: '#fff', border: '1px solid #e8eaee', borderRadius: 16, boxShadow: '0 12px 32px rgba(13,27,42,0.18)', padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0D1B2A' }}>내게 맞춘 보기</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="닫기" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={fieldK}>상품 이해도</span>
            <div style={segWrap}>
              {RT_LIT.map(([k, l]) => <button key={k} type="button" onClick={() => setProf({ literacy: k })} style={segBtn(p.literacy === k)}>{l}</button>)}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af', lineHeight: 1.4 }}>{RT_LIT_DESC[p.literacy]}</p>
          </div>
          <div>
            <span style={fieldK}>고객 유형</span>
            <div style={segWrap}>
              {RT_CTYPE.map(([k, l]) => <button key={k} type="button" onClick={() => setProf({ ctype: k })} style={segBtn(p.ctype === k)}>{l}</button>)}
            </div>
          </div>
          {beginner && <div style={{ marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 4 }}><RtJourney /></div>}
        </div>
      )}
    </div>
  );
}

// 첫 진입 시 1회 뜨는 개인화 모달(이해도+고객유형) — 디자인 원본 personalize.jsx RtPersonalizeModal 이식.
//   설정한 적 없으면(rtProfileIsSet=false) 노출. 닫으면 저장 → 이후 우상단 아이콘으로 조정.
export function RtPersonalizeModal() {
  const [, setProf] = useRtProfile();
  const [show, setShow] = React.useState(false);
  const [lit, setLit] = React.useState<Literacy>('beginner');
  const [ct, setCt] = React.useState<Ctype>('individual');
  React.useEffect(() => { if (!rtProfileIsSet()) setShow(true); }, []);
  if (!show) return null;
  const close = () => { setProf({ literacy: lit, ctype: ct }); setShow(false); };
  const optCol = (on: boolean): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left', cursor: 'pointer', borderRadius: 12,
    padding: '11px 13px', border: '1.5px solid ' + (on ? '#C9A84C' : '#e8eaee'), background: on ? 'rgba(201,168,76,0.08)' : '#fff',
  });
  const optRow = (on: boolean): React.CSSProperties => ({
    flex: 1, cursor: 'pointer', borderRadius: 12, padding: '11px 0', fontWeight: 700, fontSize: 13,
    border: '1.5px solid ' + (on ? '#C9A84C' : '#e8eaee'), background: on ? 'rgba(201,168,76,0.08)' : '#fff', color: '#0D1B2A',
  });
  const q: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: '#0D1B2A', margin: '0 0 8px' };
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(13,27,42,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: '20px 20px 0 0', padding: '22px 18px 18px', maxHeight: '88vh', overflowY: 'auto' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#B07A2E' }}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 2l2.5 6.4L21 9l-5 4.1L17.6 20 12 16.3 6.4 20 8 13.1 3 9l6.5-.6z" /></svg>
          맞춤 안내
        </span>
        <h2 style={{ margin: '6px 0 4px', fontSize: 19, fontWeight: 800, color: '#0D1B2A' }}>딱 맞는 정보로 보여드릴게요</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>두 가지만 골라주시면 이 화면부터 눈높이에 맞춰 안내해 드려요. 설정은 우측 상단 아이콘에서 언제든 바꿀 수 있어요.</p>
        <div style={{ marginBottom: 14 }}>
          <p style={q}>장기렌트·리스, 얼마나 알고 계세요?</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {RT_LIT.map(([k, l]) => (
              <button key={k} type="button" onClick={() => setLit(k)} style={optCol(lit === k)}>
                <b style={{ fontSize: 14, color: '#0D1B2A' }}>{l}</b>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{RT_LIT_DESC[k]}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <p style={q}>고객 유형이 어떻게 되세요?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {RT_CTYPE.map(([k, l]) => (
              <button key={k} type="button" onClick={() => setCt(k)} style={optRow(ct === k)}>{l}</button>
            ))}
          </div>
        </div>
        <button type="button" onClick={close} style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 14, padding: '14px 0', fontSize: 15, fontWeight: 800, background: '#0D1B2A', color: '#fff' }}>이 설정으로 볼게요</button>
        <button type="button" onClick={close} style={{ width: '100%', marginTop: 8, border: 'none', cursor: 'pointer', background: 'none', padding: '8px 0', fontSize: 13, fontWeight: 600, color: '#9ca3af' }}>다음에 할게요</button>
      </div>
    </div>
  );
}
