'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: ModalSize;
  footer?: React.ReactNode;
}

/**
 * ModalBase
 * ------------------------------------------------------
 * Modal profissional, acessível e responsivo
 * - Backdrop com blur cobrindo 100% da viewport
 * - Compatível com iOS (notch / safe-area)
 * - Fecha ao clicar fora ou pressionar ESC
 * - Scroll do body bloqueado
 */
export const ModalBase: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'lg',
  footer,
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  /* Bloqueia scroll do body */
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    document.body.classList.add('overflow-x-hidden');

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('overflow-x-hidden');
    };
  }, [isOpen]);

  /* Fecha ao pressionar ESC */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !mounted) return null;

  // Corrige erro de tipagem do React Portal: só renderiza se document.body existir
  const portalTarget = typeof window !== 'undefined' ? document.body : undefined;
  if (!portalTarget) return null;

  const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-7xl',
  };

  return createPortal(
    <>
      {/* 🔥 Backdrop – cobre 100% da tela (inclusive topo/notch) */}
      <div
        className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-sm"
        style={{ pointerEvents: 'auto' }}
        onClick={onClose}
      />

      {/* Wrapper do modal */}
      <div
        className="
          fixed inset-0 z-[10000]
          flex items-center justify-center
          p-3 sm:p-4
          pt-[calc(env(safe-area-inset-top)+1rem)]
          pb-[calc(env(safe-area-inset-bottom)+1rem)]
          overflow-hidden
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={subtitle ? 'modal-subtitle' : undefined}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`
            relative w-full
            ${sizeClasses[size]}
            max-w-[calc(100vw-1.5rem)]
            max-h-[90svh]
            bg-white
            rounded-2xl
            shadow-[0_20px_50px_rgba(0,0,0,0.25)]
            border border-gray-100
            flex flex-col
            overflow-hidden
          `}
        >
          {/* Header */}
          {(title || subtitle) && (
            <header className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex-1 overflow-hidden">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-xl font-semibold text-gray-900 truncate"
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p
                    id="modal-subtitle"
                    className="mt-1 text-sm text-gray-600 truncate"
                  >
                    {subtitle}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar modal"
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </header>
          )}

          {/* Body */}
          <main className="flex-1 overflow-y-auto px-6 py-6">
            {children}
          </main>

          {/* Footer */}
          {footer && (
            <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </>,
    portalTarget
  );
};
