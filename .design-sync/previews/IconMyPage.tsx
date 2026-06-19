import { IconMyPage } from 'cadam';

// Animated gold-gradient SVG icon. Scales via the `size` prop.
export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <IconMyPage size={32} />
      <IconMyPage size={48} />
      <IconMyPage size={64} />
    </div>
  );
}
