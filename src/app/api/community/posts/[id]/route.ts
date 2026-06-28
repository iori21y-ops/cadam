import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { getMemberId } from '@/lib/member-session';

// GET — 글 상세. 게시된 글의 제목/본문은 공개(미리보기/SEO),
//   답변·댓글(작성자 member_id 등 PII 포함)은 로그인 회원에게만 반환(§3.6·§6.5 PIPA).
//   비로그인은 gated:true + answerCount 만 → 화면 블러 게이트와 백엔드 차단 정합.
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

  const memberId = await getMemberId();

  // 답변 수는 공개(미리보기 "N개 답변 · 로그인하면 보기")
  const { count: answerCount } = await supabase
    .from('community_answers')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', id);

  // 비로그인 → PII(답변/댓글 본문·member_id) 미반환
  if (!memberId) {
    return NextResponse.json({ post, gated: true, answerCount: answerCount ?? 0, answers: [], comments: [] });
  }

  // 로그인 회원 → 전체 반환
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

  return NextResponse.json({ post, gated: false, answerCount: answerCount ?? 0, answers: answers ?? [], comments });
}
