import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bookingPostSchema } from '@/lib/schemas';
import { APPOINTMENT_STATUS } from '@/lib/constants';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Retorna IDs de serviço na ordem enviada: serviceIds se preenchido, senão [serviceId]. */
function getServiceIds(data: { serviceId?: number; serviceIds?: number[] }): number[] {
  if (data.serviceIds && data.serviceIds.length > 0) return data.serviceIds;
  if (data.serviceId != null && data.serviceId > 0) return [data.serviceId];
  return [];
}

/**
 * POST - Criar agendamento(s) pelo cliente (público).
 * Body: phone, name?, serviceId ou serviceIds[] (vários em sequência), date (ISO), professional?, notes?
 * Encontra ou cria cliente; valida conflitos; cria um agendamento por serviço, em horários consecutivos.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bookingPostSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg = Object.values(first).flat().find(Boolean) || parsed.error.message;
      return NextResponse.json({ error: String(msg) }, { status: 400 });
    }

    const { phone, name, date, professional, notes } = parsed.data;
    const serviceIds = getServiceIds(parsed.data);
    const phoneNorm = normalizePhone(phone);
    if (phoneNorm.length < 8) {
      return NextResponse.json(
        { error: 'Telefone inválido' },
        { status: 400 }
      );
    }

    let customer = await prisma.customer.findFirst({
      where: { phone: phoneNorm },
    });
    if (!customer) {
      const all = await prisma.customer.findMany({ select: { id: true, name: true, phone: true } });
      customer = all.find((c) => normalizePhone(c.phone) === phoneNorm) ?? null;
    }

    if (!customer) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Nome é obrigatório para novos clientes. Informe seu nome.' },
          { status: 400 }
        );
      }
      customer = await prisma.customer.create({
        data: {
          name: name.trim(),
          phone: phoneNorm,
        },
      });
    }

    const firstSlotStart = new Date(date);
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
      return NextResponse.json(
        { error: 'Um ou mais serviços não foram encontrados.' },
        { status: 400 }
      );
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

    const professionalFilter = professional?.trim().toLowerCase() ?? '';
    const sameDayToCheck = professionalFilter
      ? allSameDay.filter((a) => a.professional != null && a.professional.trim().toLowerCase() === professionalFilter)
      : allSameDay;

    // Conflito = qualquer sobreposição: novo período [slot.start, slot.end] "toca" em [existingStart, existingEnd].
    for (const slot of slots) {
      const hasConflict = sameDayToCheck.some((appt) => {
        const dur = Math.max(1, appt.service?.duration ?? 30);
        const existingStart = appt.date.getTime();
        const existingEnd = existingStart + dur * 60 * 1000;
        return slot.start < existingEnd && slot.end > existingStart;
      });
      if (hasConflict) {
        return NextResponse.json(
          {
            error: professionalFilter
              ? 'Este horário não está mais disponível para o profissional escolhido. Escolha outro horário.'
              : 'Este horário não está disponível. Já existe outro agendamento nesse período. Escolha outro horário.',
          },
          { status: 409 }
        );
      }
    }

    const sameDayByCustomer = await prisma.appointment.findMany({
      where: {
        customerId: customer.id,
        date: { gte: startOfDay, lt: endOfDay },
        status: { not: 'cancelado' },
      },
      include: { service: { select: { duration: true } } },
    });

    for (const slot of slots) {
      const clientConflict = sameDayByCustomer.some((appt) => {
        const dur = appt.service?.duration ?? 0;
        const existingStart = appt.date.getTime();
        const existingEnd = existingStart + dur * 60 * 1000;
        return slot.start < existingEnd && slot.end > existingStart;
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
            customerId: customer!.id,
            serviceId: slot.serviceId,
            date: new Date(slot.start),
            status: APPOINTMENT_STATUS.AGENDADO.toLowerCase(),
            professional: professional?.trim() || null,
            notes: notes?.trim() || null,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao criar agendamento';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
