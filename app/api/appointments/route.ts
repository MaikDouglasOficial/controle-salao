import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth-api';
import { appointmentPostSchema, appointmentPutSchema } from '@/lib/schemas';
import { APPOINTMENT_STATUS } from '@/lib/constants';

// GET /api/appointments?customerId=1&startDate=...&endDate=...&page=1&limit=50
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const professional = searchParams.get('professional');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');

    const where: Record<string, unknown> = {};
    if (customerId) where.customerId = parseInt(customerId, 10);
    if (professional != null && professional !== '') where.professional = professional;

    if (startDateStr || endDateStr) {
      const start = startDateStr ? new Date(startDateStr) : undefined;
      const end = endDateStr ? new Date(endDateStr) : undefined;
      if (start || end) {
        where.date = {};
        if (start) (where.date as Record<string, Date>).gte = start;
        if (end) (where.date as Record<string, Date>).lte = end;
      }
    }

    const page = pageStr ? Math.max(1, parseInt(pageStr, 10)) : null;
    const limit = limitStr ? Math.min(100, Math.max(1, parseInt(limitStr, 10))) : null;
    const skip = page != null && limit != null ? (page - 1) * limit : undefined;
    const take = limit ?? undefined;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      page != null && limit != null ? prisma.appointment.count({ where }) : Promise.resolve(null),
    ]);

    if (total != null) {
      return NextResponse.json({ data: appointments, total, page: page!, limit: limit! });
    }
    return NextResponse.json(appointments);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar agendamentos' },
      { status: 500 }
    );
  }
}

// POST /api/appointments
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const parsed = appointmentPostSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg = Object.values(first).flat().find(Boolean) || parsed.error.message;
      return NextResponse.json({ error: String(msg) }, { status: 400 });
    }

    const { customerId, serviceId, date, status, professional, notes } = parsed.data;
    const statusNorm = (status ?? APPOINTMENT_STATUS.AGENDADO).toLowerCase();
    const appointmentDate = new Date(date);

    // Não permitir agendar no passado
    if (appointmentDate.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Não é possível agendar para data ou horário que já passou.' },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: parseInt(serviceId) },
      select: { duration: true },
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
          error: 'Já existe um agendamento para este profissional neste horário (o período sobrepõe outro considerando a duração).',
        },
        { status: 409 }
      );
    }

    // Mesmo cliente + mesmo horário: impede dois agendamentos simultâneos (considera duração)
    const sameDayByCustomer = await prisma.appointment.findMany({
      where: {
        customerId: parseInt(customerId),
        date: {
          gte: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate(), 0, 0, 0, 0),
          lt: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1, 0, 0, 0, 0),
        },
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
        { error: 'Este cliente já possui outro agendamento neste horário' },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerId,
        serviceId,
        date: appointmentDate,
        status: statusNorm,
        professional: professional ?? null,
        notes: notes ?? null,
      },
      include: {
        customer: true,
        service: true,
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

// PUT /api/appointments
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const parsed = appointmentPutSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg = Object.values(first).flat().find(Boolean) || parsed.error.message;
      return NextResponse.json({ error: String(msg) }, { status: 400 });
    }

    const { id, customerId, serviceId, date, status, professional, notes, cancellationReason } = parsed.data;
    const statusNorm = status.toLowerCase();
    const appointmentDate = new Date(date);

    // Não permitir alterar para data/horário no passado (exceto se for a mesma data já salva)
    const newTime = appointmentDate.getTime();
    if (newTime < Date.now()) {
      const existing = await prisma.appointment.findUnique({
        where: { id: parseInt(id) },
        select: { date: true },
      });
      if (!existing || existing.date.getTime() !== newTime) {
        return NextResponse.json(
          { error: 'Não é possível agendar para data ou horário que já passou.' },
          { status: 400 }
        );
      }
    }

    const serviceForDuration = await prisma.service.findUnique({
      where: { id: parseInt(serviceId) },
      select: { duration: true },
    });
    if (!serviceForDuration) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 400 }
      );
    }
    const durationMin = serviceForDuration.duration ?? 30;
    const startMs = appointmentDate.getTime();
    const endMs = startMs + durationMin * 60 * 1000;
    const startOfDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1, 0, 0, 0, 0);

    const allSameDay = await prisma.appointment.findMany({
      where: {
        id: { not: parseInt(id) },
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
      return startMs < existingEnd && endMs > existingStart;
    });
    if (hasConflict) {
      return NextResponse.json(
        {
          error: 'Já existe um agendamento para este profissional neste horário (o período sobrepõe outro considerando a duração).',
        },
        { status: 409 }
      );
    }

    // Mesmo cliente + mesmo horário (excluindo este agendamento)

    const sameDayByCustomer = await prisma.appointment.findMany({
      where: {
        customerId: parseInt(customerId),
        id: { not: parseInt(id) },
        date: {
          gte: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate(), 0, 0, 0, 0),
          lt: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1, 0, 0, 0, 0),
        },
        status: { not: 'cancelado' },
      },
      include: { service: { select: { duration: true } } },
    });

    const clientConflictPut = sameDayByCustomer.some((appt) => {
      const dur = appt.service?.duration ?? 0;
      const existingStart = appt.date.getTime();
      const existingEnd = existingStart + dur * 60 * 1000;
      return startMs < existingEnd && endMs > existingStart;
    });
    if (clientConflictPut) {
      return NextResponse.json(
        { error: 'Este cliente já possui outro agendamento neste horário' },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        customerId,
        serviceId,
        date: appointmentDate,
        status: statusNorm,
        professional: professional ?? null,
        notes: notes ?? null,
        ...(statusNorm === APPOINTMENT_STATUS.CANCELADO && cancellationReason !== undefined
          ? { cancellationReason: cancellationReason === '' || cancellationReason === null ? null : String(cancellationReason) }
          : {}),
      },
      include: {
        customer: true,
        service: true,
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar agendamento' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments?id=123
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do agendamento é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.appointment.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar agendamento' },
      { status: 500 }
    );
  }
}
