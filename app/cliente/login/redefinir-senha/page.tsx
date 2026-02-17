'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

function RedefinirSenhaClienteContent() {
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
      setTimeout(() => router.push('/cliente/login'), 2500);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 px-4 py-12 sm:py-16">
        <div className="w-full max-w-[400px] bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-emerald-200/50 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600 text-2xl">✓</div>
          <p className="mt-4 text-lg font-semibold text-slate-800">Senha alterada!</p>
          <p className="mt-2 text-sm text-slate-500">Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 px-4 py-12 sm:py-16">
      <div className="w-full max-w-[400px] bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-emerald-200/50 overflow-hidden">
        <div className="pt-10 pb-6 px-8 text-center">
          <Image
            src="/logo-corte-ja.png"
            alt="Corte-Já"
            width={416}
            height={416}
            quality={100}
            className="h-28 w-28 sm:h-32 sm:w-32 object-contain mx-auto select-none"
            unoptimized
          />
          <p className="mt-2 text-[11px] font-medium text-emerald-600/90 tracking-widest uppercase">
            Área do Cliente
          </p>
          <p className="mt-1.5 text-sm text-slate-500 max-w-[240px] mx-auto">
            Nova senha — digite e confirme
          </p>
        </div>
        <form onSubmit={handleSubmit} className="px-8 pb-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2.5 text-[13px] text-red-600 border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-slate-600 mb-1">Nova senha</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirm" className="block text-[13px] font-medium text-slate-600 mb-1">Confirmar senha</label>
            <input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-colors"
              placeholder="Repita a senha"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : 'Redefinir senha'}
          </button>
        </form>
        <div className="px-8 pb-8 pt-2 border-t border-slate-100 space-y-3">
          <p className="text-center">
            <Link href="/cliente/login" className="inline-flex items-center justify-center gap-2 text-[13px] font-medium text-slate-600 hover:text-emerald-600 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar ao login
            </Link>
          </p>
          <p className="text-center">
            <Link href="/login" className="text-[13px] text-slate-500 hover:text-emerald-600 font-medium transition-colors">
              Área administrativa
            </Link>
          </p>
          <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3" /> Conexão segura
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RedefinirSenhaClientePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <RedefinirSenhaClienteContent />
    </Suspense>
  );
}
