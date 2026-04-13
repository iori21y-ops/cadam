'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Car, Sparkles, BookOpen, MessageCircle } from 'lucide-react';

const TABS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/popular-estimates', label: '차량', icon: Car },
  { href: '/diagnosis', label: 'AI진단', icon: Sparkles },
  { href: '/info', label: '정보', icon: BookOpen },
  { href: '/quote', label: '상담', icon: MessageCircle },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const [bottomOffset, setBottomOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      setBottomOffset(Math.max(0, offset));
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('resize', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // admin 페이지에서는 숨김
  if (pathname?.startsWith('/admin')) return null;

  return (
    <div
      ref={navRef}
      className="fixed left-0 right-0 z-50 px-4 pointer-events-none md:hidden"
      style={{ bottom: `${bottomOffset}px` }}
    >
      <nav className="bg-white rounded-2xl shadow-md shadow-black/8 border border-accent flex items-center justify-around py-2 pointer-events-auto">
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
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1"
            >
              <Icon
                className={`w-6 h-6 transition-colors ${
                  isActive ? 'text-accent' : 'text-gray-400'
                }`}
                strokeWidth={isActive ? 2 : 1.5}
                fill={isActive ? 'currentColor' : 'none'}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? 'text-accent' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
