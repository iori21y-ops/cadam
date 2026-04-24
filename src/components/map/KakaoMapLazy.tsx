'use client';

import dynamic from 'next/dynamic';

const KakaoMapDynamic = dynamic(() => import('./KakaoMap'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center rounded-xl border border-border-solid bg-surface"
      style={{ height: '560px' }}
    >
      <div className="flex flex-col items-center gap-3 text-text-sub">
        <div className="w-8 h-8 border-2 border-t-transparent border-primary rounded-full animate-spin" />
        <span className="text-sm">지도를 불러오는 중…</span>
      </div>
    </div>
  ),
});

export function KakaoMapLazy() {
  return <KakaoMapDynamic />;
}
