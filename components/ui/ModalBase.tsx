'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  footer?: React.ReactNode;
}

/**
 * Modal responsivo: renderizado em portal no body para o desfoque cobrir toda a tela.
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('overflow-x-hidden', 'modal-no-scroll-x');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('overflow-x-hidden', 'modal-no-scroll-x');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('overflow-x-hidden', 'modal-no-scroll-x');
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-[calc(100vw-1rem)] sm:max-w-sm',
    md: 'max-w-[calc(100vw-1rem)] sm:max-w-md',
    lg: 'max-w-[calc(100vw-1rem)] sm:max-w-lg',
    xl: 'max-w-[calc(100vw-1rem)] sm:max-w-xl',
    '2xl': 'max-w-[calc(100vw-1rem)] sm:max-w-2xl',
    '3xl': 'max-w-[calc(100vw-1rem)] sm:max-w-3xl',
    full: 'max-w-[calc(100vw-1rem)] sm:max-w-7xl',
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden overscroll-contain touch-none bg-black/40 backdrop-blur-sm p-3 sm:p-4 min-h-screen"
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className={`
          bg-white shadow-xl w-full flex flex-col rounded-2xl border border-stone-200
          max-h-[82vh] min-h-0 min-w-0
          ${sizeClasses[size]}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-stone-50 border-b border-stone-200 rounded-t-2xl">
            <div className="flex flex-col items-start flex-1 min-w-0 pr-2">
              {title && (
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight truncate w-full">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-stone-500 mt-0.5 truncate w-full">
                  {subtitle}
                </p>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-stone-200 rounded-xl text-stone-500 hover:text-stone-900 flex-shrink-0 transition-colors"
                aria-label="Fechar modal"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body — scroll interno; sempre cabe na tela */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y px-4 sm:px-6 py-4 sm:py-6 bg-white custom-scrollbar">
          <div className="w-full min-w-0 break-words modal-content-safe pb-6">
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-stone-50 border-t border-stone-200 flex flex-row flex-wrap gap-2 sm:gap-3 justify-end items-center rounded-b-2xl [&>button]:min-w-0 sm:[&>button]:min-w-[120px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
