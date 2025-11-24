import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/customers/enriched - Listar clientes com dados enriquecidos (último atendimento e total gasto)
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        appointments: {
          orderBy: {
            date: 'desc',
          },
          take: 1,
          select: {
            date: true,
            status: true,
          },
        },
        sales: {
          select: {
            total: true,
          },
        },
      },
    });

    // Transformar os dados para incluir último atendimento e total gasto
    const enrichedCustomers = customers.map((customer) => {
      const lastAppointment = customer.appointments[0]?.date || null;
      const totalSpent = customer.sales.reduce((sum, sale) => sum + sale.total, 0);
      
      // Calcular dias de inatividade
      const daysInactive = lastAppointment 
        ? Math.floor((new Date().getTime() - new Date(lastAppointment).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        cpf: (customer as any).cpf || null,
        birthday: customer.birthday,
        notes: customer.notes,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        lastAppointment,
        totalSpent,
        daysInactive,
        hasNotes: !!customer.notes,
      };
    });

    return NextResponse.json(enrichedCustomers);
  } catch (error) {
    console.error('Erro ao buscar clientes enriquecidos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
      { status: 500 }
    );
  }
}
