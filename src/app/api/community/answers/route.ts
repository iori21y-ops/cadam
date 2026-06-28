import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { getMemberId } from '@/lib/member-session';

const schema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(1).max(8000),
  badge: z.string().max(40).optional(),
});

// POST — 답변 작성(회원 전용). 공식답변(매니저)은 ERP 경유 — 여기선 차주 답변만.
export async function POST(request: NextRequest) {
  const memberId = await getMemberId();
  if (!memberId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });
  const v = parsed.data;
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('community_answers')
    .insert({ post_id: v.postId, author_member_id: memberId, is_official: false, badge: v.badge ?? null, body: v.body })
    .select('id')
    .single();
  if (error || !data) {
    console.error('community answers POST error:', error);
    return NextResponse.json({ ok: false, error: 'create_failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
