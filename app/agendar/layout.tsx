'use client';

import { useSession } from 'next-auth/react';
import { ClientSidebar } from '@/components/ClientSidebar';

export default function AgendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const isClient = status === 'authenticated' && (session?.user as { role?: string })?.role === 'client';

  if (status === 'loading') {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-[var(--bg-main)]">
        <div className="loading-spinner w-10 h-10" />
      </div>
    );
  }

  if (isClient) {
    return (
      <div className="flex min-h-screen bg-[var(--bg-main)]">
        <ClientSidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="pt-14 lg:pt-6">{children}</div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
