import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { getMemberId } from '@/lib/member-session';

// GET — 게시된 커뮤니티 글 목록(+답변 수). 비로그인도 목록은 열람(상세는 게이트 가능).
export async function GET() {
  const supabase = createServiceRoleSupabaseClient();
  const { data: posts, error } = await supabase
    .from('community_posts')
    .select('id, car, topic, title, body, like_count, view_count, created_at, member_id')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    console.error('community posts GET error:', error);
    return NextResponse.json({ posts: [] });
  }
  // 답변 수 집계(간단 — 글별 카운트)
  const ids = (posts ?? []).map((p) => p.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: ans } = await supabase.from('community_answers').select('post_id').in('post_id', ids);
    (ans ?? []).forEach((a) => {
      counts[a.post_id as string] = (counts[a.post_id as string] ?? 0) + 1;
    });
  }
  return NextResponse.json({
    posts: (posts ?? []).map((p) => ({ ...p, answer_count: counts[p.id] ?? 0 })),
  });
}

const createSchema = z.object({
  car: z.string().max(80).optional(),
  topic: z.enum(['quote', 'cost', 'fix', 'end', 'ev']).optional(),
  title: z.string().min(1).max(160),
  body: z.string().max(8000).optional(),
});

// POST — 질문 작성(회원 전용).
export async function POST(request: NextRequest) {
  const memberId = await getMemberId();
  if (!memberId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });
  const v = parsed.data;
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('community_posts')
    .insert({ member_id: memberId, car: v.car ?? null, topic: v.topic ?? null, title: v.title, body: v.body ?? null })
    .select('id')
    .single();
  if (error || !data) {
    console.error('community posts POST error:', error);
    return NextResponse.json({ ok: false, error: 'create_failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
