import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth-api';
import { getNextSku } from '@/lib/next-sku';

// GET /api/products
export async function GET() {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const products = await prisma.product.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const { name, description, price, stock, sku, photo, commissionType, commissionValue } = body;

    if (!name || price === undefined || stock === undefined) {
      return NextResponse.json(
        { error: 'Nome, preço e estoque são obrigatórios' },
        { status: 400 }
      );
    }

    const commType = commissionType === 'FIXED' ? 'FIXED' : 'PERCENT';
    const commValue = Number(commissionValue) >= 0 ? Number(commissionValue) : 0;

    const skuVal = sku && String(sku).trim() ? String(sku).trim() : null;
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
    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        stock: parseInt(stock),
        sku: skuVal,
        photo: photo || null,
        commissionType: commType,
        commissionValue: commValue,
      },
    });

    if (!product.sku) {
      const newSku = await getNextSku();
      const withSku = await prisma.product.update({
        where: { id: product.id },
        data: { sku: newSku },
      });
      return NextResponse.json(withSku, { status: 201 });
    }
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este código já está em uso. Use outro código ou deixe em branco para gerar automaticamente.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    );
  }
}

// PUT /api/products
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const { id, name, description, price, stock, sku, photo, commissionType, commissionValue } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }

    const commType = commissionType === 'FIXED' ? 'FIXED' : 'PERCENT';
    const commValue = Number(commissionValue) >= 0 ? Number(commissionValue) : 0;

    const skuVal = sku !== undefined ? (sku && String(sku).trim() ? String(sku).trim() : null) : undefined;
    if (skuVal !== undefined) {
      const [otherProduct, anyService] = await Promise.all([
        prisma.product.findFirst({ where: { sku: skuVal, id: { not: Number(id) } } }),
        prisma.service.findFirst({ where: { sku: skuVal } }),
      ]);
      if (otherProduct || anyService) {
        return NextResponse.json(
          { error: 'Este código já está em uso. Escolha outro código.' },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        stock: parseInt(stock),
        ...(skuVal !== undefined ? { sku: skuVal } : {}),
        photo: photo || null,
        commissionType: commType,
        commissionValue: commValue,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este código já está em uso. Escolha outro código.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
      { status: 500 }
    );
  }
}

// DELETE /api/products?id=123
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar produto' },
      { status: 500 }
    );
  }
}
