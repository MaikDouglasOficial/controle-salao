import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireClientSession } from '@/lib/auth-api';
import * as bcrypt from 'bcryptjs';

/** GET - Perfil do cliente logado (dados seguros para exibição). */
export async function GET() {
  const auth = await requireClientSession();
  if ('error' in auth) return auth.error;

  const customer = await prisma.customer.findUnique({
    where: { id: auth.customerId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      birthday: true,
      notes: true,
      photo: true,
      createdAt: true,
    },
  });
  if (!customer) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
  }
  const account = await prisma.customerAccount.findUnique({
    where: { customerId: auth.customerId },
    select: { email: true },
  });
  return NextResponse.json({
    ...customer,
    birthday: customer.birthday ? customer.birthday.toISOString().slice(0, 10) : null,
    loginEmail: account?.email ?? customer.email,
  });
}

/** PUT - Atualizar perfil e opcionalmente trocar senha. */
export async function PUT(request: NextRequest) {
  const auth = await requireClientSession();
  if ('error' in auth) return auth.error;

  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : undefined;
  const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : undefined;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined;
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : undefined;
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : undefined;
  const birthday = body.birthday !== undefined
    ? (body.birthday === '' || body.birthday == null ? null : new Date(body.birthday))
    : undefined;

  if (phone !== undefined && phone.length < 8) {
    return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
  }
  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }
  if (newPassword !== undefined && newPassword.length > 0 && newPassword.length < 6) {
    return NextResponse.json({ error: 'Nova senha deve ter no mínimo 6 caracteres' }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: auth.customerId },
    include: { account: true },
  });
  if (!customer) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });

  if (newPassword && newPassword.length >= 6) {
    if (!currentPassword || typeof currentPassword !== 'string' || !currentPassword.trim()) {
      return NextResponse.json({ error: 'Senha atual é obrigatória para alterar a senha' }, { status: 400 });
    }
    if (!customer.account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword.trim(), customer.account.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
    }
  }

  if (email && email !== customer.account?.email) {
    const existing = await prisma.customerAccount.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Este email já está em uso' }, { status: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: auth.customerId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(birthday !== undefined && { birthday }),
      },
    });
    if (customer.account) {
      const accData: { email?: string; passwordHash?: string } = {};
      if (email !== undefined) accData.email = email;
      if (newPassword) accData.passwordHash = await bcrypt.hash(newPassword, 10);
      if (Object.keys(accData).length > 0) {
        await tx.customerAccount.update({
          where: { customerId: auth.customerId },
          data: accData,
        });
      }
    }
  });

  return NextResponse.json({ message: 'Perfil atualizado' });
}
