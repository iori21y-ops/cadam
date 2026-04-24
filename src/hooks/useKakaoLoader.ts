'use client';

import { useEffect, useState } from 'react';

export type KakaoLoadState = 'idle' | 'loading' | 'ready' | 'error';

// Module-level singleton: survives component remounts
let _state: KakaoLoadState = 'idle';
const _subs = new Set<(s: KakaoLoadState) => void>();

function _notify(s: KakaoLoadState) {
  _state = s;
  _subs.forEach(fn => fn(s));
}

export function useKakaoLoader(): KakaoLoadState {
  const [state, setState] = useState<KakaoLoadState>(() => _state);

  useEffect(() => {
    _subs.add(setState);
    return () => void _subs.delete(setState);
  }, []);

  useEffect(() => {
    if (_state !== 'idle') return;

    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim();
    if (!key) { _notify('error'); return; }

    _notify('loading');

    if (window.kakao?.maps?.load) {
      window.kakao.maps.load(() => _notify('ready'));
      return;
    }

    const existing = document.querySelector('script[src*="dapi.kakao.com/v2/maps"]');
    if (existing) {
      const onLoad = () => window.kakao.maps.load(() => _notify('ready'));
      existing.addEventListener('load', onLoad);
      return () => existing.removeEventListener('load', onLoad);
    }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services,clusterer&autoload=false`;
    script.onload = () => window.kakao.maps.load(() => _notify('ready'));
    script.onerror = () => _notify('error');
    document.head.appendChild(script);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
