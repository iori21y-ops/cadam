import { IconPhone } from 'cadam';

// Animated gold-gradient SVG icon. Scales via the `size` prop.
export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <IconPhone size={32} />
      <IconPhone size={48} />
      <IconPhone size={64} />
    </div>
  );
}
