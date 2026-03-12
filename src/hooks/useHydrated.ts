'use client';

import { useEffect, useState } from 'react';

/**
 * Zustand persist는 클라이언트(localStorage)에서만 작동하므로
 * SSR 시 서버와 클라이언트의 초기 상태가 달라 Hydration mismatch가 발생한다.
 * 이 훅은 마운트 완료 후에만 true를 반환하여, persist 스토어를 사용하는
 * 컴포넌트가 클라이언트에서만 실제 UI를 렌더링하도록 한다.
 *
 * 사용 예:
 * const hydrated = useHydrated();
 * if (!hydrated) return <Skeleton />; // 또는 null
 * return <ContentWithPersistedState />;
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Hydration detection: must run after mount to avoid SSR mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional for hydration
    setHydrated(true);
  }, []);

  return hydrated;
}
