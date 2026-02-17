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
      <div
        className="fixed z-[2147483647] flex flex-col gap-2 items-end pointer-events-none"
        style={{
          bottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
          right: 'max(1rem, env(safe-area-inset-right, 1rem))',
          maxWidth: 'min(28rem, calc(100vw - 2rem))',
        }}
      >
        <div className="flex flex-col gap-2 items-end w-full max-w-full pointer-events-auto">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              type={toast.type}
              message={toast.message}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
      
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          type={confirmDialog.type}
          requirePassword={confirmDialog.requirePassword}
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
