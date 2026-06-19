import { IconCar } from 'cadam';

// Animated gold-gradient SVG icon. Scales via the `size` prop.
export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <IconCar size={32} />
      <IconCar size={48} />
      <IconCar size={64} />
    </div>
  );
}
