import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// 홈 CMS — 빌보드 슬라이드 + 섹션 행 구성 (anon 클라이언트, RLS: is_active=true 만 read).
// 에러·빈결과·RLS거부·테이블 미존재 → 전부 빈 배열 반환(throw 금지) → 홈이 하드코딩 폴백으로 강등.

interface SlideRow {
  id: string;
  car_id: string;
  kicker: string;
  title: string;
  sub: string | null;
  display_order: number | null;
}
interface SectionRow {
  id: string;
  title: string;
  section_type: string;
  params: unknown;
  display_order: number | null;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const [slideRes, sectionRes] = await Promise.all([
      supabase
        .from('billboard_slides')
        .select('id, car_id, kicker, title, sub, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true, nullsFirst: false }),
      supabase
        .from('home_sections')
        .select('id, title, section_type, params, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true, nullsFirst: false }),
    ]);

    if (slideRes.error) console.error('billboard_slides query error:', slideRes.error);
    if (sectionRes.error) console.error('home_sections query error:', sectionRes.error);

    const slides = (slideRes.error ? [] : (slideRes.data as SlideRow[]) ?? []).map((r) => ({
      id: r.id,
      carId: r.car_id,
      kicker: r.kicker,
      title: r.title,
      sub: r.sub ?? null,
      displayOrder: r.display_order ?? 0,
    }));

    const sections = (sectionRes.error ? [] : (sectionRes.data as SectionRow[]) ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      sectionType: r.section_type,
      params: r.params ?? {},
      displayOrder: r.display_order ?? 0,
    }));

    return NextResponse.json(
      { slides, sections },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    );
  } catch (err) {
    console.error('home-cms API error:', err);
    return NextResponse.json({ slides: [], sections: [] });
  }
}
