'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';

interface SaleItem {
  name: string;
  quantity: number;
  price: number;
}

interface Sale {
  id: number;
  date: string;
  total: number;
  paymentMethod: string;
  professional: string | null;
  items: SaleItem[];
}

const paymentLabels: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'Pix',
  CARTAO_DEBITO: 'Cartão de débito',
  CARTAO_CREDITO: 'Cartão de crédito',
};

export default function ClienteComprasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cliente/compras')
      .then((r) => r.json())
      .then(setSales)
      .catch(() => setSales([]))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loading-spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 mt-6">
      <div className="page-header">
        <h1 className="page-title flex items-center justify-center gap-2">
          <ShoppingBag className="h-6 w-6 text-[var(--brand-primary)]" />
          Minhas compras
        </h1>
        <p className="page-subtitle">Histórico de compras no salão</p>
      </div>
      {sales.length === 0 ? (
        <p className="text-[var(--text-muted)]">Nenhuma compra registrada.</p>
      ) : (
        <ul className="space-y-4">
          {sales.map((s) => {
            const d = new Date(s.date);
            return (
              <li key={s.id} className="card p-4">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-stone-900">
                    {d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}
                    {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="font-semibold text-stone-900">{formatCurrency(s.total)}</p>
                </div>
                <p className="text-sm text-stone-500 mt-1">
                  {paymentLabels[s.paymentMethod] ?? s.paymentMethod}
                  {s.professional && ` · ${s.professional}`}
                </p>
                <ul className="mt-3 text-sm text-stone-600 space-y-1">
                  {s.items.map((i, idx) => (
                    <li key={idx}>
                      {i.quantity}x {i.name} – {formatCurrency(i.price * i.quantity)}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
