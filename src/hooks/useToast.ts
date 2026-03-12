'use client';

import { useCallback } from 'react';
import { useToastStore, type ToastVariant } from '@/store/toastStore';

export function useToast() {
  const showToast = useToastStore((s) => s.showToast);

  const show = useCallback(
    (message: string, variant?: ToastVariant) => {
      showToast(message, variant ?? 'error');
    },
    [showToast]
  );

  return { showToast: show };
}
