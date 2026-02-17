'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ClientSidebar } from '@/components/ClientSidebar';
import { LoadingSpinner } from '@/components/ui';

export default function ClienteContaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/cliente/login');
      return;
    }
    const role = (session.user as { role?: string }).role;
    if (role !== 'client') {
      router.replace('/cliente/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-[var(--bg-main)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session || (session.user as { role?: string }).role !== 'client') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      <ClientSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="pt-14 lg:pt-6">{children}</div>
      </main>
    </div>
  );
}
