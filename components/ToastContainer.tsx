'use client';

import { Toast, ConfirmDialog } from './ui/Toast';
import { useToast, ToastProvider } from '@/hooks/useToast';

function ToastContainerInner() {
  const { toasts, removeToast, confirmDialog, closeConfirm } = useToast();

  return (
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
  );
}

export function ToastContainer() {
  return (
    <ToastProvider>
      <ToastContainerInner />
    </ToastProvider>
  );
}
