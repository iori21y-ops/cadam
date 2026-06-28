import { NextResponse } from 'next/server';
import { clearMemberSession } from '@/lib/member-session';

export async function POST() {
  await clearMemberSession();
  return NextResponse.json({ ok: true });
}
