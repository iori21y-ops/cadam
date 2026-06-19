import { IconHome } from 'cadam';

// Animated gold-gradient SVG icon. Scales via the `size` prop.
export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <IconHome size={32} />
      <IconHome size={48} />
      <IconHome size={64} />
    </div>
  );
}
