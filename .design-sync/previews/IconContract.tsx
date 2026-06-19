import { IconContract } from 'cadam';

// Animated gold-gradient SVG icon. Scales via the `size` prop.
export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <IconContract size={32} />
      <IconContract size={48} />
      <IconContract size={64} />
    </div>
  );
}
