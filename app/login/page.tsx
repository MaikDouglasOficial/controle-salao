'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        {/* Logo e Título */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 rounded-2xl overflow-hidden bg-white shadow-lg">
            <Image
              src="/logo-corte-ja.png"
              alt="Corte-Já"
              width={96}
              height={96}
              className="h-24 w-24 object-cover"
              priority
            />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-slate-900">
            Corte-Já
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Sistema de Gestão de Salão
          </p>
        </div>

        {/* Formulário */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
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
                className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 !text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white font-medium"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 !text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
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

          {/* Credenciais de exemplo */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs text-slate-600 text-center font-semibold mb-2">
              Credenciais de teste:
            </p>
            <p className="text-xs text-gray-500 text-center">
              Email: <span className="font-mono">admin@salao.com</span>
            </p>
            <p className="text-xs text-gray-500 text-center">
              Senha: <span className="font-mono">admin123</span>
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSetupAdmin}
                disabled={setupLoading}
                className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {setupLoading ? 'Criando usuário...' : 'Criar usuário temporário'}
              </button>
              {setupMessage && (
                <p className="mt-2 text-xs text-center text-slate-600">
                  {setupMessage}
                </p>
              )}
            </div>
          </div>

          {/* Link para portal do cliente */}
          <div className="text-center pt-4">
            <a
              href="/cliente/login"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Área do Cliente →
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
