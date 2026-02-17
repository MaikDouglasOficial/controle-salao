import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireClientSession } from '@/lib/auth-api';
import { APPOINTMENT_STATUS } from '@/lib/constants';

/** GET - Lista agendamentos do cliente logado (passados e futuros). */
export async function GET() {
  const auth = await requireClientSession();
  if ('error' in auth) return auth.error;

  const appointments = await prisma.appointment.findMany({
    where: { customerId: auth.customerId },
    orderBy: { date: 'desc' },
    include: {
      service: { select: { id: true, name: true, duration: true, price: true } },
    },
  });

  const now = new Date();
  const past = appointments.filter((a) => new Date(a.date) < now);
  const upcoming = appointments.filter((a) => new Date(a.date) >= now);

  /** Cliente vê apenas até "concluído"; "faturado" só no admin. */
  const clientStatus = (s: string) =>
    (s || '').toLowerCase() === 'faturado' ? 'concluido' : (s || 'agendado');

  return NextResponse.json({
    upcoming: upcoming.map((a) => ({
      id: a.id,
      date: a.date.toISOString(),
      status: clientStatus(a.status),
      professional: a.professional,
      notes: a.notes,
      service: a.service,
    })),
    past: past.map((a) => ({
      id: a.id,
      date: a.date.toISOString(),
      status: clientStatus(a.status),
      professional: a.professional,
      service: a.service,
    })),
  });
}

/** POST - Criar agendamento para o cliente logado (sem precisar de telefone/nome). */
export async function POST(request: NextRequest) {
  const auth = await requireClientSession();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const serviceId = body?.serviceId != null ? Number(body.serviceId) : NaN;
    const dateStr = typeof body?.date === 'string' ? body.date : '';
    const professional = typeof body?.professional === 'string' ? body.professional.trim() || null : null;
    const notes = typeof body?.notes === 'string' ? body.notes.trim() || null : null;

    if (!serviceId || !Number.isInteger(serviceId) || serviceId < 1) {
      return NextResponse.json({ error: 'Serviço é obrigatório' }, { status: 400 });
    }
    if (!dateStr) {
      return NextResponse.json({ error: 'Data e horário são obrigatórios' }, { status: 400 });
    }

    const appointmentDate = new Date(dateStr);
    if (Number.isNaN(appointmentDate.getTime())) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
    }
    if (appointmentDate.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Não é possível agendar para data ou horário que já passou.' },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, duration: true },
    });
    if (!service) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 400 });
    }

    const newStart = appointmentDate.getTime();
    const newEnd = newStart + service.duration * 60 * 1000;
    const startOfDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1, 0, 0, 0, 0);

    const allSameDay = await prisma.appointment.findMany({
      where: {
        date: { gte: startOfDay, lt: endOfDay },
        status: { not: 'cancelado' },
      },
      include: { service: { select: { duration: true } } },
    });
    const professionalNorm = professional?.trim().toLowerCase() ?? '';
    const sameDayToCheck = professionalNorm
      ? allSameDay.filter((a) => a.professional != null && a.professional.trim().toLowerCase() === professionalNorm)
      : allSameDay;
    const hasConflict = sameDayToCheck.some((a) => {
      const dur = Math.max(1, a.service?.duration ?? 30);
      const s = a.date.getTime();
      const e = s + dur * 60 * 1000;
      return newStart < e && newEnd > s;
    });
    if (hasConflict) {
      return NextResponse.json(
        {
          error: professionalNorm
            ? 'Este horário não está mais disponível para o profissional escolhido.'
            : 'Este horário não está disponível. Já existe outro agendamento nesse período.',
        },
        { status: 409 }
      );
    }

    const dayStart = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1, 0, 0, 0, 0);
    const sameDayByCustomer = await prisma.appointment.findMany({
      where: {
        customerId: auth.customerId,
        date: { gte: dayStart, lt: dayEnd },
        status: { not: 'cancelado' },
      },
      include: { service: { select: { duration: true } } },
    });
    const clientConflict = sameDayByCustomer.some((a) => {
      const dur = a.service?.duration ?? 0;
      const s = a.date.getTime();
      const e = s + dur * 60 * 1000;
      return newStart < e && newEnd > s;
    });
    if (clientConflict) {
      return NextResponse.json(
        { error: 'Você já possui outro agendamento neste horário.' },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerId: auth.customerId,
        serviceId: service.id,
        date: appointmentDate,
        status: APPOINTMENT_STATUS.AGENDADO.toLowerCase(),
        professional,
        notes,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar agendamento' },
      { status: 500 }
    );
  }
}
