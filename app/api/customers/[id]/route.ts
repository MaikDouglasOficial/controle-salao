import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth-api';

// GET /api/customers/[id] - Buscar cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const customer = await prisma.customer.findUnique({
      where: {
        id: parseInt(params.id),
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cliente' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Excluir cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) return auth.error;

    const customerId = parseInt(params.id);

    // Verificar se o cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Excluir o cliente (cascata vai remover agendamentos e vendas)
    await prisma.customer.delete({
      where: { id: customerId },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Cliente excluído com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir cliente' },
      { status: 500 }
    );
  }
}
