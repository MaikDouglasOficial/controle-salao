'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, FlaskConical, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
        setError('Email ou senha inválidos');
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
      setSetupMessage('Erro ao criar usuário admin');
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 px-4 py-6">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-200">
        {/* Logo e Título */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden bg-transparent">
            <Image
              src="/logo-corte-ja.png"
              alt="Corte-Já"
              width={96}
              height={96}
              className="h-20 w-20 sm:h-24 sm:w-24 object-contain"
              priority
            />
          </div>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Corte-Já
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Gerencie seu salão de forma simples e profissional
          </p>
        </div>

        {/* Formulário */}
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 !text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white font-medium"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
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
                  className="appearance-none relative block w-full px-4 py-3 pr-11 border border-slate-300 placeholder-slate-400 !text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
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
            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Entrando...
              </>
            ) : (
              'Acessar Sistema'
            )}
          </button>

          <button
            type="button"
            onClick={handleSetupAdmin}
            disabled={setupLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <FlaskConical className="h-4 w-4" />
            {setupLoading ? 'Criando usuário...' : 'Entrar com conta de demonstração'}
          </button>
          {setupMessage && (
            <p className="text-xs text-center text-slate-600">
              {setupMessage}
            </p>
          )}

          {/* Link para portal do cliente */}
          <div className="text-center pt-3">
            <a
              href="/cliente/login"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Área do Cliente →
            </a>
          </div>

          <div className="pt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            Seus dados estão protegidos.
          </div>
        </form>
      </div>
    </div>
  );
}
