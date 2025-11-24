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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, professional, paymentMethod, total, items, installments, installmentValue } = body;

    // Validações
    if (!paymentMethod || !['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Método de pagamento inválido' },
        { status: 400 }
      );
    }

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

    // Validar parcelamento para cartão de crédito
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

    // Criar venda e itens em uma transação
    const sale = await prisma.$transaction(async (tx) => {
      // Criar a venda
      const newSale = await tx.sale.create({
        data: {
          customerId: customerId || null,
          professional,
          paymentMethod,
          total,
          installments: paymentMethod === 'CARTAO_CREDITO' ? installments : null,
          installmentValue: paymentMethod === 'CARTAO_CREDITO' ? installmentValue : null,
        } as any,
      });

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
