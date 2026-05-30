import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from '@/lib/supabase-server';

export async function POST(request: Request) {
  // 인증 확인 (anon 키 + 쿠키 세션)
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (process.env.ADMIN_EMAIL && user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: '요청 형식 오류' }, { status: 400 }); }

  const { slug, spinStartFrame } = body as Record<string, unknown>;

  if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'slug 형식 오류' }, { status: 400 });
  }
  if (typeof spinStartFrame !== 'number' || !Number.isInteger(spinStartFrame) || spinStartFrame < 0) {
    return NextResponse.json({ error: 'spinStartFrame 형식 오류' }, { status: 400 });
  }

  // DB 쓰기: service_role로 RLS 우회
  const db = createServiceRoleSupabaseClient();
  const { error } = await db
    .from('vehicles')
    .update({ spin_start_frame: spinStartFrame })
    .eq('slug', slug);

  if (error) {
    console.error('[update-spin-frame] DB error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/');
  revalidatePath(`/cars/${slug}`);

  return NextResponse.json({ ok: true, slug, spinStartFrame });
}
