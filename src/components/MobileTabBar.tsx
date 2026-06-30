'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Car,
  Bot,
  BookOpen,
  MessageCircle,
} from 'lucide-react';

const tabs = [
  { href: '/', label: '홈', Icon: Home },
  { href: '/popular-estimates', label: '차량', Icon: Car },
  { href: '/diagnosis', label: 'AI진단', Icon: Bot },
  { href: '/info', label: '정보', Icon: BookOpen },
  { href: '/quote', label: '상담', Icon: MessageCircle },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) return null;
  // /estimate 견적 마법사는 집중 퍼널 — 하단 탭바 숨김(CTA 가림 방지)
  if (pathname.startsWith('/estimate')) return null;
  // '/' = 시네마틱 홈(자체 RtTabBar 보유) — 전역 하단 탭바 숨김(중복 방지)
  if (pathname === '/') return null;

  return (
    <>
      <div className="h-20 md:hidden bg-surface-secondary" aria-hidden="true" />
      <div
        className="fixed inset-0 pointer-events-none flex flex-col justify-end z-50 md:hidden"
        style={{ willChange: 'transform' }}
      >
        <nav
          className="pointer-events-auto mx-4 mb-2 rounded-2xl bg-white shadow-md border border-accent"
        >
          <div className="flex items-center justify-around h-16">
            {tabs.map(({ href, label, Icon }) => {
              const isActive =
                href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                    isActive ? 'text-accent' : 'text-gray-400'
                  }`}
                >
                  <Icon
                    size={22}
                    fill={isActive ? 'currentColor' : 'none'}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
