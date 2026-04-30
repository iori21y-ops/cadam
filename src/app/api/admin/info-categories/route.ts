/**
 * POST   /api/admin/info-categories  — 카테고리 추가
 * DELETE /api/admin/info-categories  — 카테고리 삭제 (body: { id })
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { secureError } from '@/lib/api/security';

const InsertSchema = z.object({
  value:         z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, '영문 소문자·숫자·하이픈만 허용'),
  label:         z.string().min(1).max(200),
  display_order: z.number().int().min(0),
});

const DeleteSchema = z.object({
  id: z.string().uuid(),
});

async function requireAdmin(req: NextRequest) {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const deny = await requireAdmin(req);
    if (deny) return deny;

    const parsed = InsertSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });

    const { error } = await createServiceRoleSupabaseClient()
      .from('info_categories')
      .insert(parsed.data);

    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return secureError(err, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const deny = await requireAdmin(req);
    if (deny) return deny;

    const parsed = DeleteSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });

    const { error } = await createServiceRoleSupabaseClient()
      .from('info_categories')
      .delete()
      .eq('id', parsed.data.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return secureError(err, 500);
  }
}
