'use client';

import { useState, useMemo, useCallback } from 'react';

export type MetodoPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO';

export interface Pagamento {
  id: string;
  metodo: MetodoPagamento;
  valor: number;
  parcelas?: number;
  valorRecebido?: number;
}

const MARGEM_ERRO = 0.01;

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function useVendaCompleta(totalVenda: number) {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  const resumo = useMemo(() => {
    const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
    const restante = totalVenda - totalPago;
    const contaFechada = Math.abs(restante) < MARGEM_ERRO;
    const totalDinheiroRecebido = pagamentos
      .filter((p) => p.metodo === 'DINHEIRO')
      .reduce((acc, p) => acc + (p.valorRecebido ?? p.valor), 0);
    const troco = totalDinheiroRecebido - pagamentos.filter((p) => p.metodo === 'DINHEIRO').reduce((acc, p) => acc + p.valor, 0);

    return { totalPago, restante, contaFechada, troco: Math.max(0, troco) };
  }, [pagamentos, totalVenda]);

  const adicionarPagamento = useCallback(
    (pagamento: Omit<Pagamento, 'id'>) => {
      let valorFinal = Math.max(0, pagamento.valor);

      if (pagamento.metodo !== 'DINHEIRO' && valorFinal > resumo.restante) {
        valorFinal = Math.max(0, resumo.restante);
      }

      const novo: Pagamento = {
        ...pagamento,
        id: generateId(),
        valor: valorFinal,
        parcelas: pagamento.metodo === 'CARTAO_CREDITO' ? (pagamento.parcelas ?? 1) : undefined,
      };

      setPagamentos((prev) => [...prev, novo]);
    },
    [resumo.restante]
  );

  const removerPagamento = useCallback((id: string) => {
    setPagamentos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const limparPagamentos = useCallback(() => {
    setPagamentos([]);
  }, []);

  const definirPagamentos = useCallback((lista: Pagamento[]) => {
    setPagamentos(lista);
  }, []);

  return {
    pagamentos,
    resumo,
    adicionarPagamento,
    removerPagamento,
    limparPagamentos,
    definirPagamentos,
  };
}
