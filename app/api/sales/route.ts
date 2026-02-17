import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    const where = customerId ? { customerId: parseInt(customerId) } : {};

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    return NextResponse.json({ error: 'Erro ao buscar vendas' }, { status: 500 });
  }
}

const PAYMENT_METHODS = ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, professional, paymentMethod, total, items, installments, installmentValue, appointmentId, entradaValue, entradaMethod, payments: paymentsArray } = body;

    if (!professional || professional.trim() === '') {
      return NextResponse.json(
        { error: 'Profissional é obrigatório' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'A venda deve ter pelo menos um item' },
        { status: 400 }
      );
    }

    const usePaymentsArray = Array.isArray(paymentsArray) && paymentsArray.length > 0;

    if (usePaymentsArray) {
      const sum = paymentsArray.reduce((acc: number, p: any) => acc + Number(p.value || 0), 0);
      if (Math.abs(sum - total) > 0.01) {
        return NextResponse.json(
          { error: `A soma dos pagamentos (R$ ${sum.toFixed(2)}) deve ser igual ao total (R$ ${total.toFixed(2)})` },
          { status: 400 }
        );
      }
      for (const p of paymentsArray) {
        if (!PAYMENT_METHODS.includes(p.paymentMethod)) {
          return NextResponse.json({ error: 'Método de pagamento inválido em um dos itens' }, { status: 400 });
        }
        if (!p.value || p.value <= 0) {
          return NextResponse.json({ error: 'Valor do pagamento deve ser maior que zero' }, { status: 400 });
        }
        if (p.paymentMethod === 'CARTAO_CREDITO') {
          const n = p.installments ?? 1;
          if (n < 1 || n > 12) {
            return NextResponse.json({ error: 'Parcelas do cartão de crédito devem ser entre 1 e 12' }, { status: 400 });
          }
        }
      }
    } else {
      if (!paymentMethod || !PAYMENT_METHODS.includes(paymentMethod)) {
        return NextResponse.json(
          { error: 'Método de pagamento inválido' },
          { status: 400 }
        );
      }
      if (paymentMethod === 'CARTAO_CREDITO') {
        if (!installments || installments < 1 || installments > 12) {
          return NextResponse.json(
            { error: 'Número de parcelas inválido (1-12)' },
            { status: 400 }
          );
        }
        if (!installmentValue || installmentValue <= 0) {
          return NextResponse.json(
            { error: 'Valor da parcela inválido' },
            { status: 400 }
          );
        }
      }
    }

    // Criar venda e itens em uma transação
    const sale = await prisma.$transaction(async (tx) => {
      if (appointmentId) {
        const appointment = await tx.appointment.findUnique({
          where: { id: parseInt(appointmentId) },
          select: { id: true, status: true },
        });

        if (!appointment) {
          throw new Error('Agendamento não encontrado');
        }

        if (appointment.status === 'faturado') {
          throw new Error('Este agendamento já foi faturado');
        }

        if (appointment.status !== 'concluido') {
          throw new Error('O agendamento precisa estar concluído para faturar');
        }
      }

      const firstPayment = usePaymentsArray ? paymentsArray[0] : { paymentMethod, installments, installmentValue };
      const primaryMethod = firstPayment.paymentMethod;
      const hasEntrada = !usePaymentsArray && entradaValue != null && Number(entradaValue) > 0;
      const validEntradaMethods = ['DINHEIRO', 'PIX', 'CARTAO_DEBITO'];

      const saleCreateData = {
        customerId: customerId ? parseInt(String(customerId)) : null,
        appointmentId: appointmentId ? parseInt(String(appointmentId)) : null,
        professional,
        paymentMethod: primaryMethod,
        total: Number(total),
        installments: primaryMethod === 'CARTAO_CREDITO' ? (firstPayment.installments ?? 1) : null,
        installmentValue: primaryMethod === 'CARTAO_CREDITO' ? (firstPayment.installmentValue ?? total / (firstPayment.installments || 1)) : null,
        entradaValue: !usePaymentsArray && hasEntrada ? Number(entradaValue) : null,
        entradaMethod: !usePaymentsArray && hasEntrada && validEntradaMethods.includes(entradaMethod) ? entradaMethod : null,
      };

      const newSale = await tx.sale.create({
        data: saleCreateData,
      });

      if (usePaymentsArray) {
        for (const p of paymentsArray) {
          await tx.salePayment.create({
            data: {
              saleId: newSale.id,
              paymentMethod: p.paymentMethod,
              value: Number(p.value),
              installments: p.paymentMethod === 'CARTAO_CREDITO' ? (p.installments ?? 1) : null,
              installmentValue: p.paymentMethod === 'CARTAO_CREDITO' ? (Number(p.value) / (p.installments || 1)) : null,
            },
          });
        }
      }

      // Criar os itens da venda
      for (const item of items) {
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId || null,
            serviceId: item.serviceId || null,
            quantity: item.quantity,
            price: item.price,
          },
        });

        // Atualizar estoque se for produto
        if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Produto ${item.productId} não encontrado`);
          }

          if (product.stock < item.quantity) {
            throw new Error(
              `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}, Solicitado: ${item.quantity}`
            );
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      if (appointmentId) {
        await tx.appointment.update({
          where: { id: parseInt(appointmentId) },
          data: { status: 'faturado' },
        });
      }

      return newSale;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar venda:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar venda' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Aceitar ID tanto do body quanto da query string
    let id: string | null = null;
    
    // Tentar pegar do body primeiro
    try {
      const body = await request.json();
      id = body.id?.toString();
    } catch {
      // Se falhar, tentar pegar da query string
      const { searchParams } = new URL(request.url);
      id = searchParams.get('id');
    }

    // Se ainda não tiver ID, tentar da query string
    if (!id) {
      const { searchParams } = new URL(request.url);
      id = searchParams.get('id');
    }

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    // Deletar venda e seus itens (cascade)
    await prisma.sale.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Venda deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar venda:', error);
    return NextResponse.json({ error: 'Erro ao deletar venda' }, { status: 500 });
  }
}
