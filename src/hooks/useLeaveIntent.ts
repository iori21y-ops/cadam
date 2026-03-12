'use client';

import { useEffect, useRef } from 'react';

const LEAVE_INTENT_SESSION_KEY = 'cadam-leave-intent-shown';

/**
 * 이탈 감지 훅
 * - Desktop: 마우스 Y ≤ 0 (뷰포트 상단 이탈)
 * - Mobile: popstate 이벤트 (뒤로가기 시도, pushState로 히스토리 트랩)
 * - 조건: Step 2 이상, 세션당 1회만 트리거
 */
export function useLeaveIntent(
  currentStep: number,
  onLeaveIntent: () => void
): void {
  const hasTriggered = useRef(false);
  const hasPushedState = useRef(false);

  useEffect(() => {
    if (currentStep < 2) return;

    // 세션당 1회: 이미 표시했으면 리스너 등록 안 함
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(LEAVE_INTENT_SESSION_KEY)) {
      return;
    }

    // Mobile: popstate를 받으려면 먼저 pushState로 히스토리 항목 추가
    if (!hasPushedState.current) {
      hasPushedState.current = true;
      window.history.pushState({ cadamQuote: true }, '', window.location.pathname);
    }

    const handleMouseLeave = (e: MouseEvent) => {
      if (hasTriggered.current) return;
      if (e.clientY <= 0) {
        hasTriggered.current = true;
        sessionStorage.setItem(LEAVE_INTENT_SESSION_KEY, '1');
        onLeaveIntent();
      }
    };

    const handlePopState = () => {
      if (hasTriggered.current) return;
      hasTriggered.current = true;
      sessionStorage.setItem(LEAVE_INTENT_SESSION_KEY, '1');
      // 뒤로가기 취소: 다시 pushState하여 현재 페이지 유지
      window.history.pushState({ cadamQuote: true }, '', window.location.pathname);
      onLeaveIntent();
    };

    // Desktop: mouseleave는 document에서 Y 좌표로 판단
    document.addEventListener('mouseout', handleMouseLeave);

    // Mobile: 뒤로가기 시도 시 popstate
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('mouseout', handleMouseLeave);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentStep, onLeaveIntent]);
}
