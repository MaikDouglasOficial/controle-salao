'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

function RedefinirSenhaAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) setError('Link inválido. Solicite uma nova recuperação de senha.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao redefinir senha');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-12">
        <div className="w-full max-w-[400px] bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-slate-200/50 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600 text-2xl">✓</div>
          <h1 className="mt-4 text-lg font-semibold text-slate-800">Senha alterada!</h1>
          <p className="mt-2 text-sm text-slate-500">Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-12">
      <div className="w-full max-w-[400px] bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
        <div className="pt-8 pb-6 px-8 text-center">
          <Image src="/logo-corte-ja.png" alt="Corte-Já" width={120} height={120} className="h-20 w-20 mx-auto object-contain" unoptimized />
          <p className="mt-2 text-[11px] font-medium text-slate-500 tracking-widest uppercase">Sistema de Gestão</p>
          <h1 className="mt-4 text-lg font-semibold text-slate-800">Nova senha</h1>
          <p className="mt-1 text-sm text-slate-500">Digite e confirme sua nova senha.</p>
        </div>
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 border border-red-100">{error}</div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1">Nova senha</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-slate-600 mb-1">Confirmar senha</label>
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                placeholder="Repita a senha"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            className="mt-5 w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : 'Redefinir senha'}
          </button>
          <Link href="/login" className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-indigo-600">
            <ArrowLeft className="h-4 w-4" /> Voltar ao login
          </Link>
          <p className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3" /> Conexão segura
          </p>
        </form>
      </div>
    </div>
  );
}

export default function RedefinirSenhaAdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <RedefinirSenhaAdminContent />
    </Suspense>
  );
}
