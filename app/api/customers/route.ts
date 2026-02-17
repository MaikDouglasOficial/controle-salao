import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth-api';
import { customerPostSchema, customerPutSchema } from '@/lib/schemas';

// GET /api/customers?page=1&limit=50
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');

    const page = pageStr ? Math.max(1, parseInt(pageStr, 10)) : null;
    const limit = limitStr ? Math.min(100, Math.max(1, parseInt(limitStr, 10))) : null;
    const skip = page != null && limit != null ? (page - 1) * limit : undefined;
    const take = limit ?? undefined;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      page != null && limit != null ? prisma.customer.count() : Promise.resolve(null),
    ]);

    if (total != null) {
      return NextResponse.json({ data: customers, total, page: page!, limit: limit! });
    }
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const parsed = customerPostSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg = Object.values(first).flat().find(Boolean) || parsed.error.message;
      return NextResponse.json({ error: String(msg) }, { status: 400 });
    }

    const { name, phone, email, cpf, birthday, notes, photo } = parsed.data;

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email: email ?? null,
        cpf: cpf ?? null,
        birthday,
        notes: notes ?? null,
        photo: photo ?? null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] } };
    if (err.code === 'P2002') {
      const field = err.meta?.target?.includes('phone') ? 'Telefone' : 'CPF';
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
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const parsed = customerPutSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg = Object.values(first).flat().find(Boolean) || parsed.error.message;
      return NextResponse.json({ error: String(msg) }, { status: 400 });
    }

    const { id, name, phone, email, cpf, birthday, notes, photo } = parsed.data;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone,
        email: email ?? null,
        cpf: cpf ?? null,
        birthday,
        notes: notes ?? null,
        photo: photo ?? null,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar cliente' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers?id=123 - Deletar cliente
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar cliente' },
      { status: 500 }
    );
  }
}
