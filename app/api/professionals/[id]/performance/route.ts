import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const professional = await prisma.professional.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        specialty: true,
        photo: true,
        active: true,
        commissionPercentage: true,
      },
    });

    if (!professional) {
      return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 });
    }

    const sales = await prisma.sale.findMany({
      where: {
        professional: professional.name,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            service: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const percentage = professional.commissionPercentage || 0;
    const services = sales.flatMap((sale) =>
      sale.items
        .filter((item) => item.serviceId)
        .map((item) => {
          const base = item.price * item.quantity;
          const commission = (base * percentage) / 100;
          return {
            saleId: sale.id,
            date: sale.date,
            customerName: sale.customer?.name || 'Cliente não informado',
            serviceName: item.service?.name || 'Serviço',
            quantity: item.quantity,
            price: item.price,
            commission,
          };
        })
    );

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalCommission = services.reduce((sum, item) => sum + item.commission, 0);
    const todayCommission = services
      .filter((item) => new Date(item.date) >= startOfDay)
      .reduce((sum, item) => sum + item.commission, 0);
    const monthCommission = services
      .filter((item) => new Date(item.date) >= startOfMonth)
      .reduce((sum, item) => sum + item.commission, 0);

    return NextResponse.json({
      professional,
      summary: {
        today: todayCommission,
        month: monthCommission,
        total: totalCommission,
      },
      services,
    });
  } catch (error) {
    console.error('Erro ao buscar desempenho:', error);
    return NextResponse.json({ error: 'Erro ao buscar desempenho' }, { status: 500 });
  }
}