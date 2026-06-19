import { IconCompare } from 'cadam';

// Animated gold-gradient SVG icon. Scales via the `size` prop.
export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <IconCompare size={32} />
      <IconCompare size={48} />
      <IconCompare size={64} />
    </div>
  );
}
