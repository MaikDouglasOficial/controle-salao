import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth-api';
import { getNextSku } from '@/lib/next-sku';

// GET /api/services
export async function GET() {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const services = await prisma.service.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar serviços' },
      { status: 500 }
    );
  }
}

// POST /api/services
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const { name, description, duration, price, commissionType, commissionValue, sku: skuBody, photo } = body;

    if (!name || !duration || price === undefined) {
      return NextResponse.json(
        { error: 'Nome, duração e preço são obrigatórios' },
        { status: 400 }
      );
    }

    const commType = commissionType === 'FIXED' ? 'FIXED' : 'PERCENT';
    const commValue = Number(commissionValue) >= 0 ? Number(commissionValue) : 0;

    const skuVal = skuBody && String(skuBody).trim() ? String(skuBody).trim() : null;
    if (skuVal) {
      const [existingProduct, existingService] = await Promise.all([
        prisma.product.findFirst({ where: { sku: skuVal } }),
        prisma.service.findFirst({ where: { sku: skuVal } }),
      ]);
      if (existingProduct || existingService) {
        return NextResponse.json(
          { error: 'Este código já está em uso. Use outro código ou deixe em branco para gerar automaticamente.' },
          { status: 400 }
        );
      }
    }

    const service = await prisma.service.create({
      data: {
        name,
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        sku: skuVal,
        photo: photo && String(photo).trim() ? String(photo).trim() : null,
        commissionType: commType,
        commissionValue: commValue,
      },
    });

    if (!service.sku) {
      const newSku = await getNextSku();
      const withSku = await prisma.service.update({
        where: { id: service.id },
        data: { sku: newSku },
      });
      return NextResponse.json(withSku, { status: 201 });
    }
    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este código já está em uso. Use outro código ou deixe em branco para gerar automaticamente.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro ao criar serviço' },
      { status: 500 }
    );
  }
}

// PUT /api/services
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const { id, name, description, duration, price, commissionType, commissionValue, sku, photo } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do serviço é obrigatório' },
        { status: 400 }
      );
    }

    const commType = commissionType === 'FIXED' ? 'FIXED' : 'PERCENT';
    const commValue = Number(commissionValue) >= 0 ? Number(commissionValue) : 0;

    const skuVal = sku !== undefined ? (sku && String(sku).trim() ? String(sku).trim() : null) : undefined;
    if (skuVal !== undefined) {
      const [anyProduct, otherService] = await Promise.all([
        prisma.product.findFirst({ where: { sku: skuVal } }),
        prisma.service.findFirst({ where: { sku: skuVal, id: { not: Number(id) } } }),
      ]);
      if (anyProduct || otherService) {
        return NextResponse.json(
          { error: 'Este código já está em uso. Escolha outro código.' },
          { status: 400 }
        );
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        commissionType: commType,
        commissionValue: commValue,
        ...(skuVal !== undefined ? { sku: skuVal } : {}),
        ...(photo !== undefined ? { photo: photo && String(photo).trim() ? String(photo).trim() : null } : {}),
      },
    });

    return NextResponse.json(service);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este código já está em uso. Escolha outro código.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar serviço' },
      { status: 500 }
    );
  }
}

// DELETE /api/services?id=123
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do serviço é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.service.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar serviço' },
      { status: 500 }
    );
  }
}
