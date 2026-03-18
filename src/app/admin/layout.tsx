'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { useDragScroll } from '@/hooks/useDragScroll';

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/consultations', label: '상담 관리' },
  { href: '/admin/info', label: '정보관리' },
  { href: '/admin/promotions', label: '프로모션 관리' },
  { href: '/admin/prices', label: '인기차종 관리' },
  { href: '/admin/diagnosis', label: '진단 관리' },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const dragScroll = useDragScroll();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsChecking(false);
      if (session) {
        setIsAuthenticated(true);
        if (isLoginPage) {
          router.replace('/admin');
        }
      } else {
        setIsAuthenticated(false);
        if (!isLoginPage) {
          router.replace('/admin/login');
        }
      }
    });
  }, [isLoginPage, router]);

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  if (isChecking) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-surface-secondary">
        <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoginPage && !isAuthenticated) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface-secondary">
      <nav className="sticky top-0 z-50 glass border-b border-[#E5E5EA] overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 py-3 flex items-center gap-4 min-w-0">
          <Link
            href="/admin"
            className="text-base font-extrabold text-[#1D1D1F] shrink-0"
          >
            카담 Admin
          </Link>
          <div
            ref={dragScroll.ref}
            onMouseDown={dragScroll.onMouseDown}
            onMouseLeave={dragScroll.onMouseLeave}
            onMouseUp={dragScroll.onMouseUp}
            onMouseMove={dragScroll.onMouseMove}
            className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 scrollbar-hide cursor-grab select-none"
          >
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#007AFF] text-white'
                      : 'text-[#86868B] hover:bg-[#007AFF0D] hover:text-[#007AFF]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold text-[#86868B] hover:bg-[#007AFF0D] hover:text-[#007AFF] transition-colors"
          >
            로그아웃
          </button>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
