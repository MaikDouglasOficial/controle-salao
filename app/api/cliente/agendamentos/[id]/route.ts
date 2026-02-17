import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireClientSession } from '@/lib/auth-api';
import { APPOINTMENT_STATUS } from '@/lib/constants';

const ALLOWED_FOR_CLIENT = [APPOINTMENT_STATUS.AGENDADO, APPOINTMENT_STATUS.CONFIRMADO];

/** PATCH - Cliente altera ou edita o agendamento (até status confirmado), com justificativa obrigatória. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireClientSession();
  if ('error' in auth) return auth.error;

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id, customerId: auth.customerId },
    include: { service: { select: { id: true, duration: true } } },
  });
  if (!appointment) {
    return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
  }

  const statusNorm = (appointment.status || '').toLowerCase();
  if (!ALLOWED_FOR_CLIENT.includes(statusNorm)) {
    return NextResponse.json(
      { error: 'Este agendamento não pode mais ser alterado pelo cliente.' },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });
  }

  const justification = typeof body?.justification === 'string' ? body.justification.trim() : '';
  if (!justification || justification.length < 3) {
    return NextResponse.json(
      { error: 'Justificativa é obrigatória (mínimo 3 caracteres).' },
      { status: 400 }
    );
  }

  const newStatus = typeof body?.status === 'string' ? body.status.toLowerCase() : null;
  if (newStatus && !['agendado', 'confirmado', 'cancelado'].includes(newStatus)) {
    return NextResponse.json(
      { error: 'Status permitidos para o cliente: confirmado ou cancelado.' },
      { status: 400 }
    );
  }
  if (newStatus === 'concluido' || newStatus === 'faturado') {
    return NextResponse.json(
      { error: 'Alteração para este status é feita apenas pelo salão.' },
      { status: 403 }
    );
  }

  const serviceId = body?.serviceId != null ? Number(body.serviceId) : null;
  const dateStr = typeof body?.date === 'string' ? body.date : null;
  const professional = typeof body?.professional === 'string' ? body.professional.trim() || null : undefined;
  const notes = typeof body?.notes === 'string' ? body.notes.trim() || null : undefined;

  let appointmentDate = appointment.date;
  let finalServiceId = appointment.serviceId;
  let finalProfessional = appointment.professional;
  let finalNotes = appointment.notes;
  let finalStatus = statusNorm;

  if (newStatus === 'cancelado') {
    finalStatus = APPOINTMENT_STATUS.CANCELADO;
  } else if (dateStr || serviceId || professional !== undefined || notes !== undefined) {
    // Qualquer alteração nos dados (como no admin) volta o status para agendado
    finalStatus = APPOINTMENT_STATUS.AGENDADO;
  } else if (newStatus === 'confirmado') {
    finalStatus = APPOINTMENT_STATUS.CONFIRMADO;
  }

  if (dateStr || serviceId || professional !== undefined || notes !== undefined) {
    if (dateStr) {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
      }
      if (d.getTime() < Date.now()) {
        return NextResponse.json(
          { error: 'Não é possível agendar para data ou horário que já passou.' },
          { status: 400 }
        );
      }
      appointmentDate = d;
    }
    if (serviceId && Number.isInteger(serviceId) && serviceId > 0) {
      const svc = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { id: true, duration: true },
      });
      if (!svc) {
        return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 400 });
      }
      finalServiceId = svc.id;
    }
    if (professional !== undefined) finalProfessional = professional;
    if (notes !== undefined) finalNotes = notes;
  }

  const durationMin = appointment.service?.duration ?? 30;
  const startOfDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1, 0, 0, 0, 0);

  if (finalStatus !== 'cancelado') {
    const allSameDay = await prisma.appointment.findMany({
      where: {
        id: { not: id },
        date: { gte: startOfDay, lt: endOfDay },
        status: { not: 'cancelado' },
      },
      include: { service: { select: { duration: true } } },
    });
    const professionalNorm = (finalProfessional ?? '').trim().toLowerCase();
    const sameDayToCheck = professionalNorm
      ? allSameDay.filter((a) => a.professional != null && a.professional.trim().toLowerCase() === professionalNorm)
      : allSameDay;
    const newStart = appointmentDate.getTime();
    const newEnd = newStart + durationMin * 60 * 1000;
    const conflict = sameDayToCheck.some((a) => {
      const dur = Math.max(1, a.service?.duration ?? 30);
      const s = a.date.getTime();
      const e = s + dur * 60 * 1000;
      return newStart < e && newEnd > s;
    });
    if (conflict) {
      return NextResponse.json(
        {
          error: 'Este horário não está disponível para o profissional escolhido.',
        },
        { status: 409 }
      );
    }

    const sameDayByCustomer = await prisma.appointment.findMany({
      where: {
        customerId: auth.customerId,
        id: { not: id },
        date: { gte: startOfDay, lt: endOfDay },
        status: { not: 'cancelado' },
      },
      include: { service: { select: { duration: true } } },
    });
    const clientConflict = sameDayByCustomer.some((a) => {
      const dur = Math.max(1, a.service?.duration ?? 30);
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
  }

  const justificationLabel =
    finalStatus === APPOINTMENT_STATUS.CANCELADO
      ? 'Cancelamento'
      : finalStatus === APPOINTMENT_STATUS.CONFIRMADO && statusNorm !== APPOINTMENT_STATUS.CONFIRMADO
        ? 'Confirmação'
        : 'Alteração';
  const justificationNote = `[${new Date().toLocaleString('pt-BR')}] ${justificationLabel} pelo cliente: ${justification}`;
  const updatedNotes = finalNotes ? `${finalNotes}\n${justificationNote}` : justificationNote;

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(dateStr ? { date: appointmentDate } : {}),
      ...(serviceId && Number.isInteger(serviceId) ? { serviceId: finalServiceId } : {}),
      ...(professional !== undefined ? { professional: finalProfessional } : {}),
      notes: updatedNotes,
      status: finalStatus,
      ...(finalStatus === APPOINTMENT_STATUS.CANCELADO
        ? { cancellationReason: justification }
        : {}),
    },
    include: {
      service: { select: { id: true, name: true, duration: true, price: true } },
    },
  });

  return NextResponse.json(updated);
}

/** DELETE - Cliente exclui o próprio agendamento (apenas concluídos). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireClientSession();
  if ('error' in auth) return auth.error;

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id, customerId: auth.customerId },
    select: { id: true, status: true },
  });
  if (!appointment) {
    return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
  }

  const statusNorm = (appointment.status || '').toLowerCase();
  if (statusNorm !== APPOINTMENT_STATUS.CONCLUIDO && statusNorm !== 'faturado') {
    return NextResponse.json(
      { error: 'Apenas agendamentos concluídos podem ser excluídos pelo cliente.' },
      { status: 403 }
    );
  }

  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
