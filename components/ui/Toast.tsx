'use client';

import { useEffect } from 'react';
import { ModalBase } from '@/components/ui/ModalBase';
import { CheckCircle2, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ type, message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  };

  const Icon = icons[type];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-md">
      <div className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg ${colors[type]} text-white`}>
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium flex-1 whitespace-pre-line">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:bg-white/20 rounded p-0.5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning'
}: ConfirmDialogProps) {
  const colors = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600',
    info: 'bg-blue-500 hover:bg-blue-600'
  };

  return (
    <ModalBase
      isOpen
      onClose={onCancel}
      title={title}
      size="md"
      footer={
        <div className="modal-actions flex flex-row gap-3 w-full justify-end">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`w-full sm:w-auto px-4 py-2 text-sm font-medium text-white ${colors[type]} rounded-lg transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <p className="text-sm text-gray-600 whitespace-pre-line break-words">
        {message}
      </p>
    </ModalBase>
  );
}
