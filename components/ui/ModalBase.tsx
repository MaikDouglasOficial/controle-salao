'use client';

import React, { useEffect } from 'react';
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
 * Modal profissional com design moderno e responsivo.
 * Tamanhos otimizados para diferentes tipos de conteúdo.
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
  // Bloquear scroll do body quando modal abrir e prevenir overflow lateral
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('overflow-x-hidden', 'modal-no-scroll-x');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('overflow-x-hidden', 'modal-no-scroll-x');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('overflow-x-hidden', 'modal-no-scroll-x');
    };
  }, [isOpen]);

  // Fechar no ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',      // 384px - Confirmações, alertas
    md: 'max-w-md',      // 448px - Formulários simples
    lg: 'max-w-lg',      // 512px - Formulários médios
    xl: 'max-w-xl',      // 576px - Formulários completos
    '2xl': 'max-w-2xl',  // 672px - Formulários extensos
    '3xl': 'max-w-3xl',  // 768px - Formulários muito extensos
    full: 'max-w-7xl',   // ~1280px - Visualizações amplas
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-transparent backdrop-blur-sm overflow-x-hidden overflow-y-hidden overscroll-contain touch-none p-3 sm:p-4 pt-[calc(env(safe-area-inset-top,0px)+var(--app-header-offset,56px)+1.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)+var(--app-header-offset,56px)+1.5rem)]"
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className={`bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full ${sizeClasses[size]} max-w-[calc(100vw-1.5rem)] max-h-[calc(100svh-(var(--app-header-offset,56px)+var(--app-header-offset,56px)+3rem))] sm:max-h-[90vh] flex flex-col rounded-2xl overflow-hidden border border-gray-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || typeof onClose !== 'undefined') && (
          <div className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
            <div className="flex flex-col items-start flex-1 pr-2 overflow-hidden">
              {title && (
                <h2 className="text-xl font-bold text-gray-900 leading-tight truncate w-full">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1 truncate w-full">
                  {subtitle}
                </p>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200/80 transition-colors rounded-lg text-gray-600 hover:text-gray-900 flex-shrink-0"
                aria-label="Fechar modal"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y px-6 py-6 bg-white">
          <div className="w-full break-words modal-content-safe pb-8">
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 bg-gray-50/80 border-t border-gray-200 flex flex-row gap-3 justify-end items-center [&>button]:min-w-[120px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
