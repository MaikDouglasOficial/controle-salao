import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth-api';
import { salePostSchema } from '@/lib/schemas';

// GET /api/sales?customerId=1&page=1&limit=50
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');

    const where = customerId ? { customerId: parseInt(customerId, 10) } : {};
    const page = pageStr ? Math.max(1, parseInt(pageStr, 10)) : null;
    const limit = limitStr ? Math.min(100, Math.max(1, parseInt(limitStr, 10))) : null;
    const skip = page != null && limit != null ? (page - 1) * limit : undefined;
    const take = limit ?? undefined;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      page != null && limit != null ? prisma.sale.count({ where }) : Promise.resolve(null),
    ]);

    if (total != null) {
      return NextResponse.json({ data: sales, total, page: page!, limit: limit! });
    }
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar vendas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const parsed = salePostSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg = Object.values(first).flat().find(Boolean) || parsed.error.message;
      return NextResponse.json({ error: String(msg) }, { status: 400 });
    }

    const { customerId, professional, paymentMethod, total, items, installments, installmentValue, appointmentId, entradaValue, entradaMethod, payments: paymentsArray } = parsed.data;
    const usePaymentsArray = Array.isArray(paymentsArray) && paymentsArray.length > 0;

    const sale = await prisma.$transaction(async (tx) => {
      const aptId = appointmentId ?? undefined;
      if (aptId) {
        const appointment = await tx.appointment.findUnique({
          where: { id: typeof aptId === 'number' ? aptId : parseInt(String(aptId), 10) },
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
        customerId: customerId != null && customerId !== '' ? Number(customerId) : null,
        appointmentId: aptId != null ? Number(aptId) : null,
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

      // Criar os itens da venda (com cálculo de comissão snapshot)
      for (const item of items) {
        let commissionAmount = 0;
        const quantity = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const itemTotal = price * quantity;

        if (item.serviceId) {
          const service = await tx.service.findUnique({
            where: { id: item.serviceId },
            select: { commissionType: true, commissionValue: true },
          });
          if (service && (service.commissionValue ?? 0) > 0) {
            const cv = Number(service.commissionValue);
            if (service.commissionType === 'FIXED') {
              commissionAmount = Math.round(cv * quantity * 100) / 100;
            } else {
              commissionAmount = Math.round((itemTotal * cv) / 100 * 100) / 100;
            }
          }
        } else if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { commissionType: true, commissionValue: true },
          });
          if (product && (product.commissionValue ?? 0) > 0) {
            const cv = Number(product.commissionValue);
            if (product.commissionType === 'FIXED') {
              commissionAmount = Math.round(cv * quantity * 100) / 100;
            } else {
              commissionAmount = Math.round((itemTotal * cv) / 100 * 100) / 100;
            }
          }
        }

        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId || null,
            serviceId: item.serviceId || null,
            quantity,
            price,
            commissionAmount,
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

      if (aptId) {
        await tx.appointment.update({
          where: { id: typeof aptId === 'number' ? aptId : parseInt(String(aptId), 10) },
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
