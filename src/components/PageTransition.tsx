'use client';

import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePageTransitionStore } from '@/store/pageTransitionStore';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pending = usePageTransitionStore((s) => s.pending);
  const transitionId = usePageTransitionStore((s) => s.transitionId);
  const consume = usePageTransitionStore((s) => s.consume);
  const lastConsumedTransitionRef = useRef<number>(-1);
  // 전환 1회(transitionId 1 증가)당 key는 1번만 바뀌어야 합니다.
  // pending(true->false)로 key가 바뀌면 슬라이드가 2번 재시작될 수 있으므로, key는 transitionId만 사용합니다.
  const key = `t:${transitionId}`;

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

