import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

interface TrimRow {
  id: string;
  trim_name: string;
  trim_name_en: string | null;
  base_price: number;
  tax_reduced_price: number | null;
  drive_type: string | null;
  fuel_eff_combined: number | null;
  fuel_eff_city: number | null;
  fuel_eff_highway: number | null;
  co2_emission: number | null;
  curb_weight_kg: number | null;
  wheel_size: string | null;
  display_order: number;
}

interface OptionRow {
  id: string;
  trim_id: string | null;
  option_name: string;
  option_price: number;
  option_type: string;
}

function formatManwon(price: number): string {
  return `${Math.round(price / 10000).toLocaleString()}만원`;
}

interface TrimPriceTableProps {
  vehicleId: string;
}

export async function TrimPriceTable({ vehicleId }: TrimPriceTableProps) {
  // vehicle_trims에 anon 읽기 RLS 정책이 없으므로 service role 사용
  const supabase = createServiceRoleSupabaseClient();

  const [{ data: trimData }, { data: optionData }] = await Promise.all([
    supabase
      .from('vehicle_trims')
      .select(
        'id, trim_name, trim_name_en, base_price, tax_reduced_price, drive_type, fuel_eff_combined, fuel_eff_city, fuel_eff_highway, co2_emission, curb_weight_kg, wheel_size, display_order'
      )
      .eq('vehicle_id', vehicleId)
      .order('display_order', { ascending: true }),
    supabase
      .from('trim_options')
      .select('id, trim_id, option_name, option_price, option_type')
      .eq('vehicle_id', vehicleId),
  ]);

  const trims = (trimData ?? []) as TrimRow[];
  if (trims.length === 0) return null;

  const options = (optionData ?? []) as OptionRow[];

  // 옵션 분류: 트림별 / 공통
  const optionsByTrim = new Map<string, OptionRow[]>();
  const commonOptions: OptionRow[] = [];

  for (const opt of options) {
    if (!opt.trim_id || opt.option_type === 'common') {
      commonOptions.push(opt);
    } else {
      const list = optionsByTrim.get(opt.trim_id) ?? [];
      list.push(opt);
      optionsByTrim.set(opt.trim_id, list);
    }
  }

  return (
    <section className="px-5 pb-8">
      <h2 className="text-lg font-bold text-text mb-4">트림별 출고가</h2>
      <div className="rounded-2xl bg-white border border-accent shadow-sm overflow-hidden">
        {trims.map((trim, idx) => {
          const trimOptions = optionsByTrim.get(trim.id) ?? [];
          const isLast = idx === trims.length - 1 && commonOptions.length === 0;
          const hasSpec =
            trim.fuel_eff_combined || trim.co2_emission || trim.curb_weight_kg;

          return (
            <div
              key={trim.id}
              className={`px-4 py-4 ${!isLast ? 'border-b border-border-solid' : ''}`}
            >
              {/* 트림명 + 기본가격 */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-sm font-bold text-text">{trim.trim_name}</span>
                  {trim.trim_name_en && trim.trim_name_en !== trim.trim_name && (
                    <span className="text-xs text-text-sub ml-1.5">{trim.trim_name_en}</span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-primary">
                    {formatManwon(trim.base_price)}
                  </span>
                </div>
              </div>

              {/* 개소세 감면가 */}
              {trim.tax_reduced_price != null &&
                trim.tax_reduced_price !== trim.base_price && (
                  <p className="text-xs text-text-sub mt-0.5">
                    개소세 감면 시 {formatManwon(trim.tax_reduced_price)}
                  </p>
                )}

              {/* 제원 (값이 있는 것만) */}
              {hasSpec && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
                  {trim.fuel_eff_combined != null && (
                    <span className="text-xs text-text-sub">
                      복합연비 {trim.fuel_eff_combined}km/L
                    </span>
                  )}
                  {trim.fuel_eff_city != null && trim.fuel_eff_highway != null && (
                    <span className="text-xs text-text-sub">
                      도심 {trim.fuel_eff_city} / 고속 {trim.fuel_eff_highway}
                    </span>
                  )}
                  {trim.co2_emission != null && (
                    <span className="text-xs text-text-sub">
                      CO₂ {trim.co2_emission}g/km
                    </span>
                  )}
                  {trim.curb_weight_kg != null && (
                    <span className="text-xs text-text-sub">
                      공차중량 {trim.curb_weight_kg.toLocaleString()}kg
                    </span>
                  )}
                </div>
              )}

              {/* 트림별 선택 옵션 */}
              {trimOptions.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-dashed border-border-solid">
                  <p className="text-[11px] font-semibold text-text-sub mb-1.5">선택 옵션</p>
                  <div className="space-y-1">
                    {trimOptions.map((opt) => (
                      <div key={opt.id} className="flex items-center justify-between">
                        <span className="text-xs text-text">{opt.option_name}</span>
                        <span className="text-xs text-text-sub ml-2 shrink-0">
                          {opt.option_price > 0
                            ? `+${formatManwon(opt.option_price)}`
                            : '무상'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 공통 옵션 */}
        {commonOptions.length > 0 && (
          <div className="px-4 py-4 bg-surface-secondary border-t border-border-solid">
            <p className="text-[11px] font-semibold text-text-sub mb-2">공통 옵션</p>
            <div className="space-y-1">
              {commonOptions.map((opt) => (
                <div key={opt.id} className="flex items-center justify-between">
                  <span className="text-xs text-text">{opt.option_name}</span>
                  <span className="text-xs text-text-sub ml-2 shrink-0">
                    {opt.option_price > 0
                      ? `+${formatManwon(opt.option_price)}`
                      : '무상'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-text-sub mt-2 text-center">
        출고가 기준 · 장기렌트 월납입금과 다를 수 있습니다
      </p>
    </section>
  );
}
