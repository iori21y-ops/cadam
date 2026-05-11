import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  const { error } = await supabase
    .from('vehicles')
    .update({ spin_start_frame: spinStartFrame })
    .eq('slug', slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
