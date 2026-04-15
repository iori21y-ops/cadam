import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const PRICE_CRAWLER_URL =
  process.env.PRICE_CRAWLER_URL ?? 'http://localhost:9722';

export async function POST(request: NextRequest) {
  // 관리자 인증 확인
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const vehicle = typeof body?.vehicle === 'string' ? body.vehicle : undefined;

  try {
    const res = await fetch(`${PRICE_CRAWLER_URL}/generate-pricing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicle ? { vehicle } : {}),
      signal: AbortSignal.timeout(330_000), // 5분 30초 (generate_pricing 최대 5분 + 여유)
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `price_crawler 오류: HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `price_crawler 연결 실패: ${msg}` },
      { status: 502 }
    );
  }
}
