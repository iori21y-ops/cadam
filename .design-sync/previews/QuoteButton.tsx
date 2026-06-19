import { QuoteButton } from 'cadam';

// The lead-capture CTA. Renders a Button that opens a ConsultationSheet on
// click (the sheet is closed in this static preview). Inherits all Button
// props — variant, size, fullWidth.
export function Default() {
  return <QuoteButton />;
}

export function CustomLabel() {
  return <QuoteButton size="lg">지금 무료 상담 받기</QuoteButton>;
}

export function FullWidth() {
  return (
    <div style={{ width: 320 }}>
      <QuoteButton fullWidth>견적 신청하기</QuoteButton>
    </div>
  );
}
