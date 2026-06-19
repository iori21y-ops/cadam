import { IconPrice } from 'cadam';

// Animated gold-gradient SVG icon. Scales via the `size` prop.
export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <IconPrice size={32} />
      <IconPrice size={48} />
      <IconPrice size={64} />
    </div>
  );
}
