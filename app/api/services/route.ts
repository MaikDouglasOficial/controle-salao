import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth-api';

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
    const { name, description, duration, price, commissionType, commissionValue } = body;

    if (!name || !duration || price === undefined) {
      return NextResponse.json(
        { error: 'Nome, duração e preço são obrigatórios' },
        { status: 400 }
      );
    }

    const commType = commissionType === 'FIXED' ? 'FIXED' : 'PERCENT';
    const commValue = Number(commissionValue) >= 0 ? Number(commissionValue) : 0;

    const service = await prisma.service.create({
      data: {
        name,
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        commissionType: commType,
        commissionValue: commValue,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
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
    const { id, name, description, duration, price, commissionType, commissionValue } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do serviço é obrigatório' },
        { status: 400 }
      );
    }

    const commType = commissionType === 'FIXED' ? 'FIXED' : 'PERCENT';
    const commValue = Number(commissionValue) >= 0 ? Number(commissionValue) : 0;

    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        commissionType: commType,
        commissionValue: commValue,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
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
