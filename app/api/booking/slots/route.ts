import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET - Horários ocupados em um dia (público).
 * Query: date (YYYY-MM-DD), professional (opcional).
 * Se professional for informado: retorna ocupação daquele profissional.
 * Se não: retorna ocupação de todos os agendamentos do dia (para "Qualquer disponível").
 * Retorna array de { start: ISO, end: ISO } considerando a duração de cada serviço.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const professional = searchParams.get('professional');
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { error: 'Parâmetro date é obrigatório' },
        { status: 400 }
      );
    }

    const d = new Date(dateStr + 'T00:00:00');
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
    }

    const startOfDay = new Date(d);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);

    const where: { date: { gte: Date; lte: Date }; status: { not: string }; id?: { not: number } } = {
      date: { gte: startOfDay, lte: endOfDay },
      status: { not: 'cancelado' },
    };
    const excludeId = searchParams.get('excludeId');
    if (excludeId) {
      const id = parseInt(excludeId, 10);
      if (Number.isInteger(id) && id > 0) where.id = { not: id };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        service: { select: { duration: true } },
      },
    });

    const professionalNorm = professional?.trim().toLowerCase() ?? '';
    const filtered = professionalNorm
      ? appointments.filter((a) => a.professional != null && a.professional.trim().toLowerCase() === professionalNorm)
      : appointments;

    const slots = filtered.map((a) => {
      const start = a.date.getTime();
      const duration = Math.max(1, a.service?.duration ?? 30);
      return {
        start: new Date(start).toISOString(),
        end: new Date(start + duration * 60 * 1000).toISOString(),
      };
    });

    return NextResponse.json(slots);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar horários' },
      { status: 500 }
    );
  }
}
