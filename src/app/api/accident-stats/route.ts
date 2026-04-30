/**
 * /api/accident-stats — 차종별 사고 통계 조회 (금융위원회 자동차보험 통계)
 *
 * 데이터 소스: Supabase insurance_stats, stat_kind='loss' + 'contract'
 *   - 손해상황(loss): 차종별 부상자·사망자·손해금액
 *   - 계약정보(contract): 차종별 가입건수·경과보험료 (손해율 계산용)
 *
 * 반환:
 *   - 소형/중형/대형/다인승 각각의 손해율, 만 가입건당 부상자/사망자
 *   - 연간 데이터: 최신 12월(YYYY12) base_ym 우선 사용 (= 연간 누적)
 *
 * ※ 차종 간 손해율 차이는 2%p 미만으로 매우 작음
 * ※ 개인용 보험 개인 기준, 실제 사고 위험은 운전 습관에 더 크게 좌우됨
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { applyRateLimit, secureError } from '@/lib/api/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const TARGET_CAR_TYPES = ['소형', '중형', '대형', '다인승'] as const;
const COVERAGES = ['대인배상1', '대인배상2', '대물배상', '자기신체사고', '자기차량손해'] as const;

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req);
  if (rl) return rl;

  try {
    // 연간 데이터 우선: 최신 12월(YYYY12) → 없으면 최신 월
    const { data: decRows } = await supabase
      .from('insurance_stats')
      .select('base_ym')
      .eq('stat_kind', 'loss')
      .like('base_ym', '%12')
      .order('base_ym', { ascending: false })
      .limit(1);

    let base_ym = decRows?.[0]?.base_ym ?? null;

    if (!base_ym) {
      const { data: latestRows } = await supabase
        .from('insurance_stats')
        .select('base_ym')
        .eq('stat_kind', 'loss')
        .order('base_ym', { ascending: false })
        .limit(1);
      base_ym = latestRows?.[0]?.base_ym ?? null;
    }

    if (!base_ym) {
      return NextResponse.json({ error: '데이터 없음' }, { status: 404 });
    }

    // 손해상황 조회 (소형/중형/대형/다인승)
    const { data: lossData, error: lossErr } = await supabase
      .from('insurance_stats')
      .select('car_type, coverage_type, injured_count, death_count, loss_amount')
      .eq('stat_kind', 'loss')
      .eq('base_ym', base_ym)
      .in('car_type', [...TARGET_CAR_TYPES]);
    if (lossErr) throw lossErr;

    // 계약정보 조회 (개인용, 소형/중형/대형/다인승) — 손해율 및 가입건수 계산용
    const { data: contractData, error: contractErr } = await supabase
      .from('insurance_stats')
      .select('car_type, coverage_type, join_count, elapsed_premium')
      .eq('stat_kind', 'contract')
      .eq('insurance_type', '개인용')
      .eq('base_ym', base_ym)
      .in('car_type', [...TARGET_CAR_TYPES])
      .limit(5000);
    if (contractErr) throw contractErr;

    // 차종별 집계
    const stats: Record<string, {
      lossRate:       number;   // 손해율 (%)
      injuredPer10k:  number;   // 만 가입건당 부상자 수
      deathPer10k:    number;   // 만 가입건당 사망자 수 (소수점 1자리)
      totalInjured:   number;   // 전국 총 부상자 수 (참고)
      totalDeath:     number;   // 전국 총 사망자 수 (참고)
    }> = {};

    for (const ct of TARGET_CAR_TYPES) {
      const lossRows   = (lossData     ?? []).filter((r) => r.car_type === ct);
      const contrRows  = (contractData ?? []).filter((r) => r.car_type === ct);
      // 대인배상1 = 의무 담보 → 가입건수 proxy
      const joinRows   = contrRows.filter((r) => r.coverage_type === '대인배상1');

      const totalInjured  = lossRows.reduce((s, r) => s + (r.injured_count ?? 0), 0);
      const totalDeath    = lossRows.reduce((s, r) => s + (r.death_count   ?? 0), 0);
      const totalLoss     = lossRows.filter((r) => COVERAGES.includes(r.coverage_type as typeof COVERAGES[number]))
                                    .reduce((s, r) => s + (r.loss_amount   ?? 0), 0);
      const totalPremium  = contrRows.filter((r) => COVERAGES.includes(r.coverage_type as typeof COVERAGES[number]))
                                     .reduce((s, r) => s + (r.elapsed_premium ?? 0), 0);
      const joinCount     = joinRows.reduce((s, r) => s + (r.join_count ?? 0), 0);

      stats[ct] = {
        lossRate:      totalPremium > 0 ? Math.round((totalLoss / totalPremium) * 1000) / 10 : 0,
        injuredPer10k: joinCount > 0    ? Math.round((totalInjured / joinCount) * 10000) : 0,
        deathPer10k:   joinCount > 0    ? Math.round((totalDeath   / joinCount) * 100000) / 10 : 0,
        totalInjured,
        totalDeath,
      };
    }

    return NextResponse.json({
      status:   'ok',
      base_ym,
      year:     base_ym.slice(0, 4),
      is_annual: base_ym.endsWith('12'),
      stats,
    });
  } catch (err) {
    return secureError(err, 500);
  }
}
