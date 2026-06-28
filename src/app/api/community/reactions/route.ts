import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { getMemberId } from '@/lib/member-session';

const schema = z.object({
  targetType: z.enum(['post', 'answer']),
  targetId: z.string().uuid(),
  kind: z.enum(['like', 'helpful', 'curious']),
});

// POST — 좋아요/도움됐어요/궁금해요 토글(회원 전용). 멱등: 이미 있으면 취소, 없으면 추가.
export async function POST(request: NextRequest) {
  const memberId = await getMemberId();
  if (!memberId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });
  const { targetType, targetId, kind } = parsed.data;
  const supabase = createServiceRoleSupabaseClient();

  const { data: existing } = await supabase
    .from('community_reactions')
    .select('id')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('member_id', memberId)
    .eq('kind', kind)
    .maybeSingle();

  let active: boolean;
  if (existing) {
    await supabase.from('community_reactions').delete().eq('id', existing.id);
    active = false;
  } else {
    await supabase
      .from('community_reactions')
      .insert({ target_type: targetType, target_id: targetId, member_id: memberId, kind });
    active = true;
  }
  return NextResponse.json({ ok: true, active });
}
