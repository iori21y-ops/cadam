'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Car, Sparkles, BookOpen, MessageCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: '홈', icon: Home },
  { href: '/popular-estimates', label: '차량', icon: Car },
  { href: '/diagnosis', label: 'AI진단', icon: Sparkles },
  { href: '/info', label: '정보', icon: BookOpen },
  { href: '/quote', label: '상담', icon: MessageCircle },
];

export function MobileTabBar() {
  const pathname = usePathname();

  // admin 페이지에서는 숨김
  if (pathname?.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {TABS.map((tab) => {
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${
                isActive ? 'text-accent' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.8} />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
