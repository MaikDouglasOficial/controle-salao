import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth-api';

// GET - Listar todos os profissionais
export async function GET() {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const professionals = await prisma.professional.findMany({
      orderBy: { name: 'asc' },
      include: { services: { select: { id: true } } },
    });
    return NextResponse.json(
      professionals.map((p) => ({ ...p, serviceIds: p.services.map((s) => s.id) }))
    );
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar profissionais' },
      { status: 500 }
    );
  }
}

// POST - Criar novo profissional
export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const { name, phone, email, specialty, active, photo, commissionPercentage, serviceIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const serviceIdsArr = Array.isArray(serviceIds) ? serviceIds.filter((id: unknown) => Number.isInteger(Number(id)) && Number(id) > 0).map(Number) : [];

    const professional = await prisma.professional.create({
      data: {
        name,
        phone,
        email,
        specialty,
        commissionPercentage: commissionPercentage ?? 0,
        active: active ?? true,
        photo: photo || null,
        services: serviceIdsArr.length > 0 ? { connect: serviceIdsArr.map((id: number) => ({ id })) } : undefined,
      },
    });

    return NextResponse.json(professional, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar profissional:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe um profissional com este nome' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar profissional' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar profissional
export async function PUT(request: Request) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const { id, name, phone, email, specialty, active, photo, commissionPercentage, serviceIds } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const serviceIdsArr = Array.isArray(serviceIds) ? serviceIds.filter((id: unknown) => Number.isInteger(Number(id)) && Number(id) > 0).map(Number) : [];

    const professional = await prisma.professional.update({
      where: { id },
      data: {
        name,
        phone,
        email,
        specialty,
        commissionPercentage: commissionPercentage ?? 0,
        active,
        photo: photo || null,
        services: { set: serviceIdsArr.map((id: number) => ({ id })) },
      },
    });

    return NextResponse.json(professional);
  } catch (error: any) {
    console.error('Erro ao atualizar profissional:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe um profissional com este nome' },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar profissional' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar profissional
export async function DELETE(request: Request) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.professional.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Profissional deletado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao deletar profissional:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao deletar profissional' },
      { status: 500 }
    );
  }
}
