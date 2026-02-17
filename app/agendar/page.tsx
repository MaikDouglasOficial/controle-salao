'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const STEPS = ['Seus dados', 'Serviço', 'Data', 'Horário', 'Confirmar'];
const STEPS_LOGGED = ['Serviço', 'Data', 'Horário', 'Confirmar'];

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  description?: string | null;
}

export default function AgendarPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isLoggedIn =
    session?.user &&
    (session.user as { role?: string }).role === 'client' &&
    (session.user as { customerId?: number }).customerId != null;

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<string[]>([]);
  const [busySlots, setBusySlots] = useState<{ start: string; end: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ service: string; date: string; time: string; professional?: string } | null>(null);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [notes, setNotes] = useState('');

  const todayLocal = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const todayStart = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/booking/services').then((r) => r.json()),
      fetch('/api/booking/professionals').then((r) => r.json()),
    ])
      .then(([svc, prof]) => {
        setServices(Array.isArray(svc) ? svc : []);
        setProfessionals(Array.isArray(prof) ? prof : []);
      })
      .catch(() => setError('Não foi possível carregar os dados.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (sessionStatus !== 'loading' && isLoggedIn && step === 1) setStep(2);
  }, [sessionStatus, isLoggedIn, step]);

  useEffect(() => {
    if (!selectedDate) return;
    const [y, m] = selectedDate.split('-').map(Number);
    setViewMonth((prev) =>
      prev.year === y && prev.month === m - 1 ? prev : { year: y, month: m - 1 }
    );
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate) {
      setBusySlots([]);
      return;
    }
    const url = selectedProfessional
      ? `/api/booking/slots?professional=${encodeURIComponent(selectedProfessional)}&date=${selectedDate}`
      : `/api/booking/slots?date=${selectedDate}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setBusySlots(Array.isArray(data) ? data : []))
      .catch(() => setBusySlots([]));
  }, [selectedProfessional, selectedDate]);

  const calendarGrid = useMemo(() => {
    const { year, month } = viewMonth;
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { day: number | null }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
    const total = Math.ceil(cells.length / 7) * 7;
    while (cells.length < total) cells.push({ day: null });
    const rows: { day: number | null }[][] = [];
    for (let r = 0; r < cells.length / 7; r++) rows.push(cells.slice(r * 7, (r + 1) * 7));
    return { rows, year, month };
  }, [viewMonth]);

  const isDayPast = (year: number, month: number, day: number) =>
    new Date(year, month, day).getTime() < todayStart;

  const timeOptions = useMemo(() => {
    const opts: string[] = [];
    for (let h = 8; h <= 20; h++) {
      opts.push(`${String(h).padStart(2, '0')}:00`);
      if (h < 20) opts.push(`${String(h).padStart(2, '0')}:30`);
    }
    return opts;
  }, []);

  const durationMinutes = selectedService?.duration ?? 30;
  const isTimeBlocked = (timeStr: string): boolean => {
    if (busySlots.length === 0) return false;
    const slotStart = new Date(selectedDate + 'T' + timeStr + ':00').getTime();
    const slotEnd = slotStart + durationMinutes * 60 * 1000;
    return busySlots.some((s) => {
      const start = new Date(s.start).getTime();
      const end = new Date(s.end).getTime();
      return slotStart < end && slotEnd > start;
    });
  };
  const isTimeInPast = (timeStr: string): boolean => {
    if (selectedDate !== todayLocal) return false;
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
  };
  const visibleTimeOptions = useMemo(() => {
    if (selectedDate !== todayLocal) return timeOptions;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return timeOptions.filter((t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m > nowMin;
    });
  }, [selectedDate, todayLocal, timeOptions]);

  const checkPhone = () => {
    setError('');
    const raw = phone.replace(/\D/g, '');
    if (raw.length < 8) {
      setError('Informe um telefone válido.');
      return;
    }
    fetch('/api/booking/customer?phone=' + encodeURIComponent(raw))
      .then((r) => {
        if (r.ok) return r.json();
        return { name: null };
      })
      .then((data) => {
        if (data?.name) setCustomerName(data.name);
        else setCustomerName(null);
        setStep(2);
      })
      .catch(() => {
        setCustomerName(null);
        setStep(2);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const dateIso = selectedDate && selectedTime ? `${selectedDate}T${selectedTime}:00` : '';
    if (!dateIso || !selectedService) {
      setError('Preencha todos os campos.');
      setSubmitting(false);
      return;
    }
    try {
      const url = isLoggedIn ? '/api/cliente/agendamentos' : '/api/booking';
      const body = isLoggedIn
        ? {
            serviceId: selectedService.id,
            date: dateIso,
            professional: selectedProfessional || undefined,
            notes: notes.trim() || undefined,
          }
        : {
            phone: phone.replace(/\D/g, ''),
            name: name.trim() || undefined,
            serviceId: selectedService.id,
            date: dateIso,
            professional: selectedProfessional || undefined,
            notes: notes.trim() || undefined,
          };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Erro ao agendar. Tente novamente.');
        setSubmitting(false);
        return;
      }
      const d = new Date(dateIso);
      setSuccess({
        service: selectedService.name,
        date: d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
        time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        professional: selectedProfessional || undefined,
      });
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (success) {
    return (
      <div className="min-h-[100svh] bg-[var(--bg-main)] py-12 px-4">
        <div className="page-container max-w-md mx-auto mt-6">
          <div className="page-header">
            <h1 className="page-title">Agendamento confirmado!</h1>
            <p className="page-subtitle">Seu horário foi reservado com sucesso</p>
          </div>
          <div className="card p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <p className="text-[var(--text-muted)] mb-6">
              <strong className="text-[var(--text-main)]">{success.service}</strong><br />
              {success.date} às {success.time}
              {success.professional && <><br />Com {success.professional}</>}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Você pode receber um lembrete por WhatsApp antes do horário. Em caso de dúvidas, entre em contato com o salão.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[100svh] bg-[var(--bg-main)] flex items-center justify-center">
        <div className="loading-spinner w-10 h-10" />
      </div>
    );
  }

  return (
    <div className={isLoggedIn ? '' : 'min-h-[100svh] bg-[var(--bg-main)] pt-6 pb-8 px-4'}>
      <div className={`page-container max-w-lg mx-auto ${isLoggedIn ? 'space-y-6 mt-6' : ''}`}>
        <div className="page-header">
          <h1 className="page-title">Agendar horário</h1>
          <p className="page-subtitle">Escolha o serviço, data e horário nos passos abaixo</p>
        </div>
        <div className="card p-6 sm:p-8">
        <div className="flex justify-between mb-8 gap-1">
          {(isLoggedIn ? STEPS_LOGGED : STEPS).map((label, i) => {
            const stepIndex = isLoggedIn ? i + 2 : i + 1;
            const isActive = step === stepIndex;
            const isPast = step > stepIndex;
            return (
              <div
                key={label}
                className={`flex-1 text-center text-xs font-medium ${
                  isActive ? 'text-[var(--brand-primary)]' : isPast ? 'text-emerald-600' : 'text-[var(--text-muted)]'
                }`}
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </div>
            );
          })}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (step === 1 && !isLoggedIn) checkPhone(); else if (step === 5) handleSubmit(e); else setStep(step + 1); }}>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          {step === 1 && !isLoggedIn && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Telefone (WhatsApp) *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="(63) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Se for sua primeira vez, informe seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-row gap-3 justify-end">
                <Button type="submit" variant="primary">Continuar</Button>
              </div>
            </div>
          )}

          {(step === 2 || (isLoggedIn && step === 1)) && (
            <div className="space-y-4">
              {isLoggedIn && session?.user?.name && (
                <p className="text-sm text-stone-600">Olá, <strong>{session.user.name}</strong>!</p>
              )}
              {!isLoggedIn && customerName && (
                <p className="text-sm text-stone-600">Olá, <strong>{customerName}</strong>!</p>
              )}
              <label className="block text-sm font-medium text-stone-700 mb-2">Escolha o serviço *</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedService(s)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                      selectedService?.id === s.id
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--text-main)]'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-stone-500 text-sm block mt-0.5">
                      {s.duration} min · {formatCurrency(s.price)}
                    </span>
                  </button>
                ))}
              </div>
              {services.length === 0 && (
                <p className="text-stone-500 text-sm">Nenhum serviço disponível no momento.</p>
              )}
              <div className="flex flex-row gap-3 justify-end">
                {!isLoggedIn && <Button type="button" variant="secondary" onClick={() => setStep(1)}>Voltar</Button>}
                <Button type="submit" variant="primary" disabled={!selectedService}>Continuar</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">Escolha a data *</label>
              <div className="border border-stone-300 rounded-xl overflow-hidden bg-white">
                <div className="flex items-center justify-between px-2 py-2 bg-stone-50 border-b">
                  <button
                    type="button"
                    onClick={() =>
                      setViewMonth((v) =>
                        v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }
                      )
                    }
                    className="p-1 rounded hover:bg-stone-200"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-semibold capitalize">
                    {new Date(calendarGrid.year, calendarGrid.month, 1).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setViewMonth((v) =>
                        v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }
                      )
                    }
                    className="p-1 rounded hover:bg-stone-200"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-2">
                  <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-stone-500 mb-1">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((w) => (
                      <div key={w}>{w}</div>
                    ))}
                  </div>
                  {calendarGrid.rows.map((row, ri) => (
                    <div key={ri} className="grid grid-cols-7 gap-0.5">
                    {row.map((cell, ci) => {
                      if (cell.day === null) return <div key={ci} className="aspect-square" />;
                      const past = isDayPast(calendarGrid.year, calendarGrid.month, cell.day);
                      const dateStr = `${calendarGrid.year}-${String(calendarGrid.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                      const selected = selectedDate === dateStr;
                      return (
                        <button
                          key={ci}
                          type="button"
                          disabled={past}
                          onClick={() => !past && setSelectedDate(dateStr)}
                          className={`aspect-square rounded text-sm ${
                            past ? 'text-stone-300 cursor-not-allowed' : 'hover:bg-[var(--brand-soft)]'
                          } ${selected ? 'bg-[var(--brand-primary)] text-white font-semibold' : ''}`}
                        >
                          {cell.day}
                        </button>
                      );
                    })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-row gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>Voltar</Button>
                <Button type="submit" variant="primary" disabled={!selectedDate}>Continuar</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Profissional (opcional)</label>
                <select
                  className="form-input"
                  value={selectedProfessional}
                  onChange={(e) => setSelectedProfessional(e.target.value)}
                >
                  <option value="">Qualquer disponível</option>
                  {professionals.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Horário *</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {visibleTimeOptions.map((t) => {
                    const blocked = isTimeBlocked(t);
                    const past = isTimeInPast(t);
                    const disabled = past || blocked;
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && setSelectedTime(t)}
                        className={`py-2 rounded-lg text-sm font-medium ${
                          disabled ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-white border border-stone-300 hover:border-[var(--brand-primary)]'
                        } ${selectedTime === t ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-primary-hover)] ring-2 ring-[var(--brand-primary)]' : ''}`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
                {selectedDate && visibleTimeOptions.every((t) => isTimeInPast(t) || isTimeBlocked(t)) && (
                  <p className="text-stone-500 text-sm mt-2">Não há horários disponíveis neste dia para esta duração. Escolha outra data ou profissional.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Observação (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex.: corte na orelha, preferência de cabelo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex flex-row gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => setStep(3)}>Voltar</Button>
                <Button type="submit" variant="primary" disabled={!selectedTime}>Continuar</Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2">
                <p><span className="text-stone-500">Serviço:</span> <strong>{selectedService?.name}</strong> · {formatCurrency(selectedService?.price ?? 0)}</p>
                <p><span className="text-stone-500">Data:</span> {selectedDate && selectedTime && (() => {
                  const d = new Date(selectedDate + 'T' + selectedTime + ':00');
                  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                })()}</p>
                {selectedProfessional && <p><span className="text-stone-500">Profissional:</span> {selectedProfessional}</p>}
              </div>
              <div className="flex flex-row gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => setStep(4)}>Voltar</Button>
                <Button type="submit" variant="success" loading={submitting} disabled={submitting}>
                  Confirmar agendamento
                </Button>
              </div>
            </div>
          )}
        </form>
        </div>
      </div>
    </div>
  );
}
