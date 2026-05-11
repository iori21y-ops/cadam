'use client';

import { useRef, useState, useEffect } from 'react';
import { usePageTransitionStore } from '@/store/pageTransitionStore';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const pending = usePageTransitionStore((s) => s.pending);
  const transitionId = usePageTransitionStore((s) => s.transitionId);
  const consume = usePageTransitionStore((s) => s.consume);
  const lastConsumedTransitionRef = useRef<number>(-1);
  const key = `t:${transitionId}`;

  useEffect(() => { setHydrated(true); }, []);

  if (!hydrated) return <>{children}</>;

  return (
    <div
      key={key}
      className={pending ? 'page-enter' : undefined}
      onAnimationEnd={() => {
        if (pending && lastConsumedTransitionRef.current !== transitionId) {
          lastConsumedTransitionRef.current = transitionId;
          consume();
        }
      }}
    >
      {children}
    </div>
  );
}
