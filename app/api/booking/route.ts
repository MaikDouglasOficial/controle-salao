import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bookingPostSchema } from '@/lib/schemas';
import { APPOINTMENT_STATUS } from '@/lib/constants';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * POST - Criar agendamento pelo cliente (público).
 * Body: phone, name? (obrigatório se cliente não existir), serviceId, date (ISO), professional?, notes?
 * Encontra ou cria cliente pelo telefone; valida conflitos como no admin; cria agendamento.
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

    const { phone, name, serviceId, date, professional, notes } = parsed.data;
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

    const appointmentDate = new Date(date);

    if (appointmentDate.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Não é possível agendar para data ou horário que já passou.' },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
      select: { id: true, duration: true },
    });
    if (!service) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 400 }
      );
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

    const hasConflict = sameDayToCheck.some((appt) => {
      const dur = Math.max(1, appt.service?.duration ?? 30);
      const existingStart = appt.date.getTime();
      const existingEnd = existingStart + dur * 60 * 1000;
      return newStart < existingEnd && newEnd > existingStart;
    });
    if (hasConflict) {
      return NextResponse.json(
        {
          error: professionalNorm
            ? 'Este horário não está mais disponível para o profissional escolhido. Escolha outro horário.'
            : 'Este horário não está disponível. Já existe outro agendamento nesse período. Escolha outro horário.',
        },
        { status: 409 }
      );
    }

    const dayStart = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1, 0, 0, 0, 0);
    const sameDayByCustomer = await prisma.appointment.findMany({
      where: {
        customerId: customer.id,
        date: { gte: dayStart, lt: dayEnd },
        status: { not: 'cancelado' },
      },
      include: { service: { select: { duration: true } } },
    });

    const clientConflict = sameDayByCustomer.some((appt) => {
      const dur = appt.service?.duration ?? 0;
      const existingStart = appt.date.getTime();
      const existingEnd = existingStart + dur * 60 * 1000;
      return newStart < existingEnd && newEnd > existingStart;
    });
    if (clientConflict) {
      return NextResponse.json(
        { error: 'Você já possui outro agendamento neste horário.' },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerId: customer.id,
        serviceId: service.id,
        date: appointmentDate,
        status: APPOINTMENT_STATUS.AGENDADO.toLowerCase(),
        professional: professional?.trim() || null,
        notes: notes?.trim() || null,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao criar agendamento';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
