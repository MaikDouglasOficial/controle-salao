'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastType } from '@/components/ui/Toast';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ToastContextType {
  toasts: Toast[];
  removeToast: (id: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmDialog: (ConfirmOptions & { onConfirm: () => void }) | null;
  closeConfirm: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<(ConfirmOptions & { onConfirm: () => void }) | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = toastId++;
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message: string) => {
    showToast('success', message);
  }, [showToast]);

  const error = useCallback((message: string) => {
    showToast('error', message);
  }, [showToast]);

  const info = useCallback((message: string) => {
    showToast('info', message);
  }, [showToast]);

  const warning = useCallback((message: string) => {
    showToast('warning', message);
  }, [showToast]);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        ...options,
        onConfirm: () => {
          resolve(true);
          setConfirmDialog(null);
        }
      });
      
      const cleanup = () => {
        resolve(false);
        setConfirmDialog(null);
      };
      
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup();
        }
      };
      
      window.addEventListener('keydown', handleEsc);
      setTimeout(() => window.removeEventListener('keydown', handleEsc), 10000);
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  return (
    <ToastContext.Provider value={{ 
      toasts, 
      removeToast, 
      success, 
      error, 
      info, 
      warning, 
      confirm, 
      confirmDialog,
      closeConfirm 
    }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
