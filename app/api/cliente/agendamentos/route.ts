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

function getServiceIds(body: { serviceId?: number; serviceIds?: number[] }): number[] {
  if (Array.isArray(body.serviceIds) && body.serviceIds.length > 0) {
    return body.serviceIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0);
  }
  if (body.serviceId != null && Number.isInteger(Number(body.serviceId)) && Number(body.serviceId) > 0) {
    return [Number(body.serviceId)];
  }
  return [];
}

/** POST - Criar agendamento(s) para o cliente logado. Aceita serviceId ou serviceIds[] (vários em sequência). */
export async function POST(request: NextRequest) {
  const auth = await requireClientSession();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const serviceIds = getServiceIds(body);
    const dateStr = typeof body?.date === 'string' ? body.date : '';
    const professional = typeof body?.professional === 'string' ? body.professional.trim() || null : null;
    const notes = typeof body?.notes === 'string' ? body.notes.trim() || null : null;

    if (serviceIds.length === 0) {
      return NextResponse.json({ error: 'Serviço é obrigatório' }, { status: 400 });
    }
    if (!dateStr) {
      return NextResponse.json({ error: 'Data e horário são obrigatórios' }, { status: 400 });
    }

    const firstSlotStart = new Date(dateStr);
    if (Number.isNaN(firstSlotStart.getTime())) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
    }
    if (firstSlotStart.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Não é possível agendar para data ou horário que já passou.' },
        { status: 400 }
      );
    }

    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, duration: true },
    });
    const idToService = new Map(services.map((s) => [s.id, s]));
    const orderedServices = serviceIds
      .map((id) => idToService.get(id))
      .filter((s): s is NonNullable<typeof s> => s != null);
    if (orderedServices.length !== serviceIds.length) {
      return NextResponse.json({ error: 'Um ou mais serviços não foram encontrados.' }, { status: 400 });
    }

    const professionalNorm = professional?.trim() ?? '';
    if (professionalNorm) {
      const prof = await prisma.professional.findFirst({
        where: { name: professionalNorm, active: true },
        select: { id: true, services: { select: { id: true } } },
      });
      if (!prof) {
        return NextResponse.json(
          { error: 'Profissional não encontrado ou inativo. Escolha outro ou deixe "Qualquer disponível".' },
          { status: 400 }
        );
      }
      const profServiceIds = new Set(prof.services.map((s) => s.id));
      const missing = serviceIds.filter((id) => !profServiceIds.has(id));
      if (missing.length > 0) {
        return NextResponse.json(
          { error: 'Este profissional não realiza um ou mais dos serviços escolhidos. Escolha outro profissional ou remova os serviços.' },
          { status: 400 }
        );
      }
    }

    type Slot = { start: number; end: number; serviceId: number; duration: number };
    let cursor = firstSlotStart.getTime();
    const slots: Slot[] = [];
    for (const svc of orderedServices) {
      const durationMs = svc.duration * 60 * 1000;
      slots.push({ start: cursor, end: cursor + durationMs, serviceId: svc.id, duration: svc.duration });
      cursor += durationMs;
    }

    const startOfDay = new Date(firstSlotStart.getFullYear(), firstSlotStart.getMonth(), firstSlotStart.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(firstSlotStart.getFullYear(), firstSlotStart.getMonth(), firstSlotStart.getDate() + 1, 0, 0, 0, 0);

    const allSameDay = await prisma.appointment.findMany({
      where: {
        date: { gte: startOfDay, lt: endOfDay },
        status: { not: 'cancelado' },
      },
      include: { service: { select: { duration: true } } },
    });
    const professionalNormLower = professional?.trim().toLowerCase() ?? '';
    const sameDayToCheck = professionalNormLower
      ? allSameDay.filter((a) => a.professional != null && a.professional.trim().toLowerCase() === professionalNormLower)
      : allSameDay;

    // Conflito = qualquer sobreposição: novo período [slot.start, slot.end] "toca" em [s, e].
    for (const slot of slots) {
      const hasConflict = sameDayToCheck.some((a) => {
        const dur = Math.max(1, a.service?.duration ?? 30);
        const s = a.date.getTime();
        const e = s + dur * 60 * 1000;
        return slot.start < e && slot.end > s;
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
    }

    const sameDayByCustomer = await prisma.appointment.findMany({
      where: {
        customerId: auth.customerId,
        date: { gte: startOfDay, lt: endOfDay },
        status: { not: 'cancelado' },
      },
      include: { service: { select: { duration: true } } },
    });
    for (const slot of slots) {
      const clientConflict = sameDayByCustomer.some((a) => {
        const dur = a.service?.duration ?? 0;
        const s = a.date.getTime();
        const e = s + dur * 60 * 1000;
        return slot.start < e && slot.end > s;
      });
      if (clientConflict) {
        return NextResponse.json(
          { error: 'Você já possui outro agendamento neste horário.' },
          { status: 409 }
        );
      }
    }

    const created = await prisma.$transaction(
      slots.map((slot) =>
        prisma.appointment.create({
          data: {
            customerId: auth.customerId,
            serviceId: slot.serviceId,
            date: new Date(slot.start),
            status: APPOINTMENT_STATUS.AGENDADO.toLowerCase(),
            professional,
            notes,
          },
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            service: { select: { id: true, name: true, duration: true, price: true } },
          },
        })
      )
    );

    return NextResponse.json(
      created.length === 1 ? created[0] : { appointments: created },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar agendamento' },
      { status: 500 }
    );
  }
}
