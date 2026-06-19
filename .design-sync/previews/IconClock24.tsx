import { IconClock24 } from 'cadam';

// Animated gold-gradient SVG icon. Scales via the `size` prop.
export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <IconClock24 size={32} />
      <IconClock24 size={48} />
      <IconClock24 size={64} />
    </div>
  );
}
