'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/popular-estimates', label: '차량', icon: '🚗' },
  { href: '/diagnosis', label: 'AI진단', icon: '🎯' },
  { href: '/info', label: '정보', icon: '💡' },
  { href: '/quote', label: '상담', icon: '📞' },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  // admin 페이지에서는 숨김
  if (pathname?.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] md:hidden">
      <div className="max-w-[1024px] mx-auto flex items-center justify-around px-2 py-2">
        {TABS.map((tab) => {
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-0 ${
                isActive
                  ? 'text-[#C9A84C]'
                  : 'text-[#9CA3AF] hover:text-[#C9A84C]'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-medium truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for iPhone */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
