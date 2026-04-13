'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavBar() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border-solid overflow-hidden">
      <div className="max-w-[1024px] mx-auto px-5 py-3 flex items-center w-full">
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
      </div>
    </nav>
  );
}
