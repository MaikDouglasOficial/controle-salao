'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ToastProvider } from '@/hooks/useToast';
import { Toast, ConfirmDialog } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';

function ToastRenderer() {
  const { toasts, removeToast, confirmDialog, closeConfirm } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <>
      <div className="fixed bottom-4 right-4 z-[2147483647] flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
      
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={closeConfirm}
        />
      )}
    </>
    , document.body
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        <ToastRenderer />
      </ToastProvider>
    </SessionProvider>
  );
}
