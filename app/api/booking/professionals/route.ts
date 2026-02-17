import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** GET - Lista profissionais ativos (público, para agendamento do cliente). */
export async function GET() {
  try {
    const professionals = await prisma.professional.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return NextResponse.json(professionals.map((p) => p.name));
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar profissionais' },
      { status: 500 }
    );
  }
}
