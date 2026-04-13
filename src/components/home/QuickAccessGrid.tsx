import Link from 'next/link';
import { Car, Sparkles, Calculator, BookOpen, Gift, MessageCircle } from 'lucide-react';

const ITEMS = [
  { label: '인기차종', href: '/popular-estimates', icon: Car },
  { label: 'AI진단', href: '/diagnosis', icon: Sparkles },
  { label: '견적비교', href: '/quote', icon: Calculator },
  { label: '렌트가이드', href: '/info', icon: BookOpen },
  { label: '프로모션', href: '/promotions', icon: Gift },
  { label: '상담신청', href: '/quote', icon: MessageCircle },
] as const;

export function QuickAccessGrid() {
  return (
    <section className="bg-surface py-12 px-5">
      <div className="max-w-2xl mx-auto grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
        {ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-background rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
              <Icon className="w-6 h-6 text-primary" strokeWidth={1.8} />
            </div>
            <span className="text-primary text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
