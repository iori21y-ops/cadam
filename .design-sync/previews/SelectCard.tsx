import { SelectCard } from 'cadam';

const cardContent = (emoji: string, title: string, sub: string) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
    <span style={{ fontSize: 26 }}>{emoji}</span>
    <span style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#0D1B2A' }}>{title}</span>
      <span style={{ fontSize: 13, color: '#4A5568' }}>{sub}</span>
    </span>
  </div>
);

// Selectable option cards — selected shows the gold check, default is white.
// Rendered on a light surface so the card shadow reads.
export function Options() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#F7F8FA', padding: 16, borderRadius: 20, width: 340 }}>
      <SelectCard selected>{cardContent('🚗', '장기렌터카', '초기비용 부담 없이')}</SelectCard>
      <SelectCard>{cardContent('💳', '오토리스', '비용처리에 유리')}</SelectCard>
      <SelectCard>{cardContent('💰', '할부 구매', '내 차로 소유')}</SelectCard>
    </div>
  );
}

// Compact + custom accent color.
export function Compact() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F7F8FA', padding: 16, borderRadius: 20, width: 300 }}>
      <SelectCard compact selected color="#10B981">
        {cardContent('⚡', '전기차', '친환경 보조금')}
      </SelectCard>
      <SelectCard compact>{cardContent('🅿️', '경차', '경제적인 선택')}</SelectCard>
    </div>
  );
}
