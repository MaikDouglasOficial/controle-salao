import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * POST - Cadastro de conta do cliente.
 * Body: { email, password, phone, name }
 * Cria ou vincula ao Customer existente (por telefone) e cria CustomerAccount.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const phone = typeof body.phone === 'string' ? body.phone : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }
    const phoneNorm = normalizePhone(phone);
    if (phoneNorm.length < 8) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
    }
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const existingAccount = await prisma.customerAccount.findUnique({
      where: { email },
    });
    if (existingAccount) {
      return NextResponse.json({ error: 'Este email já está em uso. Faça login ou use outro email.' }, { status: 400 });
    }

    let customer = await prisma.customer.findFirst({
      where: { phone: phoneNorm },
    });
    if (!customer) {
      const all = await prisma.customer.findMany({ select: { id: true, phone: true } });
      const found = all.find((c) => normalizePhone(c.phone) === phoneNorm);
      if (found) customer = await prisma.customer.findUnique({ where: { id: found.id } }) ?? null;
    }
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          phone: phoneNorm,
          email,
        },
      });
    } else {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { email: email },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.customerAccount.create({
      data: {
        customerId: customer.id,
        email,
        passwordHash,
      },
    });

    return NextResponse.json({
      message: 'Conta criada com sucesso! Faça login para continuar.',
      customerId: customer.id,
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao registrar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta. Tente novamente.' },
      { status: 500 }
    );
  }
}
