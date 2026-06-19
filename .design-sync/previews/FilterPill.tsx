import { FilterPill } from 'cadam';

// Filter row — the active pill is filled navy, the rest are outlined.
export function FilterRow() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <FilterPill active>전체</FilterPill>
      <FilterPill>국산차</FilterPill>
      <FilterPill>수입차</FilterPill>
      <FilterPill>전기차</FilterPill>
      <FilterPill>SUV</FilterPill>
    </div>
  );
}

// Sizes.
export function Sizes() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <FilterPill size="sm" active>작은 칩</FilterPill>
      <FilterPill size="md" active>큰 칩</FilterPill>
    </div>
  );
}
