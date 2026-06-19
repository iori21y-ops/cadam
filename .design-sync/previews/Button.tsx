import { Button } from 'cadam';

// Primary — the canonical CTA (navy #0D1B2A on white text).
export function Primary() {
  return <Button variant="primary">견적 신청하기</Button>;
}

// Variant sweep — the prop that most changes appearance.
export function Variants() {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="primary">기본</Button>
      <Button variant="secondary">보조</Button>
      <Button variant="outline">아웃라인</Button>
      <Button variant="kakao">카카오 상담</Button>
      <Button variant="ghost">더보기</Button>
      <Button variant="danger">삭제</Button>
    </div>
  );
}

// Sizes.
export function Sizes() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button size="sm">작게</Button>
      <Button size="md">보통</Button>
      <Button size="lg">크게</Button>
    </div>
  );
}

// Disabled state.
export function Disabled() {
  return (
    <Button variant="primary" disabled>
      신청 완료
    </Button>
  );
}
