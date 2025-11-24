import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/customers - Listar todos os clientes
export async function GET() {
  try {

    const customers = await prisma.customer.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, cpf, birthday, notes, photo } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email: email || null,
        cpf: cpf || null,
        birthday: birthday ? new Date(birthday) : null,
        notes: notes || null,
        photo: photo || null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    
    if (error.code === 'P2002') {
      const field = error.meta?.target?.includes('phone') ? 'Telefone' : 'CPF';
      return NextResponse.json(
        { error: `${field} já cadastrado` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    );
  }
}

// PUT /api/customers - Atualizar cliente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, phone, email, cpf, birthday, notes, photo } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone,
        email: email || null,
        cpf: cpf || null,
        birthday: birthday ? new Date(birthday) : null,
        notes: notes || null,
        photo: photo || null,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar cliente' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers?id=123 - Deletar cliente
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar cliente' },
      { status: 500 }
    );
  }
}
