/**
 * /api/admin/finance-rates
 *
 * admin/finance 페이지가 finance_rates 테이블을 수정할 때 사용하는 서버사이드 API.
 * 브라우저 anon 클라이언트로 직접 UPDATE하는 구조를 server + service_role로 교체.
 *
 * 보안:
 *   - 인증: createServerSupabaseClient()로 쿠키 세션 검증 (로그인된 관리자만)
 *   - DB: service_role 클라이언트 사용 (RLS 우회, 서버에서만 실행)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from '@/lib/supabase-server';
import { secureError } from '@/lib/api/security';

const UpdateSchema = z.object({
  id: z.string().uuid(),
  annual_rate: z.number().min(0).max(1),
  residual_rate: z.number().min(0).max(1).nullable().optional(),
  deposit_rate: z.number().min(0).max(1).nullable().optional(),
  insurance_rate: z.number().min(0).max(1).nullable().optional(),
  mileage_surcharge_rate: z.number().min(0).max(1).nullable().optional(),
  mileage_base_km: z.number().int().min(0).nullable().optional(),
  memo: z.string().max(500).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    // ── 세션 인증 ──────────────────────────────────────────────
    const authSupabase = await createServerSupabaseClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 입력 검증 ──────────────────────────────────────────────
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '잘못된 요청', detail: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { id, ...fields } = parsed.data;
    const update: Record<string, unknown> = {
      ...fields,
      updated_at: new Date().toISOString(),
    };

    // ── service_role로 UPDATE ──────────────────────────────────
    const supabase = createServiceRoleSupabaseClient();
    const { error } = await supabase
      .from('finance_rates')
      .update(update)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return secureError(err, 500);
  }
}
