'use client';

import dynamic from 'next/dynamic';

// DiagnosisBanner: localStorage 전용 클라이언트 컴포넌트.
// 클라이언트 래퍼에서 dynamic ssr:false — 초기 JS 번들에서 제외.
const DiagnosisBannerDynamic = dynamic(
  () => import('./DiagnosisBanner').then((m) => ({ default: m.DiagnosisBanner })),
  { ssr: false }
);

export function DiagnosisBannerLazy() {
  return <DiagnosisBannerDynamic />;
}
