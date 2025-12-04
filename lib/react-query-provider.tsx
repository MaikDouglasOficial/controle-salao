'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache por 5 minutos
            staleTime: 1000 * 60 * 5,
            // Manter cache por 10 minutos
            gcTime: 1000 * 60 * 10,
            // Retry automático em caso de erro
            retry: 1,
            // Refetch ao focar na janela
            refetchOnWindowFocus: false,
            // Refetch ao reconectar
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry para mutações
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
