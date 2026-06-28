// guest-adapter.ts — 게스트 가드 상태 소스 추상화 (§14.3-3)
// 원본 프로토타입(_design_ref/rt-guest.jsx)은 localStorage("rt_consulted") 직접 의존.
// 실연동 시 이 한 곳(어댑터)만 서버/세션 상담상태로 교체하면 된다.
// 현재 기본 구현은 localStorage 폴백 유지.

/** 상담 완료(=회원 전환) 여부를 알려주는 소스. 실연동 시 서버/세션 구현으로 교체. */
export interface ConsultedSource {
  /** 동기 조회(클라이언트 게이팅용). SSR 안전: window 없으면 false. */
  isConsulted(): boolean;
  /** 상담 완료 표시(랜딩 폼/게스트 모달 제출 성공 콜백에서 호출). */
  markConsulted(): void;
}

const STORAGE_KEY = 'rt_consulted';

/** 기본 구현 — localStorage 폴백. */
export const localStorageConsultedSource: ConsultedSource = {
  isConsulted() {
    if (typeof window === 'undefined') return false;
    try {
      return !!window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  },
  markConsulted() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* 무시 */
    }
  },
};

let activeSource: ConsultedSource = localStorageConsultedSource;

/**
 * 상담상태 소스 주입구(단일 교체점).
 * 실연동: 예) setConsultedSource({ isConsulted: () => Boolean(serverSession?.consulted), markConsulted: ... })
 */
export function setConsultedSource(source: ConsultedSource): void {
  activeSource = source;
}
export function getConsultedSource(): ConsultedSource {
  return activeSource;
}

export function rtIsConsulted(): boolean {
  return activeSource.isConsulted();
}
export function rtMarkConsulted(): void {
  activeSource.markConsulted();
}
export function rtIsGuest(): boolean {
  return !rtIsConsulted();
}

// ── 회원 전용 콘텐츠 판별 (access === "member") ──
export interface MemberAccessLike {
  access?: string;
}
export function rtIsMemberOnly(art?: MemberAccessLike | null): boolean {
  return !!(art && art.access === 'member');
}
export function rtMemberLocked(art?: MemberAccessLike | null): boolean {
  return rtIsMemberOnly(art) && rtIsGuest();
}
