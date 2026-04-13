'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDragScroll } from '@/hooks/useDragScroll';
import { BRAND } from '@/constants/brand';

const NAV_ITEMS = [
  { href: '/popular-estimates', label: '인기차종' },
  { href: '/info', label: '정보' },
  { href: '/promotions', label: '프로모션' },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const dragScroll = useDragScroll();
  if (pathname === '/' || pathname?.startsWith('/admin')) return null;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border-solid overflow-hidden">
      <div className="max-w-[1024px] mx-auto px-5 py-3 flex items-center gap-3 w-full min-w-0">
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
        >
          <img src="/rentailor-mark.svg" alt="" className="h-7 w-auto" />
          <span
            className="text-[17px] font-semibold text-text tracking-tight"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            RenTailor
          </span>
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
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-sub hover:text-accent hover:bg-accent/5'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <Link
          href="/admin"
          className="hidden shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
        >
          관리자
        </Link>
      </div>
    </nav>
  );
}
