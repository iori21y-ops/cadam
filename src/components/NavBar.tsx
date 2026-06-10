'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoAnimated } from '@/components/icons/LogoAnimated';

export function NavBar() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  // /estimate 견적 마법사는 집중 퍼널 — 상단 내비게이션 숨김
  if (pathname?.startsWith('/estimate')) return null;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border-solid overflow-hidden lg:max-w-2xl lg:mx-auto">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center w-full">
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
        >
          <LogoAnimated size={28} />
        </Link>
      </div>
    </nav>
  );
}
