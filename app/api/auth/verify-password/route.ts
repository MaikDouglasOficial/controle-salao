import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

/**
 * POST /api/auth/verify-password
 * Body: { password: string }
 * Verifica se a senha informada confere com a do usuário logado (admin ou cliente).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const password = body?.password;
    if (typeof password !== 'string' || !password.trim()) {
      return NextResponse.json({ ok: false, error: 'Senha é obrigatória' }, { status: 400 });
    }

    const role = (session.user as { role?: string }).role;
    const customerId = (session.user as { customerId?: number }).customerId;

    if (role === 'client' && customerId != null) {
      const account = await prisma.customerAccount.findUnique({
        where: { customerId },
      });
      if (!account) {
        return NextResponse.json({ ok: false, error: 'Conta não encontrada' }, { status: 401 });
      }
      const valid = await bcrypt.compare(password.trim(), account.passwordHash);
      if (!valid) {
        return NextResponse.json({ ok: false, error: 'Senha incorreta' }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id, 10) },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password.trim(), user.password);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'Senha incorreta' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Erro ao verificar senha:', e);
    return NextResponse.json({ ok: false, error: 'Erro ao verificar senha' }, { status: 500 });
  }
}
