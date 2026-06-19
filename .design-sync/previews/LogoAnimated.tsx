import { LogoAnimated } from 'cadam';

// The animated RenTailor wordmark + car-outline logo. Wide aspect ratio, so
// sizes are stacked. Scales via the `size` prop (height in px).
export function Sizes() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18 }}>
      <LogoAnimated size={24} />
      <LogoAnimated size={36} />
    </div>
  );
}
