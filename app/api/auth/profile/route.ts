import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

/**
 * GET /api/auth/profile — retorna dados do usuário admin logado (sem senha).
 * Clientes devem usar GET /api/cliente/me.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const role = (session.user as { role?: string }).role;
    if (role === 'client') {
      return NextResponse.json(
        { error: 'Use /api/cliente/me para perfil da área do cliente' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id, 10) },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (e) {
    console.error('Erro ao buscar perfil:', e);
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
  }
}

/**
 * PUT /api/auth/profile — atualiza nome, email e/ou senha do usuário logado
 * Body: { name?: string, email?: string, currentPassword?: string, newPassword?: string }
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const role = (session.user as { role?: string }).role;
    if (role === 'client') {
      return NextResponse.json(
        { error: 'Use PUT /api/cliente/me para atualizar perfil da área do cliente' },
        { status: 403 }
      );
    }

    const id = parseInt(session.user.id, 10);
    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const updates: { name?: string; email?: string; password?: string } = {};

    if (typeof name === 'string' && name.trim()) {
      updates.name = name.trim();
    }
    if (typeof email === 'string' && email.trim()) {
      const existing = await prisma.user.findFirst({
        where: { email: email.trim(), id: { not: id } },
      });
      if (existing) {
        return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 400 });
      }
      updates.email = email.trim();
    }

    if (typeof newPassword === 'string' && newPassword.trim()) {
      if (!currentPassword || typeof currentPassword !== 'string') {
        return NextResponse.json({ error: 'Senha atual é obrigatória para alterar a senha' }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
      }
      updates.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(user, { status: 200 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updates,
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error('Erro ao atualizar perfil:', e);
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}
