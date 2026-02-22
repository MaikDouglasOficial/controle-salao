import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** GET - Lista profissionais ativos com IDs dos serviços que realizam (público, para agendamento). */
export async function GET() {
  try {
    const professionals = await prisma.professional.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, services: { select: { id: true } } },
    });
    return NextResponse.json(
      professionals.map((p) => ({ name: p.name, serviceIds: p.services.map((s) => s.id) }))
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar profissionais' },
      { status: 500 }
    );
  }
}
