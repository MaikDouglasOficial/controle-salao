'use client';

import { Scissors, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ClienteLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl">
        {/* Logo e Título */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Portal do Cliente
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Acesse sua área exclusiva
          </p>
        </div>

        {/* Formulário */}
        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email ou Telefone
              </label>
              <input
                id="email"
                name="email"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all shadow-lg hover:shadow-xl"
          >
            Entrar
          </button>

          {/* Links */}
          <div className="flex flex-col space-y-2 text-center">
            <Link
              href="/cliente/cadastro"
              className="text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              Não tem conta? Cadastre-se →
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              ← Voltar para área administrativa
            </Link>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
          <p className="text-xs text-pink-800 text-center">
            <strong>Novidade!</strong> Agora você pode agendar online e acompanhar seu histórico de atendimentos.
          </p>
        </div>
      </div>
    </div>
  );
}
