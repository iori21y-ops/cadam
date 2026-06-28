import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

// GET — 캐피탈/리스사 안내 디렉토리(공개읽기). capital_directory 테이블 실데이터 적재 전엔
//   빈 배열 → 화면(contract-care)은 기존 하드코딩(CC_CAPITAL) 폴백을 유지(오정보·퇴행 방지).
//   ⚠️ 추정 연락처·금리 시드 금지 — 실데이터는 운영자/수집기로만 채운다.
export async function GET() {
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from('capital_directory')
    .select('capital_id, name, cs_phone, cs_hours, accident_phone, issue_menus, early_term_rate, excess_km_rate, homepage')
    .order('name');
  return NextResponse.json({ capitals: data ?? [] });
}
