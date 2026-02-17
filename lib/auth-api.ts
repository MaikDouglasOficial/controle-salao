import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

/**
 * Exige sessão autenticada na API. Use no início de cada handler de rota admin.
 * Retorna a sessão se ok, ou uma NextResponse 401 para enviar ao cliente.
 */
export async function requireSession(): Promise<{ session: Session } | { error: NextResponse }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }
  return { session };
}
