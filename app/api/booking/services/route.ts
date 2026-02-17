import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** GET - Lista serviços (público, para página de agendamento do cliente). */
export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, duration: true, price: true, description: true },
    });
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar serviços' },
      { status: 500 }
    );
  }
}
