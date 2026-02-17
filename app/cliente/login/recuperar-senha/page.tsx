'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, Loader2, Lock } from 'lucide-react';

export default function RecuperarSenhaClientePage() {
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
        body: JSON.stringify({ email: email.trim(), type: 'client' }),
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
            Recuperar senha — informe o e-mail da sua conta
          </p>
        </div>
        <form onSubmit={handleSubmit} className="px-8 pb-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2.5 text-[13px] text-red-600 border border-red-100">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700 border border-emerald-200">
              {message}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-[13px] font-medium text-slate-600 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-colors"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : 'Enviar link'}
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
