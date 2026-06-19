import { IconCalculator } from 'cadam';

// Animated gold-gradient SVG icon. Scales via the `size` prop.
export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <IconCalculator size={32} />
      <IconCalculator size={48} />
      <IconCalculator size={64} />
    </div>
  );
}
