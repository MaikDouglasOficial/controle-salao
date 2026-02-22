'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Loader2, User, Phone, Eye, EyeOff, FileText, ArrowRight } from 'lucide-react';

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

type Step = 'cpf' | 'already-exists' | 'full-form';

export default function ClienteCadastroPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('cpf');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCheckCpf = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cpfNorm = cpf.replace(/\D/g, '');
    if (cpfNorm.length !== 11) {
      setError('CPF deve ter 11 dígitos');
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`/api/auth/check-registration?cpf=${encodeURIComponent(cpfNorm)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Erro ao verificar CPF');
        return;
      }
      if (data.exists && data.hasAccount) {
        setError('Este CPF já possui uma conta. Faça login ou use "Esqueci minha senha".');
        return;
      }
      if (data.exists && !data.hasAccount) {
        setStep('already-exists');
        return;
      }
      setStep('full-form');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmitFullForm = async (e: React.FormEvent) => {
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

  const backToCpf = () => {
    setStep('cpf');
    setError('');
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
            {step === 'cpf' && 'Informe seu CPF para continuar'}
            {step === 'already-exists' && 'Cadastro já existente'}
            {step === 'full-form' && 'Crie sua conta para acessar agendamentos e histórico'}
          </p>
        </div>

        {/* Etapa 1: CPF */}
        {step === 'cpf' && (
          <form onSubmit={handleCheckCpf} className="px-8 pb-8 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-2.5 text-[13px] text-red-600 border border-red-100">
                {error}
              </div>
            )}
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
            <button
              type="submit"
              disabled={checking}
              className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {checking ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</>
              ) : (
                <>Continuar <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        )}

        {/* Cadastro já existe: usar Esqueci minha senha (fluxo por e-mail) */}
        {step === 'already-exists' && (
          <div className="px-8 pb-8 space-y-4">
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800 border border-amber-200">
              Este cadastro já existe. Use o e-mail cadastrado em <strong>&quot;Esqueci minha senha&quot;</strong> para criar sua senha de acesso.
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/cliente/login"
                className="w-full py-3 px-4 rounded-lg text-sm font-medium text-center text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
              >
                Ir para o login
              </Link>
              <Link
                href="/cliente/login/recuperar-senha"
                className="w-full py-3 px-4 rounded-lg text-sm font-medium text-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>
            <button
              type="button"
              onClick={backToCpf}
              className="text-[13px] text-slate-500 hover:text-emerald-600 font-medium transition-colors"
            >
              ← Voltar e informar outro CPF
            </button>
          </div>
        )}

        {/* Formulário completo (novo cadastro) */}
        {step === 'full-form' && (
          <form onSubmit={handleSubmitFullForm} className="px-8 pb-8 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-2.5 text-[13px] text-red-600 border border-red-100">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={backToCpf}
              className="text-[13px] text-slate-500 hover:text-emerald-600 font-medium transition-colors"
            >
              ← Alterar CPF
            </button>

            <div>
              <label htmlFor="name" className="block text-[13px] font-medium text-slate-600 mb-1">Nome *</label>
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
              <label htmlFor="email" className="block text-[13px] font-medium text-slate-600 mb-1">E-mail *</label>
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
            <div>
              <label htmlFor="phone" className="block text-[13px] font-medium text-slate-600 mb-1">Telefone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-colors"
                  placeholder="11999999999"
                />
              </div>
            </div>
            <div>
              <label htmlFor="cpf-display" className="block text-[13px] font-medium text-slate-600 mb-1">CPF</label>
              <input
                id="cpf-display"
                type="text"
                readOnly
                value={cpf}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-slate-600 mb-1">Senha *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-colors"
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
        )}

        <div className="px-8 pb-8 pt-2 border-t border-slate-100 text-center">
          <Link href="/cliente/login" className="text-sm text-slate-600 hover:text-emerald-600 font-medium">
            Já tem conta? Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
