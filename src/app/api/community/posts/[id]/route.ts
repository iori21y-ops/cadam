import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

// GET — 글 상세 + 답변 + (답변별) 댓글. 게시된 글만.
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = createServiceRoleSupabaseClient();

  const { data: post } = await supabase
    .from('community_posts')
    .select('id, car, topic, title, body, like_count, view_count, created_at, status')
    .eq('id', id)
    .maybeSingle();
  if (!post || post.status !== 'published') {
    return NextResponse.json({ post: null }, { status: 404 });
  }

  const { data: answers } = await supabase
    .from('community_answers')
    .select('id, author_member_id, manager_id, is_official, badge, body, helpful_count, created_at')
    .eq('post_id', id)
    .order('is_official', { ascending: false })
    .order('helpful_count', { ascending: false })
    .order('created_at', { ascending: true });

  const answerIds = (answers ?? []).map((a) => a.id);
  let comments: unknown[] = [];
  if (answerIds.length) {
    const { data: cdata } = await supabase
      .from('community_comments')
      .select('id, answer_id, member_id, body, created_at')
      .in('answer_id', answerIds)
      .order('created_at', { ascending: true });
    comments = cdata ?? [];
  }

  return NextResponse.json({ post, answers: answers ?? [], comments });
}
