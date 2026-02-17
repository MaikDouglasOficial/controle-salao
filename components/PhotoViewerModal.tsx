'use client';

import { ModalBase } from '@/components/ui/ModalBase';
import Image from 'next/image';

interface PhotoViewerModalProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoViewerModal({ src, alt = 'Foto', isOpen, onClose }: PhotoViewerModalProps) {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} size="full">
      <div className="flex items-center justify-center min-h-[60vh] bg-stone-900 rounded-xl p-4">
        <div className="relative w-full max-w-2xl aspect-square max-h-[80vh]">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
          />
        </div>
      </div>
    </ModalBase>
  );
}
