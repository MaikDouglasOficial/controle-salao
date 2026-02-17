import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth-api';

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

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        stock: parseInt(stock),
        sku: sku || null,
        photo: photo || null,
        commissionType: commType,
        commissionValue: commValue,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'SKU já cadastrado' },
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

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        stock: parseInt(stock),
        sku: sku || null,
        photo: photo || null,
        commissionType: commType,
        commissionValue: commValue,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
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
