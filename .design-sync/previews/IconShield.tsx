import { IconShield } from 'cadam';

// Animated gold-gradient SVG icon. Scales via the `size` prop.
export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <IconShield size={32} />
      <IconShield size={48} />
      <IconShield size={64} />
    </div>
  );
}
