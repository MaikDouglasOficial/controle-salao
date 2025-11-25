import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

// Endpoint para criar usuário admin inicial
// ATENÇÃO: Desabilite ou remova este endpoint após usar!
export async function POST(request: Request) {
  try {
    // Verificar se já existe um usuário admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@salao.com' },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Usuário admin já existe!' },
        { status: 200 }
      );
    }

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@salao.com',
        password: hashedPassword,
        role: 'admin',
      },
    });

    return NextResponse.json({
      message: 'Usuário admin criado com sucesso!',
      user: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error('Erro ao criar admin:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário admin', details: error.message },
      { status: 500 }
    );
  }
}

// GET para verificar se admin existe
export async function GET() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@salao.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (admin) {
      return NextResponse.json({
        exists: true,
        user: admin,
      });
    }

    return NextResponse.json({
      exists: false,
      message: 'Usuário admin não encontrado. Use POST /api/setup para criar.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao verificar admin', details: error.message },
      { status: 500 }
    );
  }
}
