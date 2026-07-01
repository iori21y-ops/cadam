import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { getMemberId } from '@/lib/member-session';

// 회원 찜(관심 차량) API — 본인 것만. 소유권 방어선은 모든 쿼리의 .eq('member_id', memberId).
// favorites 는 SELECT RLS(auth.uid 기반)만 있고 이 앱은 Supabase Auth 미사용 → service_role BFF 경유 전제.

// GET: 내 찜 목록 (최신순)
export async function GET() {
  const memberId = await getMemberId();
  if (!memberId) return NextResponse.json({ favorites: null }, { status: 401 });

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('favorites')
    .select('id, vehicle_slug, created_at')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[favorites GET]', error);
    return NextResponse.json({ error: '찜 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
  // 차량 표시정보(name, image_key) 병합 — favorites→vehicles FK 없어 2쿼리 병합
  const rows = data ?? [];
  const slugs = [...new Set(rows.map((r) => r.vehicle_slug).filter(Boolean))];
  let vmap: Record<string, { name: string | null; image_key: string | null }> = {};
  if (slugs.length > 0) {
    const { data: vehicles, error: vErr } = await supabase
      .from('vehicles')
      .select('slug, name, image_key')
      .in('slug', slugs);
    if (vErr) {
      console.error('[favorites GET vehicles]', vErr);
    } else {
      vmap = Object.fromEntries(
        (vehicles ?? []).map((v) => [v.slug, { name: v.name, image_key: v.image_key ? (v.image_key.endsWith('-v2') ? v.image_key : `${v.image_key}-v2`) : null }])
      );
    }
  }
  const favorites = rows.map((r) => ({
    ...r,
    name: vmap[r.vehicle_slug]?.name ?? null,
    image_key: vmap[r.vehicle_slug]?.image_key ?? null,
  }));
  return NextResponse.json({ favorites });
}

// POST: 찜 추가 (중복은 409)
export async function POST(req: NextRequest) {
  const memberId = await getMemberId();
  if (!memberId) return NextResponse.json({ favorite: null }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { vehicle_slug?: unknown } | null;
  const vehicle_slug = body?.vehicle_slug;
  if (typeof vehicle_slug !== 'string' || !vehicle_slug) {
    return NextResponse.json({ error: 'vehicle_slug required' }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('favorites')
    .insert({ member_id: memberId, vehicle_slug })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'already favorited' }, { status: 409 });
    }
    console.error('[favorites POST]', error);
    return NextResponse.json({ error: '찜을 추가하지 못했습니다.' }, { status: 500 });
  }
  return NextResponse.json({ favorite: data }, { status: 201 });
}

// DELETE: 찜 삭제 (?vehicle_slug=). member_id 필터로 타인 찜 삭제 방지.
export async function DELETE(req: NextRequest) {
  const memberId = await getMemberId();
  if (!memberId) return NextResponse.json({ ok: false }, { status: 401 });

  const vehicle_slug = req.nextUrl.searchParams.get('vehicle_slug');
  if (!vehicle_slug) {
    return NextResponse.json({ error: 'vehicle_slug required' }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('member_id', memberId)
    .eq('vehicle_slug', vehicle_slug);

  if (error) {
    console.error('[favorites DELETE]', error);
    return NextResponse.json({ error: '찜을 삭제하지 못했습니다.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
