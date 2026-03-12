'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase';

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/consultations', label: '상담 관리' },
  { href: '/admin/info', label: '정보관리' },
  { href: '/admin/promotions', label: '프로모션 관리' },
  { href: '/admin/prices', label: '인기차종 관리' },
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
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-100">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
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
    <div className="min-h-[100dvh] flex flex-col bg-gray-100">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 py-3 flex items-center gap-4 min-w-0">
          <Link
            href="/admin"
            className="text-base font-extrabold text-primary shrink-0"
          >
            카담 Admin
          </Link>
          <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 scrollbar-hide">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-accent text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
