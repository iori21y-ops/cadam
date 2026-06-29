import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { RT_CATALOG } from '@/lib/rentailor/catalog';

// GET — 마켓 인사이트(기준금리 + 국내 판매순위). 공개. 캐시 1h.
// ★소스: 판매순위=car_sales_monthly 실데이터(domestic_model 최신월 TOP5) ✅연동.
//   기준금리=market_rates(ECOS 수집 시 채워짐) — ECOS_API_KEY 미발급이라 현재 interim(잠정).
export const revalidate = 3600;

// interim 정적 판매순위(실데이터 미조회 시 폴백).
const SALES_INTERIM = [
  { rank: 1, name: '쏘렌토', slug: 'sorento', brand: '기아' },
  { rank: 2, name: '카니발', slug: 'carnival', brand: '기아' },
  { rank: 3, name: '싼타페', slug: 'santafe', brand: '현대' },
  { rank: 4, name: '아반떼', slug: 'avante', brand: '현대' },
  { rank: 5, name: '스포티지', slug: 'sportage', brand: '기아' },
];

// 판매순위 모델명 → 우리 카탈로그 slug(best-effort). 미매칭이면 null(링크 없이 표시).
//   car_model_alias 테이블 적재 시 그 매핑으로 교체 가능.
function normName(s: string | null): string {
  return (s || '').replace(/\(.*?\)/g, '').replace(/\s+/g, '').toLowerCase();
}
function matchSlug(model: string | null): string | null {
  const n = normName(model);
  if (!n) return null;
  const hit = RT_CATALOG.find((c) => {
    const m = normName(c.model);
    return m === n || m.includes(n) || n.includes(m);
  });
  return hit ? hit.id : null;
}

export async function GET() {
  const supabase = createServiceRoleSupabaseClient();
  // 기준금리: market_rates 활성 최신(없으면 interim 잠정)
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

  // 판매순위: car_sales_monthly 실데이터(domestic_model 최신월). 실패 시 interim.
  //   상위 20행 반환(units·전월대비 포함) → 화면(밴드 TOP3/베스트셀러 TOP10/인사이트 TOP5)이 슬라이스.
  type SalesRow = { rank: number; name: string; slug: string | null; brand: string; units?: number | null; momPct?: number | null; momDir?: string | null };
  let sales: SalesRow[] = SALES_INTERIM;
  let salesSource = 'interim';
  let salesAsOf: string | null = null;
  const { data: latest } = await supabase
    .from('car_sales_monthly')
    .select('year_month')
    .eq('category', 'domestic_model')
    .order('year_month', { ascending: false })
    .limit(1);
  const ym = latest?.[0]?.year_month as string | undefined;
  if (ym) {
    const { data: rows } = await supabase
      .from('car_sales_monthly')
      .select('rank, brand, model, sales_count, mom_change, mom_change_dir')
      .eq('category', 'domestic_model')
      .eq('year_month', ym)
      .order('rank', { ascending: true })
      .limit(20);
    if (rows && rows.length) {
      sales = rows.map((r) => {
        // mom_change = 전월 대비 절대 대수 차(|당월-전월|), mom_change_dir = 방향. 실제 %로 환산.
        //   전월 = down이면 당월+차, up이면 당월-차 → momPct = ±(차/전월×100). (검증: 쏘렌토 -35%)
        const units = (r.sales_count as number) ?? null;
        const mc = (r.mom_change as number) ?? null;
        const dir = (r.mom_change_dir as string) ?? null;
        let momPct: number | null = null;
        if (units != null && mc != null && dir && dir !== 'flat') {
          const prev = dir === 'down' ? units + mc : units - mc;
          if (prev > 0) momPct = Math.round((mc / prev) * 100) * (dir === 'down' ? -1 : 1);
        }
        return {
          rank: r.rank as number,
          name: (r.model as string) ?? (r.brand as string) ?? '',
          slug: matchSlug(r.model as string | null),
          brand: (r.brand as string) ?? '',
          units,
          momPct,
          momDir: dir,
        };
      });
      salesSource = 'car_sales_monthly';
      salesAsOf = ym;
    }
  }
  return NextResponse.json({ baseRate, sales, salesSource, salesAsOf });
}
