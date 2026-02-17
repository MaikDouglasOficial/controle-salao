'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, FlaskConical, Lock, Loader2, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [expiredMessage, setExpiredMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setExpiredMessage(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSetupMessage('');
    setLoading(true);

    try {
      const result = await signIn('admin', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const isDefaultEmail = email === 'admin@salao.com';
        setError(
          isDefaultEmail
            ? 'Usuário admin ainda não existe. Clique em "Entrar com conta de demonstração" para criar e depois faça login.'
            : 'Email ou senha inválidos.'
        );
        return;
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setError('');
    signIn('google-admin', { callbackUrl: '/admin/dashboard' });
  };

  const handleSetupAdmin = async () => {
    setError('');
    setSetupMessage('');
    setSetupLoading(true);

    try {
      const response = await fetch('/api/setup', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        setSetupMessage(data?.details || data?.error || 'Erro ao criar usuário admin');
        return;
      }

      setSetupMessage(data?.message || 'Usuário admin criado com sucesso!');
      setEmail('admin@salao.com');
      setPassword('admin123');
    } catch (err) {
      setSetupMessage('Erro ao conectar. Verifique se o banco de dados está rodando e o arquivo .env está configurado.');
    } finally {
      setSetupLoading(false);
    }
  };

  const hasGoogle = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true';

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-12 sm:py-16">
      <div className="w-full max-w-[400px] bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
        {/* Marca */}
        <div className="pt-10 pb-6 px-8 text-center">
          <Image
            src="/logo-corte-ja.png"
            alt="Corte-Já"
            width={416}
            height={416}
            quality={100}
            className="h-32 w-32 sm:h-36 sm:w-36 object-contain object-center select-none mx-auto"
            priority
            unoptimized
          />
          <p className="mt-2 text-[11px] font-medium text-indigo-600/90 tracking-widest uppercase leading-tight">
            Sistema de Gestão
          </p>
          <p className="mt-1.5 text-sm text-slate-500 max-w-[240px] mx-auto">
            Acesso restrito à administração
          </p>
        </div>

        {/* Formulário */}
        <form className="px-8 pb-8" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {expiredMessage && (
              <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-[13px] text-amber-800 border border-amber-200">
                Sessão expirada. Faça login novamente.
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-2.5 text-[13px] text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-slate-600 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-[13px] font-medium text-slate-600">
                  Senha
                </label>
                <Link
                  href="/login/recuperar-senha"
                  className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>

          {hasGoogle && (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="mt-3 w-full py-2.5 px-4 rounded-lg text-[13px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Redirecionando...' : 'Entrar com Google'}
            </button>
          )}

          <button
            type="button"
            onClick={handleSetupAdmin}
            disabled={setupLoading}
            className="mt-2.5 w-full py-2.5 px-4 rounded-lg text-[13px] font-medium text-slate-500 bg-transparent border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <FlaskConical className="h-4 w-4 shrink-0" />
              {setupLoading ? 'Criando usuário...' : 'Conta de demonstração'}
            </span>
          </button>
          {setupMessage && (
            <p className="mt-2 text-[12px] text-center text-slate-500">{setupMessage}</p>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
            <a
              href="/cliente/login"
              className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Área do Cliente
            </a>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              Conexão segura
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
