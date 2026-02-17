import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

export const authOptions = {
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            id: 'google-admin',
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            name: 'Google (Admin)',
          }),
          GoogleProvider({
            id: 'google-client',
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            name: 'Google (Cliente)',
          }),
        ]
      : []),
    CredentialsProvider({
      id: 'admin',
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials: any): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) throw new Error('Credenciais inválidas');
        const ok = await bcrypt.compare(credentials.password as string, user.password);
        if (!ok) throw new Error('Credenciais inválidas');
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: 'admin',
        };
      },
    }),
    CredentialsProvider({
      id: 'client',
      name: 'Cliente',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials: any): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }
        const account = await prisma.customerAccount.findUnique({
          where: { email: (credentials.email as string).trim().toLowerCase() },
          include: { customer: true },
        });
        if (!account) throw new Error('Email ou senha incorretos');
        const ok = await bcrypt.compare(credentials.password as string, account.passwordHash);
        if (!ok) throw new Error('Email ou senha incorretos');
        return {
          id: account.customer.id.toString(),
          email: account.email,
          name: account.customer.name,
          role: 'client',
          customerId: account.customer.id,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      const email = (profile?.email ?? user?.email)?.toString()?.trim()?.toLowerCase();
      if (!email) return false;
      if (account?.provider === 'google-admin') {
        const u = await prisma.user.findUnique({ where: { email } });
        return !!u;
      }
      if (account?.provider === 'google-client') {
        const acc = await prisma.customerAccount.findUnique({ where: { email } });
        return !!acc;
      }
      return true;
    },
    async jwt({ token, user, account }: any) {
      const email = (user?.email ?? token?.email)?.toString()?.trim()?.toLowerCase();
      if (account?.provider === 'google-admin' && email) {
        const u = await prisma.user.findUnique({ where: { email } });
        if (u) {
          token.role = 'admin';
          token.id = String(u.id);
          token.customerId = undefined;
        }
        return token;
      }
      if (account?.provider === 'google-client' && email) {
        const acc = await prisma.customerAccount.findUnique({
          where: { email },
          include: { customer: true },
        });
        if (acc) {
          token.role = 'client';
          token.id = String(acc.customer.id);
          token.customerId = acc.customer.id;
        }
        return token;
      }
      if (user) {
        token.role = user.role;
        token.id = user.id;
        if (user.customerId != null) token.customerId = user.customerId;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        if (token.customerId != null) session.user.customerId = token.customerId as number;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
