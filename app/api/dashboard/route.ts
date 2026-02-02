import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Força a API a nunca usar cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Usar data local sem conversão de timezone para simplificar
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    const inicioAno = new Date(hoje.getFullYear(), 0, 1);
    const fimAno = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59);

    console.log('Dashboard API - Datas calculadas:', {
      hoje: hoje.toISOString(),
      amanha: amanha.toISOString(),
      inicioMes: inicioMes.toISOString(),
      fimMes: fimMes.toISOString()
    });

    // Calcular lucro do dia
    const vendasDia = await prisma.sale.aggregate({
      where: {
        date: {
          gte: hoje,
          lte: amanha,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Calcular lucro do mês
    const vendasMes = await prisma.sale.aggregate({
      where: {
        date: {
          gte: inicioMes,
          lte: fimMes,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Calcular lucro do ano
    const vendasAno = await prisma.sale.aggregate({
      where: {
        date: {
          gte: inicioAno,
          lte: fimAno,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Calcular despesas do mês
    const despesasMes = await prisma.expense.aggregate({
      where: {
        date: {
          gte: inicioMes,
          lte: fimMes,
        },
      },
      _sum: {
        value: true,
      },
    });

    const lucroDia = vendasDia._sum.total || 0;
    const lucroMes = vendasMes._sum.total || 0;
    const lucroAno = vendasAno._sum.total || 0;
    const despesasTotal = despesasMes._sum.value || 0;
    const lucroLiquido = lucroMes - despesasTotal;

    // Contar clientes
    const clientesTotal = await prisma.customer.count();

    // Contar agendamentos de hoje
    const agendamentosHoje = await prisma.appointment.count({
      where: {
        date: {
          gte: hoje,
          lte: amanha,
        },
      },
    });

    // Contar atendimentos de hoje (agendamentos concluídos)
    const atendimentosHoje = await prisma.appointment.count({
      where: {
        date: {
          gte: hoje,
          lte: amanha,
        },
        status: 'CONCLUIDO',
      },
    });

    // Contar atendimentos do mês (agendamentos concluídos)
    const atendimentosMes = await prisma.appointment.count({
      where: {
        date: {
          gte: inicioMes,
          lte: fimMes,
        },
        status: 'CONCLUIDO',
      },
    });

    // Produtos com estoque baixo (menos de 5)
    const produtosEstoqueBaixo = await prisma.product.count({
      where: {
        stock: {
          lt: 5,
        },
      },
    });

    // Buscar aniversariantes do mês
    const mesAtual = hoje.getMonth() + 1; // getMonth() retorna 0-11, mas queremos 1-12
    
    const aniversariantesDoMes = await prisma.customer.findMany({
      where: {
        birthday: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        birthday: true,
        photo: true,
      },
    });

    // Filtrar aniversariantes do mês atual
    const aniversariantesFiltrados = aniversariantesDoMes.filter(customer => {
      if (!customer.birthday) return false;
      const birthdayMonth = new Date(customer.birthday).getMonth() + 1;
      return birthdayMonth === mesAtual;
    });

    // Próximos agendamentos (a partir de hoje)
    const proximosAgendamentos = await prisma.appointment.findMany({
      where: {
        date: {
          gte: hoje,
        },
        status: {
          in: ['agendado', 'confirmado'],
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            photo: true,
          },
        },
        service: {
          select: {
            name: true,
            price: true,
            duration: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
      take: 5,
    });

    // Vendas recentes (últimas 10 vendas)
    const vendasRecentes = await prisma.sale.findMany({
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            photo: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 10,
    });

    const stats = {
      lucroDia,
      lucroMes,
      lucroAno,
      despesasMes: despesasTotal,
      lucroLiquido,
      clientesTotal,
      agendamentosHoje,
      atendimentosHoje,
      atendimentosMes,
      produtosEstoqueBaixo,
    };

    console.log('Dashboard API - Dados retornados:', {
      stats,
      proximosAgendamentos: proximosAgendamentos.length,
      aniversariantes: aniversariantesFiltrados.length,
      vendasRecentes: vendasRecentes.length
    });

    return NextResponse.json({
      stats,
      proximosAgendamentos,
      aniversariantes: aniversariantesFiltrados,
      vendasRecentes,
    });
  } catch (error: any) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    );
  }
}
