import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '').slice(0, 11);
}

/** Valida CPF (11 dígitos, não todos iguais, dígitos verificadores). */
function isValidCpf(cpfNorm: string): boolean {
  if (cpfNorm.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfNorm)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpfNorm[i], 10) * (10 - i);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cpfNorm[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpfNorm[i], 10) * (11 - i);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cpfNorm[10], 10)) return false;
  return true;
}

/**
 * POST - Cadastro de conta do cliente.
 * Body: { email, password, phone, name, cpf }
 * CPF é obrigatório e identifica a pessoa de forma única; evita cadastros repetidos.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const phone = typeof body.phone === 'string' ? body.phone : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const cpfRaw = typeof body.cpf === 'string' ? body.cpf : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }
    const cpfNorm = normalizeCpf(cpfRaw);
    if (cpfNorm.length !== 11) {
      return NextResponse.json({ error: 'CPF deve ter 11 dígitos' }, { status: 400 });
    }
    if (!isValidCpf(cpfNorm)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }
    const phoneNorm = normalizePhone(phone);
    if (phoneNorm.length < 8) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
    }
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    // Evitar cadastro duplicado: e-mail já usado em outra conta
    const existingByEmail = await prisma.customerAccount.findUnique({
      where: { email },
    });
    if (existingByEmail) {
      return NextResponse.json({ error: 'Este e-mail já está em uso. Faça login ou use outro e-mail.' }, { status: 400 });
    }

    // 1) Buscar cliente pelo CPF (identificador único da pessoa)
    let customer = await prisma.customer.findFirst({
      where: { cpf: cpfNorm },
      include: { account: true },
    });
    if (!customer && cpfNorm) {
      const allWithCpf = await prisma.customer.findMany({ where: { cpf: { not: null } }, select: { id: true, cpf: true } });
      const found = allWithCpf.find((c) => c.cpf && normalizeCpf(c.cpf) === cpfNorm);
      if (found) {
        customer = await prisma.customer.findUnique({
          where: { id: found.id },
          include: { account: true },
        }) ?? null;
      }
    }

    // CPF já tem conta → uma pessoa = uma conta
    if (customer?.account) {
      return NextResponse.json({
        error: 'Este CPF já possui uma conta. Faça login ou use "Esqueci minha senha" na tela de login.',
      }, { status: 400 });
    }

    // 2) Se não achou por CPF, tentar por telefone (cliente criado no agendamento sem CPF)
    if (!customer) {
      customer = await prisma.customer.findFirst({
        where: { phone: phoneNorm },
        include: { account: true },
      }) ?? null;
      if (!customer) {
        const all = await prisma.customer.findMany({ select: { id: true, phone: true } });
        const found = all.find((c) => normalizePhone(c.phone) === phoneNorm);
        if (found) {
          customer = await prisma.customer.findUnique({
            where: { id: found.id },
            include: { account: true },
          }) ?? null;
        }
      }
      if (customer?.account) {
        return NextResponse.json({
          error: 'Este telefone já está vinculado a uma conta. Faça login ou use "Esqueci minha senha".',
        }, { status: 400 });
      }
      // Telefone já existe com outro CPF → não sobrescrever
      if (customer.cpf && normalizeCpf(customer.cpf) !== cpfNorm) {
        return NextResponse.json({
          error: 'Este telefone já está cadastrado com outro CPF. Se já tem conta, faça login com seu e-mail.',
        }, { status: 400 });
      }
    }

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          phone: phoneNorm,
          email,
          cpf: cpfNorm,
        },
        include: { account: true },
      });
    } else {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { name, phone: phoneNorm, email, cpf: cpfNorm },
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
  } catch (error: unknown) {
    console.error('Erro ao registrar cliente:', error);
    // Conflito de unicidade (email ou telefone já conta) — mensagem amigável
    const prismaError = error as { code?: string };
    if (prismaError?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este CPF, e-mail ou telefone já está vinculado a uma conta. Faça login ou use "Esqueci minha senha".' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro ao criar conta. Tente novamente.' },
      { status: 500 }
    );
  }
}
