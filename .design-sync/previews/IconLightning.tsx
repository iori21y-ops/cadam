import { IconLightning } from 'cadam';

// Animated gold-gradient SVG icon. Scales via the `size` prop.
export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <IconLightning size={32} />
      <IconLightning size={48} />
      <IconLightning size={64} />
    </div>
  );
}
