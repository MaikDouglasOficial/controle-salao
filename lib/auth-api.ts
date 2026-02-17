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

/**
 * Exige sessão de cliente (role === 'client' e customerId presente).
 * Use nas rotas da área do cliente (/api/cliente/*).
 */
export async function requireClientSession(): Promise<
  { session: Session; customerId: number } | { error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Faça login para continuar' }, { status: 401 }) };
  }
  const role = (session.user as { role?: string }).role;
  const customerId = (session.user as { customerId?: number }).customerId;
  if (role !== 'client' || customerId == null) {
    return { error: NextResponse.json({ error: 'Acesso restrito à área do cliente' }, { status: 403 }) };
  }
  return { session, customerId };
}
