/**
 * POST /api/generate-pricing
 *
 * Supabase에서 finance_rates + vehicle_trims를 읽어 PMT 계산 후
 * pricing 테이블을 자동 재생성한다. 맥미니 개입 없이 Vercel에서 처리.
 *
 * 쿼리 수: 5회 (vehicles / trims / delete / insert × 1-2)
 * 예상 실행 시간: 3–8초
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { calcMonthly, getFinanceRates } from '@/lib/calc-monthly';
import type { ProductKey } from '@/types/diagnosis';

// Vercel 함수 최대 실행 시간 (Pro 플랜: 60s, Hobby 플랜: 10s 제한)
export const maxDuration = 60;

// ─────────────────────────────────────────────────────────────
// 생성 조합 상수
// ─────────────────────────────────────────────────────────────

const CONTRACT_MONTHS = [24, 36, 48, 60] as const;
const ANNUAL_KMS      = [10000, 20000, 30000] as const;
const PRODUCT_TYPES: Exclude<ProductKey, 'cash'>[] = ['installment', 'lease', 'rent'];

// ─────────────────────────────────────────────────────────────
// DB 타입
// ─────────────────────────────────────────────────────────────

interface VehicleRow {
  id: string;
  brand: string;
  name: string;
}

interface TrimRow {
  vehicle_id: string;
  base_price: number;
}

// ─────────────────────────────────────────────────────────────
// API Route
// ─────────────────────────────────────────────────────────────

export async function POST() {
  // ── 인증 확인 (anon 클라이언트 — 쿠키 세션 확인용) ──────────
  const authSupabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── DB 작업은 service role 사용 (vehicle_trims RLS 우회) ────
  const supabase = createServiceRoleSupabaseClient();

  try {
    const generatedAt = new Date().toISOString();

    // ── 1. 금융 조건 조회 ─────────────────────────────────────
    const config = await getFinanceRates();

    // ── 2. 크롤러 수집 차량 목록 조회 ─────────────────────────
    const { data: vehicleData, error: vErr } = await supabase
      .from('vehicles')
      .select('id, brand, name')
      .not('pdf_hash', 'is', null);

    if (vErr) throw new Error(`vehicles 조회 실패: ${vErr.message}`);
    const vehicles = (vehicleData ?? []) as VehicleRow[];

    if (vehicles.length === 0) {
      return NextResponse.json({ ok: true, vehicles: 0, inserted: 0, deleted: 0, skipped: [] });
    }

    // ── 3. 해당 차량의 vehicle_trims 전체 조회 (1 query) ──────
    const vehicleIds = vehicles.map((v) => v.id);
    const { data: trimData, error: tErr } = await supabase
      .from('vehicle_trims')
      .select('vehicle_id, base_price')
      .in('vehicle_id', vehicleIds)
      .gt('base_price', 0);

    if (tErr) throw new Error(`vehicle_trims 조회 실패: ${tErr.message}`);

    // vehicle_id → trims 매핑
    const trimsByVehicle = new Map<string, TrimRow[]>();
    for (const t of (trimData ?? []) as TrimRow[]) {
      const arr = trimsByVehicle.get(t.vehicle_id) ?? [];
      arr.push(t);
      trimsByVehicle.set(t.vehicle_id, arr);
    }

    // ── 4. 메모리에서 pricing 레코드 생성 ────────────────────
    const skipped: string[] = [];
    const allRows: Record<string, unknown>[] = [];

    for (const vehicle of vehicles) {
      const trims = trimsByVehicle.get(vehicle.id) ?? [];

      if (trims.length === 0) {
        skipped.push(vehicle.name ?? vehicle.id);
        continue;
      }

      // base_price(원) → 만원 단위
      const pricesMaenun = trims.map((t) => t.base_price / 10000);

      for (const product of PRODUCT_TYPES) {
        for (const months of CONTRACT_MONTHS) {
          for (const km of ANNUAL_KMS) {
            const monthlies = pricesMaenun.map((p) =>
              calcMonthly(p, product, months, 0, km, config)
            );
            allRows.push({
              car_brand:       vehicle.brand,
              car_model:       vehicle.name,
              contract_months: months,
              annual_km:       km,
              min_monthly:     Math.min(...monthlies),
              max_monthly:     Math.max(...monthlies),
              is_active:       true,
              conditions: JSON.stringify({
                source:        'auto',
                product_type:  product,
                deposit_rate:  0,
                generated_at:  generatedAt,
                trim_count:    pricesMaenun.length,
                rate_memo: {
                  annual_rate: config[product].annualRate,
                },
              }),
            });
          }
        }
      }
    }

    // ── 5. 기존 auto 레코드 전체 삭제 (1 query) ──────────────
    const { error: delErr } = await supabase
      .from('pricing')
      .delete()
      .filter('conditions->>source', 'eq', 'auto');

    if (delErr) throw new Error(`auto 레코드 삭제 실패: ${delErr.message}`);

    // ── 6. 신규 레코드 일괄 삽입 (배치 처리) ─────────────────
    const BATCH = 500;
    for (let i = 0; i < allRows.length; i += BATCH) {
      const { error: insErr } = await supabase
        .from('pricing')
        .insert(allRows.slice(i, i + BATCH));
      if (insErr) throw new Error(`pricing 삽입 실패 (배치 ${i / BATCH + 1}): ${insErr.message}`);
    }

    return NextResponse.json({
      ok: true,
      vehicles: vehicles.length,
      inserted: allRows.length,
      skipped,
      generatedAt,
    });

  } catch (err) {
    console.error('[generate-pricing]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
