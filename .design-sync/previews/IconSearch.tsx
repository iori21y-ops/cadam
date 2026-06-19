import { IconSearch } from 'cadam';

// Animated gold-gradient SVG icon. Scales via the `size` prop.
export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <IconSearch size={32} />
      <IconSearch size={48} />
      <IconSearch size={64} />
    </div>
  );
}
