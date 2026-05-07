'use client';

import { useState } from 'react';
import { Button } from './Button';
import { ConsultationSheet } from './ConsultationSheet';
import type { ButtonProps } from './Button';

type QuoteButtonProps = Omit<ButtonProps, 'onClick'> & {
  children?: React.ReactNode;
};

export function QuoteButton({ children = '무료 견적 받기', ...buttonProps }: QuoteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button {...buttonProps} onClick={() => setIsOpen(true)}>
        {children}
      </Button>
      <ConsultationSheet isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
