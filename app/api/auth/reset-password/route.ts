import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token e nova senha são obrigatórios' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Link inválido ou expirado. Solicite uma nova recuperação de senha.' }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    if (record.type === 'admin') {
      await prisma.user.update({
        where: { email: record.email },
        data: { password: hash },
      });
    } else {
      await prisma.customerAccount.update({
        where: { email: record.email },
        data: { passwordHash: hash },
      });
    }

    await prisma.passwordResetToken.delete({ where: { id: record.id } });

    return NextResponse.json({
      message: 'Senha alterada com sucesso.',
      type: record.type,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao redefinir senha' }, { status: 500 });
  }
}
