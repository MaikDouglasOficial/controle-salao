import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/expenses
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const expenses = await prisma.expense.findMany({
      orderBy: {
        date: 'desc',
      },
    });

    // Mapear campos para o formato esperado pelo frontend
    const mappedExpenses = expenses.map(expense => ({
      id: expense.id,
      description: expense.name,
      amount: expense.value,
      category: expense.category,
      date: expense.date,
      notes: expense.notes,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    }));

    return NextResponse.json(mappedExpenses);
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar despesas' },
      { status: 500 }
    );
  }
}

// POST /api/expenses
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Body recebido:', body);
    
    // Aceitar tanto name/value quanto description/amount
    const name = body.name || body.description;
    const value = body.value || body.amount;
    const category = body.category;
    const type = body.type || 'VARIAVEL';
    const date = body.date;
    const notes = body.notes;

    console.log('Valores processados:', { name, value, category, type, date, notes });

    if (!name || !category || value === undefined || value === null || value === '' || !date) {
      console.error('Validação falhou:', { name, category, value, date });
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando: descrição, categoria, valor e data são obrigatórios' },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        name,
        category,
        value: parseFloat(value.toString()),
        type,
        date: new Date(date),
        notes: notes || null,
      },
    });

    console.log('Despesa criada:', expense);
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar despesa:', error);
    return NextResponse.json(
      { error: 'Erro ao criar despesa: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/expenses
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    // Aceitar tanto name/value quanto description/amount
    const name = body.name || body.description;
    const value = body.value || body.amount;
    const { id, category, type, date, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da despesa é obrigatório' },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        name,
        category,
        value: parseFloat(value),
        type: type || 'VARIAVEL',
        date: new Date(date),
        notes: notes || null,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar despesa' },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Aceitar ID tanto da query string quanto do body
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    
    if (!id) {
      const body = await request.json();
      id = body.id?.toString();
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID da despesa é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.expense.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar despesa' },
      { status: 500 }
    );
  }
}
