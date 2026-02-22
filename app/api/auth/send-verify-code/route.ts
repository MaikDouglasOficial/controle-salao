import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '').slice(0, 11);
}

/** Gera código de 6 dígitos */
function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Mascara telefone: *****1234 */
function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length < 4) return '****';
  return '*'.repeat(Math.min(d.length - 4, 5)) + d.slice(-4);
}

/**
 * POST - Envia código de verificação por WhatsApp para o cliente (CPF já cadastrado, sem conta).
 * Body: { cpf }
 * O cliente deve já existir (ex.: cadastro pelo admin) e não ter conta de acesso.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cpfRaw = typeof body.cpf === 'string' ? body.cpf : '';
    const cpfNorm = normalizeCpf(cpfRaw);
    if (cpfNorm.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
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
      return NextResponse.json(
        { error: 'CPF não encontrado no cadastro. Faça o cadastro completo primeiro.' },
        { status: 400 }
      );
    }
    if (customer.account) {
      return NextResponse.json(
        { error: 'Este CPF já possui uma conta. Faça login ou use "Esqueci minha senha".' },
        { status: 400 }
      );
    }

    const phone = customer.phone?.replace(/\D/g, '') ?? '';
    if (phone.length < 8) {
      return NextResponse.json(
        { error: 'Não há telefone cadastrado para este CPF. Entre em contato com o salão.' },
        { status: 400 }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await prisma.customerVerificationSession.deleteMany({ where: { customerId: customer.id } });
    await prisma.customerVerificationSession.create({
      data: { customerId: customer.id, code, expiresAt },
    });

    const message = `Corte-Já - Código de verificação: ${code}\n\nUse este código para criar sua senha de acesso. Válido por 10 minutos. Não compartilhe.`;

    const result = await sendWhatsAppMessage({
      to: customer.phone,
      message,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Não foi possível enviar o código por WhatsApp. Verifique o número cadastrado ou tente mais tarde.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      sent: true,
      maskedPhone: maskPhone(customer.phone),
    });
  } catch (error) {
    console.error('Erro ao enviar código:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar código. Tente novamente.' },
      { status: 500 }
    );
  }
}
