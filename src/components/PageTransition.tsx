'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { usePageTransitionStore } from '@/store/pageTransitionStore';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pending = usePageTransitionStore((s) => s.pending);
  const consume = usePageTransitionStore((s) => s.consume);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    const prev = prevPathnameRef.current;
    if (prev !== pathname && pending) {
      const t = window.setTimeout(() => consume(), 450);
      return () => window.clearTimeout(t);
    }
    prevPathnameRef.current = pathname;
  }, [pathname, pending, consume]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={pending ? { opacity: 0, x: 40 } : { opacity: 1, x: 0 }}
        animate={{ opacity: 1, x: 0 }}
        exit={pending ? { opacity: 0, x: -40 } : { opacity: 1, x: 0 }}
        transition={{ duration: pending ? 0.45 : 0, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

