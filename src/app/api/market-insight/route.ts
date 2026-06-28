import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

// GET — 마켓 인사이트(기준금리 + 국내 판매순위). 공개. 캐시 1h.
// ★소스 교체점: 기준금리=market_rates(ECOS 수집 시 채워짐) / 판매순위=현재 interim 정적,
//   car_sales_monthly 수집기 연동 시 교체(갭문서 §3).
export const revalidate = 3600;

// interim 정적 판매순위(소스 교체 전). 우리 slug 매핑(car_model_alias 연동 시 교체).
const SALES_INTERIM = [
  { rank: 1, name: '쏘렌토', slug: 'sorento' },
  { rank: 2, name: '카니발', slug: 'carnival' },
  { rank: 3, name: '싼타페', slug: 'santafe' },
  { rank: 4, name: '아반떼', slug: 'avante' },
  { rank: 5, name: '스포티지', slug: 'sportage' },
];

export async function GET() {
  const supabase = createServiceRoleSupabaseClient();
  // 기준금리: market_rates 활성 최신(없으면 interim)
  const { data } = await supabase
    .from('market_rates')
    .select('rate, display_comment, effective_date')
    .eq('indicator', 'base_rate')
    .eq('is_active', true)
    .order('effective_date', { ascending: false })
    .limit(1);
  const baseRate = data?.[0]
    ? { rate: data[0].rate, comment: data[0].display_comment, source: 'ECOS', asOf: data[0].effective_date }
    : { rate: 3.0, comment: '한국은행 기준금리(잠정) — 금리 인하기엔 장기렌트 월납 부담이 줄어요', source: 'interim', asOf: null };
  return NextResponse.json({ baseRate, sales: SALES_INTERIM, salesSource: 'interim' });
}
