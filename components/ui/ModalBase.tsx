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
  // Bloquear scroll do body quando modal abrir
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className={`bg-white shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col rounded-2xl overflow-hidden border border-gray-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || typeof onClose !== 'undefined') && (
          <div className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
            <div className="flex flex-col items-start flex-1 pr-2">
              {title && (
                <h2 className="text-xl font-bold text-gray-900 leading-tight break-words">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1 break-words">
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
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 bg-gray-50/80 border-t border-gray-200 flex flex-wrap gap-3 justify-end items-center">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
