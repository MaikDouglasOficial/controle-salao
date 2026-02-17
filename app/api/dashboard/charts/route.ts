import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { requireSession } from '@/lib/auth-api';

// Força a API a nunca usar cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const auth = await requireSession();
    if ('error' in auth) return auth.error;

    const chartData = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const targetDate = subMonths(today, i);
      const startDate = startOfMonth(targetDate);
      const endDate = endOfMonth(targetDate);

      const sales = await prisma.sale.aggregate({
        _sum: {
          total: true,
        },
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const expenses = await prisma.expense.aggregate({
        _sum: {
          value: true,
        },
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      chartData.push({
        // Formata para "Mês" (e.g., "Set", "Out")
        mes: format(startDate, 'MMM', { locale: ptBR }),
        receita: sales._sum.total || 0,
        despesa: expenses._sum.value || 0,
      });
    }

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Erro ao buscar dados para os gráficos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
