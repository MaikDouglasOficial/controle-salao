'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { ToastProvider } from '@/hooks/useToast';
import { Toast, ConfirmDialog } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { ReactQueryProvider } from '@/lib/react-query-provider';

function ToastRenderer() {
  const { toasts, removeToast, confirmDialog, closeConfirm } = useToast();

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
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
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ReactQueryProvider>
        <ToastProvider>
          {children}
          <ToastRenderer />
        </ToastProvider>
      </ReactQueryProvider>
    </SessionProvider>
  );
}
