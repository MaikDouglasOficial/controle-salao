import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook de debounce para otimizar chamadas de API
 * Aguarda um tempo após a última chamada antes de executar
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

/**
 * Hook de throttle para limitar frequência de chamadas
 * Executa no máximo uma vez a cada intervalo
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 500
): T {
  const inThrottle = useRef(false);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    }) as T,
    [callback, limit]
  );
}

/**
 * Hook para detectar quando um elemento está visível na viewport
 * Útil para lazy loading e infinite scroll
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Hook para prefetch de rotas
 * Carrega rotas em background para navegação mais rápida
 */
export function usePrefetchRoute(router: any, routes: string[]) {
  useEffect(() => {
    // Aguarda 2 segundos após o carregamento inicial
    const timeout = setTimeout(() => {
      routes.forEach(route => {
        router.prefetch(route);
      });
    }, 2000);

    return () => clearTimeout(timeout);
  }, [router, routes]);
}

/**
 * Hook para otimizar busca com debounce
 */
export function useOptimizedSearch<T>(
  fetchFn: (query: string) => Promise<T>,
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedFetch = useDebounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchFn(searchQuery);
      setResults(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, delay);

  useEffect(() => {
    debouncedFetch(query);
  }, [query, debouncedFetch]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
  };
}

/**
 * Hook para cache local de dados (localStorage)
 * Útil para reduzir chamadas à API
 */
export function useLocalCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 1000 * 60 * 5 // 5 minutos padrão
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Tentar carregar do cache
        const cached = localStorage.getItem(key);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          const isExpired = Date.now() - timestamp > ttl;

          if (!isExpired) {
            setData(cachedData);
            setLoading(false);
            return;
          }
        }

        // Buscar dados novos
        const freshData = await fetchFn();
        
        // Salvar no cache
        localStorage.setItem(
          key,
          JSON.stringify({
            data: freshData,
            timestamp: Date.now(),
          })
        );

        setData(freshData);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key, ttl]);

  const invalidateCache = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return { data, loading, invalidateCache };
}

import { useState } from 'react';
