'use client';

/**
 * Retorna um handler para usar em onFocus de campos de busca.
 * No celular (viewport < 768px), ao focar no campo, rola a página para o topo
 * para o teclado virtual não cobrir o conteúdo.
 */
export function useScrollToTopOnFocus() {
  return () => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
}
