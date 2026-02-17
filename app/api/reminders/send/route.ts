import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth-api';
import { sendAppointmentReminder, isEmailConfigured } from '@/lib/email';
import { APPOINTMENT_STATUS } from '@/lib/constants';

const REMINDER_HOURS_AHEAD = 24; // enviar lembretes para agendamentos nas próximas 24h

/**
 * POST /api/reminders/send
 * Envia lembretes por e-mail para agendamentos nas próximas REMINDER_HOURS_AHEAD horas
 * que ainda não tiveram lembrete enviado (status agendado ou confirmado).
 */
export async function POST() {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          error: 'E-mail não configurado',
          detail: 'Configure SMTP_HOST, SMTP_USER e SMTP_PASS no arquivo .env para enviar lembretes.',
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const limit = new Date(now.getTime() + REMINDER_HOURS_AHEAD * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: now, lte: limit },
        status: { in: [APPOINTMENT_STATUS.AGENDADO, APPOINTMENT_STATUS.CONFIRMADO] },
        reminderSentAt: null,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true } },
      },
    });

    const results = { sent: 0, skipped: 0, errors: [] as string[] };

    for (const apt of appointments) {
      const email = apt.customer.email?.trim();
      if (!email) {
        results.skipped++;
        await prisma.notificationLog.create({
          data: {
            appointmentId: apt.id,
            message: `Lembrete não enviado: cliente ${apt.customer.name} sem e-mail cadastrado`,
            status: 'pendente',
          },
        });
        continue;
      }

      const result = await sendAppointmentReminder({
        customerName: apt.customer.name,
        customerEmail: email,
        serviceName: apt.service.name,
        appointmentDate: apt.date,
        professional: apt.professional || undefined,
      });

      if (result.ok) {
        results.sent++;
        await prisma.$transaction([
          prisma.appointment.update({
            where: { id: apt.id },
            data: { reminderSentAt: new Date() },
          }),
          prisma.notificationLog.create({
            data: {
              appointmentId: apt.id,
              message: 'Lembrete de agendamento enviado por e-mail',
              status: 'enviado',
            },
          }),
        ]);
      } else {
        results.errors.push(`${apt.customer.name} (${apt.service.name}): ${result.error || 'erro desconhecido'}`);
        await prisma.notificationLog.create({
          data: {
            appointmentId: apt.id,
            message: `Tentativa de lembrete: ${result.error || 'erro'}`,
            status: 'erro',
            errorMessage: result.error || undefined,
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      total: appointments.length,
      sent: results.sent,
      skipped: results.skipped,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('Erro ao enviar lembretes:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar lembretes' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reminders/send
 * Retorna se o e-mail está configurado e quantos agendamentos estão elegíveis para lembrete.
 */
export async function GET() {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const configured = isEmailConfigured();
    if (!configured) {
      return NextResponse.json({
        configured: false,
        eligible: 0,
        message: 'Configure SMTP no .env para enviar lembretes.',
      });
    }

    const now = new Date();
    const limit = new Date(now.getTime() + REMINDER_HOURS_AHEAD * 60 * 60 * 1000);

    const eligible = await prisma.appointment.count({
      where: {
        date: { gte: now, lte: limit },
        status: { in: [APPOINTMENT_STATUS.AGENDADO, APPOINTMENT_STATUS.CONFIRMADO] },
        reminderSentAt: null,
      },
    });

    return NextResponse.json({
      configured: true,
      eligible,
      hoursAhead: REMINDER_HOURS_AHEAD,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao verificar lembretes' }, { status: 500 });
  }
}
