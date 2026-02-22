import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '').slice(0, 11);
}

/**
 * GET - Verifica se o CPF já está cadastrado e se já tem conta de acesso.
 * Query: cpf
 * Retorna:
 * - { exists: true, hasAccount: true } → já tem conta, deve fazer login
 * - { exists: true, hasAccount: false, name?: string } → cadastrado (ex.: pelo admin), só precisa criar senha
 * - { exists: false } → não está no sistema, mostrar formulário completo
 */
export async function GET(request: NextRequest) {
  try {
    const cpfRaw = request.nextUrl.searchParams.get('cpf');
    const cpfNorm = normalizeCpf(cpfRaw ?? '');
    if (cpfNorm.length !== 11) {
      return NextResponse.json({ error: 'CPF deve ter 11 dígitos' }, { status: 400 });
    }

    let customer = await prisma.customer.findFirst({
      where: { cpf: cpfNorm },
      include: { account: true },
    });
    if (!customer) {
      const allWithCpf = await prisma.customer.findMany({
        where: { cpf: { not: null } },
        select: { id: true, cpf: true },
      });
      const found = allWithCpf.find((c) => c.cpf && normalizeCpf(c.cpf) === cpfNorm);
      if (found) {
        customer = await prisma.customer.findUnique({
          where: { id: found.id },
          include: { account: true },
        }) ?? null;
      }
    }

    if (!customer) {
      return NextResponse.json({ exists: false });
    }

    const hasAccount = !!customer.account;
    return NextResponse.json({
      exists: true,
      hasAccount,
      ...(hasAccount ? {} : { name: customer.name ?? undefined }),
    });
  } catch (error) {
    console.error('Erro ao verificar CPF:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar cadastro' },
      { status: 500 }
    );
  }
}
