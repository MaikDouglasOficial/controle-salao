/**
 * Fetch que trata 401: redireciona para /login e exibe mensagem de sessão expirada.
 * Use em todas as chamadas às APIs protegidas do admin.
 */
export async function fetchAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) {
    const url = new URL('/login', typeof window !== 'undefined' ? window.location.origin : '');
    url.searchParams.set('expired', '1');
    if (typeof window !== 'undefined') {
      window.location.href = url.pathname + url.search;
    }
    throw new Error('Não autorizado');
  }
  return res;
}
