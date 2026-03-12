import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

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

function isWithinDateRange(
  row: PromotionRow,
  today: string
): boolean {
  if (row.start_date && row.start_date > today) return false;
  if (row.end_date && row.end_date < today) return false;
  return true;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('promotions')
      .select('id, title, description, image_url, link_url, is_active, display_order, start_date, end_date')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('promotions query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch promotions' },
        { status: 500 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const promotions = (data as PromotionRow[])
      .filter((row) => isWithinDateRange(row, today))
      .map(({ id, title, description, image_url, link_url }) => ({
        id,
        title,
        description,
        imageUrl: image_url,
        linkUrl: link_url,
      }));

    return NextResponse.json({ promotions }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (err) {
    console.error('Promotions API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
