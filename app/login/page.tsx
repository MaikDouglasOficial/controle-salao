'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, FlaskConical, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [expiredMessage, setExpiredMessage] = useState(false);
  const [loading, setLoading] = useState(false);
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
      const result = await signIn('credentials', {
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

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-stone-50 px-4 py-12 sm:py-16">
      <div className="w-full max-w-[380px] bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">
        {/* Marca */}
        <div className="pt-10 pb-8 px-8 text-center">
          <Image
            src="/logo-corte-ja.png"
            alt="Corte-Já"
            width={416}
            height={416}
            quality={100}
            className="h-36 w-36 sm:h-40 sm:w-40 object-contain object-center select-none mx-auto"
            priority
            unoptimized
          />
          <p className="-mt-1.5 text-[11px] font-medium text-stone-400 tracking-widest uppercase leading-tight">
            Sistema de Gestão
          </p>
          <p className="mt-2 text-[13px] text-stone-500 tracking-tight max-w-[220px] mx-auto">
            Gerencie seu salão de forma simples
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
              <label htmlFor="email" className="block text-[13px] font-medium text-stone-600 mb-1">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-400/40 focus:border-amber-400/60 transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-stone-600 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 bg-stone-50/80 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-400/40 focus:border-amber-400/60 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-stone-400 hover:text-stone-600 transition-colors"
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
            className="mt-5 w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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

          <button
            type="button"
            onClick={handleSetupAdmin}
            disabled={setupLoading}
            className="mt-2.5 w-full py-2.5 px-4 rounded-lg text-[13px] font-medium text-stone-500 bg-transparent border border-stone-200 hover:bg-stone-50 hover:border-stone-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <FlaskConical className="h-4 w-4 shrink-0" />
              {setupLoading ? 'Criando usuário...' : 'Conta de demonstração'}
            </span>
          </button>
          {setupMessage && (
            <p className="mt-2 text-[12px] text-center text-stone-500">
              {setupMessage}
            </p>
          )}

          <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col items-center gap-2">
            <a
              href="/cliente/login"
              className="text-[13px] font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              Área do Cliente
            </a>
            <p className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              Conexão segura
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
