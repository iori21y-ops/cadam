'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDragScroll } from '@/hooks/useDragScroll';
import { BRAND } from '@/constants/brand';

const NAV_ITEMS = [
  { href: '/diagnosis', label: 'AI 진단' },
  { href: '/popular-estimates', label: '인기차종' },
  { href: '/info', label: '정보' },
  { href: '/promotions', label: '프로모션' },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const dragScroll = useDragScroll();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border-solid overflow-hidden">
      <div className="max-w-[1024px] mx-auto px-5 py-3 flex items-center gap-3 w-full min-w-0">
        <Link
          href="/"
          className="text-[15px] font-bold text-text shrink-0 hover:text-primary transition-colors"
        >
          {BRAND.navLogo}
        </Link>
        <div
          ref={dragScroll.ref}
          onMouseDown={dragScroll.onMouseDown}
          onMouseLeave={dragScroll.onMouseLeave}
          onMouseUp={dragScroll.onMouseUp}
          onMouseMove={dragScroll.onMouseMove}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide cursor-grab select-none flex-1 min-w-0"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/diagnosis'
                ? pathname === '/diagnosis' || pathname?.startsWith('/quote') || (pathname?.startsWith('/diagnosis/') && !pathname?.startsWith('/diagnosis/calculator'))
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-sub hover:text-primary hover:bg-primary/5'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <Link
          href="/admin"
          className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
        >
          관리자
        </Link>
      </div>
    </nav>
  );
}
