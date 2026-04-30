/**
 * POST   /api/admin/info-articles  — 아티클 추가
 * PATCH  /api/admin/info-articles  — 아티클 수정 (is_active 토글 / 편집 저장 / 순서 변경)
 * DELETE /api/admin/info-articles  — 아티클 삭제 (body: { id })
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { secureError } from '@/lib/api/security';

const InsertSchema = z.object({
  title:         z.string().min(1).max(500),
  excerpt:       z.string().max(1000).nullable().optional(),
  link_url:      z.string().url(),
  thumbnail_url: z.string().nullable().optional(),
  source_type:   z.string().max(50),
  is_active:     z.boolean(),
  display_order: z.number().int().min(0),
  category:      z.string().max(100),
  vehicle_slug:  z.string().max(200).nullable().optional(),
});

const PatchSchema = z.object({
  id:            z.string().uuid(),
  title:         z.string().min(1).max(500).optional(),
  excerpt:       z.string().max(1000).nullable().optional(),
  category:      z.string().max(100).optional(),
  vehicle_slug:  z.string().max(200).nullable().optional(),
  is_active:     z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
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
      .from('info_articles')
      .insert(parsed.data);

    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return secureError(err, 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const deny = await requireAdmin(req);
    if (deny) return deny;

    const parsed = PatchSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });

    const { id, ...fields } = parsed.data;
    const update: Record<string, unknown> = { ...fields, updated_at: new Date().toISOString() };

    const { error } = await createServiceRoleSupabaseClient()
      .from('info_articles')
      .update(update)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
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
      .from('info_articles')
      .delete()
      .eq('id', parsed.data.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return secureError(err, 500);
  }
}
