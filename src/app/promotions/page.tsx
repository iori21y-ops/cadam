import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const revalidate = 3600;

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
}

interface PromotionRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
}

function isWithinDateRange(row: PromotionRow, today: string): boolean {
  if (row.start_date && row.start_date > today) return false;
  if (row.end_date && row.end_date < today) return false;
  return true;
}

async function getPromotions(): Promise<Promotion[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('promotions')
      .select('id, title, description, image_url, link_url, is_active, display_order, start_date, end_date')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) return [];

    const today = new Date().toISOString().slice(0, 10);
    return (data as PromotionRow[])
      .filter((row) => isWithinDateRange(row, today))
      .map(({ id, title, description, image_url, link_url }) => ({
        id,
        title,
        description,
        imageUrl: image_url,
        linkUrl: link_url,
      }));
  } catch {
    return [];
  }
}

export default async function PromotionsPage() {
  const promotions = await getPromotions();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-5 py-16 min-h-[40vh] bg-gradient-to-br from-primary to-accent text-white text-center">
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
          이달의 프로모션
        </h1>
        <p className="text-base sm:text-lg text-white/90 mb-6">
          카담에서 진행 중인 특별 혜택을 확인하세요
        </p>
        <Link
          href="/quote"
          className="px-8 py-3.5 rounded-lg font-bold text-accent bg-white hover:opacity-90 transition-opacity"
        >
          무료 견적 받기
        </Link>
      </section>

      {/* 프로모션 목록 */}
      <section className="px-5 py-12 flex-1">
        {promotions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-lg mb-2">
              현재 진행 중인 프로모션이 없습니다
            </p>
            <p className="text-gray-400 text-sm">
              새로운 혜택을 준비 중입니다. 곧 만나보세요!
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-6 justify-center">
            {promotions.map((p) => {
              const cardContent = (
                <>
                  <div className="aspect-[16/10] bg-gray-200 flex items-center justify-center">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">배너 이미지</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                      {p.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {p.description ?? '-'}
                    </p>
                  </div>
                </>
              );
              const className =
                'flex flex-col flex-shrink-0 w-full sm:w-[280px] rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow';
              return p.linkUrl ? (
                <a key={p.id} href={p.linkUrl} className={className}>
                  {cardContent}
                </a>
              ) : (
                <div key={p.id} className={className}>
                  {cardContent}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
