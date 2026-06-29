// 차종 스펙 대표행 선택 — vehicle-spec(상세) / catalog-specs(카드) route 공용.
//   소스: vehicle_powertrains. 한 (vehicle, fuel_kind) 그룹에 여러 행 → 대표 1행 선택.
//   분기: EV는 electric_eff/driving_range, 그 외는 fuel_eff_combined.

export interface PowertrainRow {
  fuel_kind?: string | null;
  fuel_eff_combined: number | null;
  electric_eff: number | null;
  driving_range: number | null;
  energy_grade: string | null;
  displacement_cc?: number | null; // power(cc)용 — route에서만 참조, RepSpec엔 미포함
}

export interface RepSpec {
  eff: string | null;   // ICE: km/L, EV: km/kWh
  range: string | null; // EV 1회충전 km, 그 외 null
  grade: string | null; // 에너지효율 등급
}

// 대표행 선택: EV는 driving_range max(전비 있는 행), 그 외는 fuel_eff_combined max.
export function pickRepresentativeRow(rows: PowertrainRow[], isEv: boolean): PowertrainRow | undefined {
  return isEv
    ? rows.filter((r) => r.electric_eff != null).sort((a, b) => (b.driving_range ?? 0) - (a.driving_range ?? 0))[0]
    : rows.filter((r) => r.fuel_eff_combined != null).sort((a, b) => (b.fuel_eff_combined ?? 0) - (a.fuel_eff_combined ?? 0))[0];
}

// eff/range/grade 추출. 행 없음/eff 없음 → eff·range null, grade는 그룹 내 아무 행에서.
export function pickRepresentative(rows: PowertrainRow[], isEv: boolean): RepSpec {
  const rep = pickRepresentativeRow(rows, isEv);
  let eff: string | null = null;
  let range: string | null = null;
  if (rep) {
    if (isEv) {
      eff = rep.electric_eff != null ? `${rep.electric_eff}` : null;
      range = rep.driving_range != null ? `${rep.driving_range}` : null;
    } else {
      eff = rep.fuel_eff_combined != null ? `${rep.fuel_eff_combined}` : null;
      range = null;
    }
  }
  const grade = rep?.energy_grade ?? rows.find((r) => r.energy_grade)?.energy_grade ?? null;
  return { eff, range, grade };
}
