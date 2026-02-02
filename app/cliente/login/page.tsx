'use client';

import { Wrench } from 'lucide-react';
import Link from 'next/link';

export default function ClienteLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-2xl">
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Wrench className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Página em construção
          </h2>
          <p className="text-sm text-gray-600">
            Em breve teremos novidades por aqui.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Voltar para área administrativa
          </Link>
        </div>
      </div>
    </div>
  );
}
