'use client';
// RtGuestGate.tsx — 게스트(상담 미신청) 가드
// 원본: _design_ref/rt-guest.jsx (window 전역 → 모듈, localStorage 직접 읽기 → guest-adapter)
//
// hydration 안전: 초기 상태는 서버 주입 prop(initialConsulted) 또는 결정적 기본값(false)에서 시작하고,
//   localStorage 폴백은 마운트 후 useEffect 에서만 읽는다(SSR-클라 불일치 방지).
// 허용 페이지 판정은 .html 파일명 → 실 라우트 경로 기반으로 적응(임시 — 라우팅 확정 시 재조정).
import React, { useEffect, useRef, useState } from 'react';
import { rtIsConsulted, rtMarkConsulted } from '@/lib/rentailor/guest-adapter';
import { RtConsultSheet } from './RtConsultSheet';

// 게스트가 모달 없이 통과하는 라우트(차종 열람·정보 콘텐츠 무료 열람·홈/약관 탈출구)
const RT_GUEST_ALLOW_PATHS = ['/', '/popular-estimates', '/info', '/terms', '/privacy'];
const RT_GUEST_ALLOW_PREFIXES = ['/cars', '/info']; // 차종 상세·정보 상세 등 하위 경로
// 전환 행동 버튼 (열람이 아닌 리드 의도 → 모달)
const RT_GUEST_BLOCK_BTN = ['rt-save', 'rt-vcmp', 'rt-gold', 'rt-bar-btn'];

function pathAllowed(href: string): boolean {
  let path = href;
  try {
    // 절대/상대 모두 처리 — pathname 만 추출
    path = new URL(href, 'http://x').pathname;
  } catch {
    path = href.split('?')[0].split('#')[0];
  }
  if (RT_GUEST_ALLOW_PATHS.includes(path)) return true;
  return RT_GUEST_ALLOW_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

export interface RtGuestGateProps {
  accent?: string;
  /** strict(상세 페이지): 유사 차종(허용 링크) 외 모든 버튼·링크 차단 */
  strict?: boolean;
  /** 서버/세션에서 주입하는 상담 완료 여부(주입구). 미지정 시 마운트 후 localStorage 폴백. */
  initialConsulted?: boolean;
}

export function RtGuestGate({ accent, strict, initialConsulted }: RtGuestGateProps) {
  // 초기값: 주입 prop 우선, 없으면 결정적 false(SSR 안전)
  const [consulted, setConsulted] = useState<boolean>(initialConsulted ?? false);
  const [open, setOpen] = useState(false);
  const consultedRef = useRef(false);

  // 마운트 후 폴백: 주입값이 없을 때만 어댑터(localStorage) 조회
  useEffect(() => {
    if (initialConsulted === undefined && rtIsConsulted()) {
      setConsulted(true);
    }
  }, [initialConsulted]);

  const guest = !consulted;

  useEffect(() => {
    if (!guest) return;
    const gate = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest('a, button') as HTMLElement | null;
      if (!el) return;
      // 모달·시트·게스트바 내부는 통과
      if (el.closest(".rt-sheet, .rt-sheet-scrim, .rt-guestbar, [data-guest='allow']")) return;

      if (el.tagName === 'BUTTON') {
        const blocked =
          strict ||
          RT_GUEST_BLOCK_BTN.some((c) => el.classList.contains(c)) ||
          !!el.closest("[data-guest='block']");
        if (blocked) gate(e);
        return;
      }
      // 앵커(링크)
      const href = el.getAttribute('href');
      if (!href || href.startsWith('javascript')) return;
      if (el.classList.contains('rt-brand') || el.classList.contains('rt-nav-back')) return; // 로고·뒤로 탈출
      if (href.startsWith('#')) {
        if (href.length > 1) return; // 페이지 내 앵커는 통과
        gate(e);
        return; // 빈 '#'(미구현 콘텐츠 카드) → 상담 유도
      }
      if (pathAllowed(href)) return; // 차종·홈·정보·약관
      gate(e);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [guest, strict]);

  if (!guest) return null;

  return (
    <>
      <div className="rt-guestbar" role="note">
        <span className="rt-guestbar-ic">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="10" rx="2.5" />
            <path d="M8 10V6a4 4 0 0 1 7.5-1.9" />
          </svg>
        </span>
        <span className="rt-guestbar-txt">
          <b>둘러보기 모드</b> · {strict ? '상담 후 상세 기능 이용' : '상담 후 견적·비교 이용'}
        </span>
        <button className="rt-guestbar-btn" onClick={() => setOpen(true)}>
          상담 신청
        </button>
      </div>
      <RtConsultSheet
        open={open}
        accent={accent}
        onSubmitted={() => {
          rtMarkConsulted();
          consultedRef.current = true;
        }}
        onClose={() => {
          setOpen(false);
          if (consultedRef.current) setConsulted(true);
        }}
      />
    </>
  );
}
