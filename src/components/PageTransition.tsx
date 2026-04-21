'use client';

import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePageTransitionStore } from '@/store/pageTransitionStore';

export function PageTransition({ children }: { children: React.ReactNode }) {
  // SSR + 초기 클라이언트 렌더에서는 framer-motion 없이 children 직접 반환.
  // hydration 완료 후 페이지 전환 애니메이션 활성화.
  const [hydrated, setHydrated] = useState(false);
  const pending = usePageTransitionStore((s) => s.pending);
  const transitionId = usePageTransitionStore((s) => s.transitionId);
  const consume = usePageTransitionStore((s) => s.consume);
  const lastConsumedTransitionRef = useRef<number>(-1);
  // key는 transitionId만 사용 — pending 변경 시 슬라이드 이중 재시작 방지
  const key = `t:${transitionId}`;

  useEffect(() => { setHydrated(true); }, []);

  if (!hydrated) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        initial={pending ? { opacity: 0, x: 40 } : { opacity: 1, x: 0 }}
        animate={{ opacity: 1, x: 0 }}
        exit={pending ? { opacity: 0, x: -40 } : { opacity: 1, x: 0 }}
        transition={{ duration: pending ? 0.45 : 0, ease: 'easeOut' }}
        onAnimationComplete={() => {
          // 같은 전환에서 onAnimationComplete가 여러 번 불려도 consume은 1회만
          if (pending && lastConsumedTransitionRef.current !== transitionId) {
            lastConsumedTransitionRef.current = transitionId;
            consume();
          }
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

