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
    <div className="min-h-[100svh] flex items-center justify-center bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 px-4 py-8">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-stone-200/80">
        {/* Logo e Título */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden bg-stone-100 ring-1 ring-stone-200 flex items-center justify-center">
            <Image
              src="/logo-corte-ja.png"
              alt="Corte-Já"
              width={192}
              height={192}
              quality={100}
              className="h-24 w-24 sm:h-28 sm:w-28 object-contain"
              priority
            />
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Corte-Já
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Gerencie seu salão de forma simples e profissional
          </p>
        </div>

        {/* Formulário */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-stone-700 mb-1.5">
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
                className="form-input"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-stone-700 mb-1.5">
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
                  className="form-input pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700"
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
            className="btn-primary w-full py-3.5 text-base"
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
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <FlaskConical className="h-4 w-4" />
            {setupLoading ? 'Criando usuário...' : 'Entrar com conta de demonstração'}
          </button>
          {setupMessage && (
            <p className="text-xs text-center text-stone-600">
              {setupMessage}
            </p>
          )}

          <div className="text-center pt-2">
            <a
              href="/cliente/login"
              className="text-sm text-amber-700 hover:text-amber-800 font-medium"
            >
              Área do Cliente →
            </a>
          </div>

          <div className="pt-3 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            Seus dados estão protegidos.
          </div>
        </form>
      </div>
    </div>
  );
}
