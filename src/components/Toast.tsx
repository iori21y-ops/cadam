'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/store/toastStore';

const VARIANT_STYLES = {
  error: 'bg-danger text-white',
  success: 'bg-success text-white',
  warning: 'bg-warning text-white',
} as const;

const DURATION_MS = 3000;

export function Toast() {
  const { message, variant, isVisible, hideToast } = useToastStore();

  useEffect(() => {
    if (!isVisible || !message) return;

    const timer = setTimeout(() => {
      hideToast();
    }, DURATION_MS);

    return () => clearTimeout(timer);
  }, [isVisible, message, hideToast]);

  return (
    <AnimatePresence>
      {isVisible && message && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.3,
            ease: 'easeOut',
          }}
          className={`fixed left-1/2 -translate-x-1/2 z-[9999] rounded-lg px-5 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.15)] ${VARIANT_STYLES[variant]}`}
          style={{
            bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <span className="text-sm font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
