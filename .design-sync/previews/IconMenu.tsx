import { IconMenu } from 'cadam';

// Animated gold-gradient SVG icon. Scales via the `size` prop.
export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <IconMenu size={32} />
      <IconMenu size={48} />
      <IconMenu size={64} />
    </div>
  );
}
