import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireClientSession } from '@/lib/auth-api';

/** GET - Lista vendas (compras) do cliente logado. */
export async function GET() {
  const auth = await requireClientSession();
  if ('error' in auth) return auth.error;

  const sales = await prisma.sale.findMany({
    where: { customerId: auth.customerId },
    orderBy: { date: 'desc' },
    include: {
      items: {
        include: {
          product: { select: { name: true } },
          service: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(
    sales.map((s) => ({
      id: s.id,
      date: s.date.toISOString(),
      total: s.total,
      paymentMethod: s.paymentMethod,
      professional: s.professional,
      items: s.items.map((i) => ({
        name: i.product?.name ?? i.service?.name ?? 'Item',
        quantity: i.quantity,
        price: i.price,
      })),
    }))
  );
}
