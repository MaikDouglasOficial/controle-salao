import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * GET - Verifica se existe cliente com o telefone (público).
 * Query: phone
 * Retorna { name } se existir; 404 se não existir.
 */
export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get('phone');
    if (!phone || phone.length < 8) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
    }
    const phoneNorm = normalizePhone(phone);
    let customer = await prisma.customer.findFirst({
      where: { phone: phoneNorm },
      select: { name: true },
    });
    if (!customer) {
      const all = await prisma.customer.findMany({ select: { phone: true, name: true } });
      const found = all.find((c) => normalizePhone(c.phone) === phoneNorm);
      if (found) customer = { name: found.name };
    }
    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao consultar cliente' },
      { status: 500 }
    );
  }
}
