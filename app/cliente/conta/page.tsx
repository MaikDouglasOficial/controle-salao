'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AppointmentItem {
  id: number;
  date: string;
  status: string;
  professional: string | null;
  service: { name: string; price: number };
}

export default function ClienteContaPage() {
  const { data: session } = useSession();
  const [upcoming, setUpcoming] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cliente/agendamentos')
      .then((r) => r.json())
      .then((data) => {
        setUpcoming(data?.upcoming ?? []);
      })
      .catch(() => setUpcoming([]))
      .finally(() => setLoading(false));
  }, []);

  const name = session?.user?.name ?? 'Cliente';

  return (
    <div className="page-container space-y-6 mt-6">
      <div className="page-header">
        <h1 className="page-title">Olá, {name}!</h1>
        <p className="page-subtitle">
          Aqui você vê seus agendamentos e histórico de compras.
        </p>
      </div>

      <div className="card card-body">
        <h3 className="card-title flex items-center gap-2 mb-4">
          <CalendarDays className="h-5 w-5 text-[var(--brand-primary)]" />
          Próximos agendamentos
        </h3>
        {loading ? (
          <p className="text-stone-500 text-sm">Carregando...</p>
        ) : upcoming.length === 0 ? (
          <p className="text-stone-500 text-sm">Nenhum agendamento futuro.</p>
        ) : (
          <ul className="space-y-3">
            {upcoming.slice(0, 5).map((a) => {
              const d = new Date(a.date);
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-stone-900">{a.service.name}</p>
                    <p className="text-sm text-stone-500">
                      {d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })} às{' '}
                      {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {a.professional && ` · ${a.professional}`}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      a.status === 'confirmado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : a.status === 'agendado'
                        ? 'bg-amber-100 text-amber-800'
                        : a.status === 'concluido'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {a.status === 'agendado' ? 'Agendado' : a.status === 'confirmado' ? 'Confirmado' : a.status === 'concluido' ? 'Concluído' : a.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-row flex-wrap gap-3 justify-end">
        <Link href="/cliente/conta/agendamentos">
          <Button type="button" variant="secondary" size="lg">
            Ver todos os agendamentos
          </Button>
        </Link>
        <Link href="/agendar">
          <Button type="button" variant="primary" size="lg" icon={Calendar}>
            Novo agendamento
          </Button>
        </Link>
      </div>
    </div>
  );
}
