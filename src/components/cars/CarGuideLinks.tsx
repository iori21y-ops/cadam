import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getAllGuides } from '@/lib/guide';

// 차량 상세 하단 노출 가이드 4편 (노출 순서 고정)
const GUIDE_SLUGS = [
  'contract-end-options',
  'early-termination',
  'mileage-limit',
  'accident-deductible',
  'tax-benefit',
];

export async function CarGuideLinks() {
  const guides = await getAllGuides();
  const bySlug = new Map(guides.map((g) => [g.slug, g]));
  const items = GUIDE_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (g): g is NonNullable<typeof g> => Boolean(g)
  );

  if (items.length === 0) return null;

  return (
    <section className="px-5 py-8">
      <h2 className="text-lg font-bold text-text mb-5">장기렌터카 가이드</h2>
      <ul className="flex flex-col gap-2">
        {items.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guide/${g.slug}`}
              className="flex items-center justify-between p-4 rounded-2xl bg-white border border-accent text-sm font-bold text-text hover:bg-accent/5 transition-colors"
            >
              <span className="pr-3 leading-snug">{g.title}</span>
              <ChevronRight size={18} className="text-accent shrink-0" strokeWidth={1.8} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
