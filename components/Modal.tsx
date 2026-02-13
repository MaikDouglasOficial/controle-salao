'use client';

import { ReactNode } from 'react';
import { ModalBase } from '@/components/ui/ModalBase';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, title, subtitle, children, size = 'lg', footer }: ModalProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size={size}
      footer={footer}
    >
      {children}
    </ModalBase>
  );
}
