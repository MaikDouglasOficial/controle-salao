'use client';

import { useEffect, useState } from 'react';
import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, AlertCircle, X, Info, AlertTriangle, Lock } from 'lucide-react';

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
  requirePassword?: boolean;
}

export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  requirePassword = false
}: ConfirmDialogProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const confirmVariant = type === 'danger' ? 'danger' : type === 'warning' ? 'outline' : 'primary';

  const handleConfirm = async () => {
    if (requirePassword) {
      if (!password.trim()) {
        setErrorMessage('Digite sua senha para confirmar.');
        return;
      }
      setErrorMessage(null);
      setLoading(true);
      try {
        const res = await fetch('/api/auth/verify-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: password.trim() }),
        });
        const data = await res.json();
        if (data.ok) {
          onConfirm();
          onCancel();
        } else {
          setErrorMessage(data.error || 'Senha incorreta.');
        }
      } catch {
        setErrorMessage('Erro ao verificar senha. Tente novamente.');
      } finally {
        setLoading(false);
      }
    } else {
      onConfirm();
      onCancel();
    }
  };

  return (
    <ModalBase
      isOpen
      onClose={onCancel}
      title={title}
      size="md"
      footer={
        <div className="modal-actions flex flex-row gap-3 w-full justify-end flex-wrap">
          <Button
            onClick={onCancel}
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant={confirmVariant}
            size="sm"
            className="w-full sm:w-auto"
            disabled={loading || (requirePassword && !password.trim())}
          >
            {loading ? 'Verificando...' : confirmText}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 whitespace-pre-line break-words">
          {message}
        </p>
        {requirePassword && (
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
              Digite sua senha para confirmar
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="confirm-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMessage(null); }}
                placeholder="Sua senha"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
          </div>
        )}
      </div>
    </ModalBase>
  );
}
