'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * 관리자 모드 토글 페이지
 *
 * - `/admin-mode`        → 관리자 모드 활성화 (localStorage admin_mode=true)
 * - `/admin-mode?off=1`  → 관리자 모드 해제 (localStorage 에서 admin_mode 제거)
 *
 * 관리자 모드인 브라우저에서는 GA 데이터가 전송되지 않는다.
 * localStorage 접근은 클라이언트 전용이므로 useEffect 안에서만 실행한다.
 */
function AdminModeInner() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const off = searchParams.get('off');
    if (off === '1') {
      localStorage.removeItem('admin_mode');
      setMessage('관리자 모드가 해제되었습니다.');
    } else {
      localStorage.setItem('admin_mode', 'true');
      setMessage('관리자 모드가 활성화되었습니다. 이 브라우저에서는 GA 데이터가 전송되지 않습니다.');
    }
  }, [searchParams]);

  return (
    <main style={{ padding: '40px 20px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>관리자 모드</h1>
      <p style={{ fontSize: 15, lineHeight: 1.6 }}>{message}</p>
    </main>
  );
}

export default function AdminModePage() {
  return (
    <Suspense fallback={null}>
      <AdminModeInner />
    </Suspense>
  );
}
