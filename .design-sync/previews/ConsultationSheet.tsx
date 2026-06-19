import { ConsultationSheet } from 'cadam';

// The sheet is position:fixed (dim overlay + bottom sheet). A `transform` on the
// wrapper makes those fixed descendants position relative to it, so the open
// state renders fully inside the card instead of escaping to the page viewport.
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        transform: 'translateZ(0)',
        width: 400,
        height: 700,
        overflow: 'hidden',
        borderRadius: 16,
        background: '#F7F8FA',
      }}
    >
      {children}
    </div>
  );
}

// Bottom-sheet lead form, open state. Submits to /api/consultation.
export function Open() {
  return (
    <Stage>
      <ConsultationSheet isOpen onClose={() => {}} />
    </Stage>
  );
}

// With a pre-filled condition note (carried from a selected quote option).
export function WithNote() {
  return (
    <Stage>
      <ConsultationSheet isOpen onClose={() => {}} note="제네시스 G80 · 48개월 · 2만km" />
    </Stage>
  );
}
