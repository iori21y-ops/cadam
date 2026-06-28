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
