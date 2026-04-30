/**
 * PATCH /api/admin/diagnosis-config
 * diagnosis_config 테이블 upsert — admin/ai, admin/diagnosis 페이지용
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { secureError } from '@/lib/api/security';

const Schema = z.object({
  id:   z.string().min(1).max(100),
  data: z.record(z.string(), z.unknown()),
});

export async function PATCH(req: NextRequest) {
  try {
    const auth = await createServerSupabaseClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });

    const { id, data } = parsed.data;
    const supabase = createServiceRoleSupabaseClient();
    const { error } = await supabase
      .from('diagnosis_config')
      .upsert({ id, data, updated_at: new Date().toISOString() }, { onConflict: 'id' });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return secureError(err, 500);
  }
}
