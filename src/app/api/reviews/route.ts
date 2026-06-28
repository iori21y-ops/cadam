import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { getMemberId } from '@/lib/member-session';

// GET — 게시된 고객 후기 목록(공개).
export async function GET() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, display_name, car, method, rating, title, body, saved_was, saved_now, published_at, created_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('reviews GET error:', error);
    return NextResponse.json({ reviews: [] });
  }
  return NextResponse.json({ reviews: data ?? [] });
}

const createSchema = z.object({
  car: z.string().max(80).optional(),
  method: z.string().max(40).optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(1).max(4000),
  displayName: z.string().max(40).optional(),
  savedWas: z.number().int().nullable().optional(),
  savedNow: z.number().int().nullable().optional(),
});

// POST — 후기 작성(회원 전용). status='pending'(운영자 검수 후 published).
export async function POST(request: NextRequest) {
  const memberId = await getMemberId();
  if (!memberId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });
  const v = parsed.data;

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      member_id: memberId,
      display_name: v.displayName ?? null,
      car: v.car ?? null,
      method: v.method ?? null,
      rating: v.rating,
      title: v.title ?? null,
      body: v.body,
      saved_was: v.savedWas ?? null,
      saved_now: v.savedNow ?? null,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error || !data) {
    console.error('reviews POST error:', error);
    return NextResponse.json({ ok: false, error: 'create_failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id, status: 'pending' });
}
