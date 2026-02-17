'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, Loader2, Lock } from 'lucide-react';

export default function RecuperarSenhaAdminPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), type: 'admin' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao enviar');
        return;
      }
      setMessage(data.message || 'Se o e-mail existir, você receberá um link.');
      setEmail('');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-12">
      <div className="w-full max-w-[400px] bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
        <div className="pt-8 pb-6 px-8 text-center">
          <Image
            src="/logo-corte-ja.png"
            alt="Corte-Já"
            width={120}
            height={120}
            className="h-20 w-20 mx-auto object-contain"
            unoptimized
          />
          <p className="mt-2 text-[11px] font-medium text-slate-500 tracking-widest uppercase">Sistema de Gestão</p>
          <h1 className="mt-4 text-lg font-semibold text-slate-800">Recuperar senha</h1>
          <p className="mt-1 text-sm text-slate-500">Informe o e-mail da conta administrativa.</p>
        </div>
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 border border-emerald-200">
              {message}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                placeholder="admin@salao.com"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : 'Enviar link'}
          </button>
          <Link
            href="/login"
            className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
          >
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
