import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/appointments
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    const where = customerId ? { customerId: parseInt(customerId) } : {};

    const appointments = await prisma.appointment.findMany({
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
      orderBy: {
        date: 'desc',
      },
    });

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
    const body = await request.json();
    console.log('Dados recebidos na API:', body);
    
    const { customerId, serviceId, date, status, professional, notes } = body;

    if (!customerId || !serviceId || !date) {
      console.error('Validação falhou:', { customerId, serviceId, date });
      return NextResponse.json(
        { error: 'Cliente, serviço e data são obrigatórios' },
        { status: 400 }
      );
    }

    const appointmentDate = new Date(date);

    if (professional) {
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

      const startOfDay = new Date(appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);

      const sameDayAppointments = await prisma.appointment.findMany({
        where: {
          professional,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            not: 'cancelado',
          },
        },
        include: {
          service: {
            select: { duration: true },
          },
        },
      });

      const newStart = appointmentDate.getTime();
      const newEnd = newStart + service.duration * 60 * 1000;

      const hasConflict = sameDayAppointments.some((appt) => {
        if (!appt.service?.duration) return false;
        const existingStart = appt.date.getTime();
        const existingEnd = existingStart + appt.service.duration * 60 * 1000;
        return newStart < existingEnd && newEnd > existingStart;
      });

      if (hasConflict) {
        return NextResponse.json(
          { error: 'Já existe um agendamento para este profissional neste horário' },
          { status: 409 }
        );
      }
    }

    const appointmentData = {
      customerId: parseInt(customerId),
      serviceId: parseInt(serviceId),
      date: appointmentDate,
      status: status || 'agendado',
      professional: professional || null,
      notes: notes || null,
    };
    
    console.log('Criando agendamento com dados:', appointmentData);

    const appointment = await prisma.appointment.create({
      data: appointmentData,
      include: {
        customer: true,
        service: true,
      },
    });

    console.log('Agendamento criado com sucesso:', appointment);
    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar agendamento', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/appointments
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, customerId, serviceId, date, status, professional, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do agendamento é obrigatório' },
        { status: 400 }
      );
    }

    const appointmentDate = new Date(date);

    if (professional) {
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

      const startOfDay = new Date(appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);

      const sameDayAppointments = await prisma.appointment.findMany({
        where: {
          professional,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            not: 'cancelado',
          },
          NOT: {
            id,
          },
        },
        include: {
          service: {
            select: { duration: true },
          },
        },
      });

      const newStart = appointmentDate.getTime();
      const newEnd = newStart + service.duration * 60 * 1000;

      const hasConflict = sameDayAppointments.some((appt) => {
        if (!appt.service?.duration) return false;
        const existingStart = appt.date.getTime();
        const existingEnd = existingStart + appt.service.duration * 60 * 1000;
        return newStart < existingEnd && newEnd > existingStart;
      });

      if (hasConflict) {
        return NextResponse.json(
          { error: 'Já existe um agendamento para este profissional neste horário' },
          { status: 409 }
        );
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        customerId: parseInt(customerId),
        serviceId: parseInt(serviceId),
        date: appointmentDate,
        status,
        professional: professional || null,
        notes: notes || null,
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
