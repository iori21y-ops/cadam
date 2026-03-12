'use client';

import dynamic from 'next/dynamic';

const Toast = dynamic(() => import('@/components/Toast').then((m) => ({ default: m.Toast })), {
  ssr: false,
});

export function DynamicToast() {
  return <Toast />;
}
