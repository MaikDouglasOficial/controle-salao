import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail, isEmailConfigured } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const type = body.type === 'client' ? 'client' : 'admin';

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    if (type === 'admin') {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ message: 'Se o e-mail existir, você receberá um link para redefinir a senha.' });
      }
    } else {
      const account = await prisma.customerAccount.findUnique({ where: { email } });
      const customerByEmail = await prisma.customer.findUnique({ where: { email } });
      if (!account && !customerByEmail) {
        return NextResponse.json({ message: 'Se o e-mail existir, você receberá um link para redefinir a senha.' });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({ where: { email, type } });
    await prisma.passwordResetToken.create({
      data: { email, token, type, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetPath = type === 'admin' ? '/login/redefinir-senha' : '/cliente/login/redefinir-senha';
    const resetLink = `${baseUrl}${resetPath}?token=${token}`;

    if (isEmailConfigured()) {
      const result = await sendPasswordResetEmail({ to: email, resetLink, type });
      if (!result.ok) {
        await prisma.passwordResetToken.deleteMany({ where: { token } });
        return NextResponse.json({ error: result.error || 'Falha ao enviar e-mail' }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: isEmailConfigured()
        ? 'Se o e-mail existir, você receberá um link para redefinir a senha.'
        : `E-mail não configurado. Use este link (válido por 1h): ${resetLink}`,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 });
  }
}
