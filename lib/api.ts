/**
 * Fetch que trata 401 e 403: redireciona para /login.
 * 401 = não autenticado; 403 = autenticado mas sem permissão (ex.: cliente na área admin).
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
  if (res.status === 403) {
    const url = new URL('/login', typeof window !== 'undefined' ? window.location.origin : '');
    url.searchParams.set('forbidden', '1');
    if (typeof window !== 'undefined') {
      window.location.href = url.pathname + url.search;
    }
    throw new Error('Acesso restrito');
  }
  return res;
}

/**
 * Desempacota resposta de listagem: aceita tanto array direto quanto { data, total?, page?, limit? }.
 */
export function unwrapListResponse<T>(json: T[] | { data: T[]; total?: number; page?: number; limit?: number }): T[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === 'object' && 'data' in json && Array.isArray((json as { data: T[] }).data)) {
    return (json as { data: T[] }).data;
  }
  return [];
}
