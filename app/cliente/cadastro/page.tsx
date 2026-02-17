'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Loader2, User, Phone, Eye, EyeOff, FileText } from 'lucide-react';

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function ClienteCadastroPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          phone: phone.replace(/\D/g, ''),
          name: name.trim(),
          cpf: cpf.replace(/\D/g, ''),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Erro ao criar conta.');
        setLoading(false);
        return;
      }
      router.push('/cliente/login?registered=1');
      router.refresh();
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
            Crie sua conta para acessar agendamentos e histórico
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2.5 text-[13px] text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-[13px] font-medium text-slate-600 mb-1">Nome completo *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-colors"
                placeholder="Seu nome"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cpf" className="block text-[13px] font-medium text-slate-600 mb-1">CPF *</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="cpf"
                type="text"
                inputMode="numeric"
                required
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-colors"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-[13px] font-medium text-slate-600 mb-1">Telefone (WhatsApp) *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-colors"
                placeholder="(63) 99999-9999"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-[13px] font-medium text-slate-600 mb-1">E-mail *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-colors"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-slate-600 mb-1">Senha (mín. 6 caracteres) *</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-colors"
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Criando conta...</>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        <div className="px-8 pb-8 pt-2 border-t border-slate-100 space-y-3">
          <p className="text-center text-sm text-slate-600">
            Já tem conta?{' '}
            <Link href="/cliente/login" className="font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-2">
              Entrar
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
