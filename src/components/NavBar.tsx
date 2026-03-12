'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/quote', label: '무료 견적' },
  { href: '/info', label: '정보' },
  { href: '/promotions', label: '프로모션' },
] as const;

export function NavBar() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="min-w-[360px] max-w-[1024px] mx-auto px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="text-sm font-extrabold text-primary shrink-0 hover:text-accent transition-colors"
        >
          카담(CADAM)
        </Link>
        <div className="flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : item.href === '/quote'
                  ? pathname?.startsWith('/quote')
                  : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-accent text-white border border-accent'
                    : 'border border-gray-200 text-gray-700 hover:border-accent hover:text-accent'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/admin"
            className="px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"
          >
            관리자
          </Link>
        </div>
      </div>
    </nav>
  );
}
