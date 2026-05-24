'use client';

import { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'articles', label: '아티클' },
  { id: 'cardnews', label: '카드뉴스' },
  { id: 'clips', label: '클립' },
  { id: 'terms', label: '약관비교' },
] as const;

export function InfoSectionNav() {
  const [activeId, setActiveId] = useState<string>('articles');

  useEffect(() => {
    // NavBar(52px) + InfoSectionNav(44px) = 96px 오프셋
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-96px 0px -60% 0px' }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  return (
    // NavBar(52px) 바로 아래 sticky
    <div className="sticky top-[52px] z-30 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="flex max-w-2xl mx-auto px-5 overflow-x-auto scrollbar-hide">
        {SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => handleClick(e, id)}
            className={[
              'px-4 py-3 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
              activeId === id
                ? 'border-gray-900 text-gray-900 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-900 font-medium',
            ].join(' ')}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}
