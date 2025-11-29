import React from 'react';
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-2 xs:px-3 sm:px-4 md:px-6 overflow-y-auto py-4"
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className={`bg-white shadow-2xl w-full ${sizeClasses[size]} my-auto flex flex-col rounded-lg xs:rounded-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || typeof onClose !== 'undefined') && (
          <div className="flex items-center justify-between px-3 xs:px-4 sm:px-6 md:px-8 py-3 xs:py-4 sm:py-5 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
            <div className="flex flex-col items-start min-w-0 flex-1">
              {title && (
                <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight truncate tracking-tight">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs xs:text-sm sm:text-base text-gray-600 mt-0.5 xs:mt-1 font-normal line-clamp-2">
                  {subtitle}
                </p>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="ml-2 xs:ml-3 sm:ml-4 md:ml-6 p-1.5 xs:p-2 sm:p-2.5 hover:bg-gray-200/80 active:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg xs:rounded-xl text-gray-600 hover:text-gray-900 flex-shrink-0"
                aria-label="Fechar modal"
                type="button"
              >
                <X className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="modal-body flex-1 overflow-y-auto px-3 xs:px-4 sm:px-6 md:px-8 py-4 xs:py-5 sm:py-6 md:py-8 pb-20 sm:pb-8 bg-white">
          <div className="max-w-full">
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="modal-footer px-3 xs:px-4 sm:px-6 md:px-8 py-3 xs:py-4 sm:py-5 bg-gray-50/80 border-t border-gray-200 flex flex-wrap gap-2 xs:gap-3 justify-end items-center">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
