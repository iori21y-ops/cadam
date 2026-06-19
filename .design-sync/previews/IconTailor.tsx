import { IconTailor } from 'cadam';

// Animated gold-gradient SVG icon. Scales via the `size` prop.
export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <IconTailor size={32} />
      <IconTailor size={48} />
      <IconTailor size={64} />
    </div>
  );
}
