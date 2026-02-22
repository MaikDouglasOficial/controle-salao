import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createVerifyToken } from '@/lib/verify-token';

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '').slice(0, 11);
}

/**
 * POST - Valida o código enviado por WhatsApp e retorna um token para usar em register-client.
 * Body: { cpf, code }
 * Retorna: { verified: true, verifyToken: string } — o front envia verifyToken no POST register-client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cpfRaw = typeof body.cpf === 'string' ? body.cpf : '';
    const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '').slice(0, 6) : '';
    const cpfNorm = normalizeCpf(cpfRaw);

    if (cpfNorm.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }
    if (code.length !== 6) {
      return NextResponse.json({ error: 'Código deve ter 6 dígitos' }, { status: 400 });
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
      return NextResponse.json({ error: 'CPF não encontrado' }, { status: 400 });
    }

    const session = await prisma.customerVerificationSession.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      return NextResponse.json({ error: 'Nenhum código enviado para este CPF. Solicite um novo código.' }, { status: 400 });
    }
    if (new Date() > session.expiresAt) {
      await prisma.customerVerificationSession.deleteMany({ where: { customerId: customer.id } });
      return NextResponse.json({ error: 'Código expirado. Solicite um novo código.' }, { status: 400 });
    }
    if (session.code !== code) {
      return NextResponse.json({ error: 'Código incorreto. Tente novamente.' }, { status: 400 });
    }

    await prisma.customerVerificationSession.deleteMany({ where: { customerId: customer.id } });

    const verifyToken = createVerifyToken(customer.id);
    return NextResponse.json({ verified: true, verifyToken });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar código. Tente novamente.' },
      { status: 500 }
    );
  }
}
