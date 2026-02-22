import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, User, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/useToast';
import { fetchAuth } from '@/lib/api';

interface Customer {
  id: number;
  name: string;
  phone?: string;
  cpf?: string;
  photo?: string;
}

interface AgendamentoModalProps {
  agendamento?: {
    id?: number;
    customerId?: number;
    serviceId?: number;
    date?: string;
    status?: string;
    notes?: string | undefined;
    professional?: string;
  };
  customers: Customer[];
  services: { id: number; name: string; duration?: number }[];
  professionals: string[];
  onSave: (agendamento: any) => void;
  onClose: () => void;
}

export default function AgendamentoModal({ agendamento, customers, services, professionals, onSave, onClose }: AgendamentoModalProps) {
  const { warning } = useToast();
  const [customerId, setCustomerId] = useState<number | ''>(agendamento?.customerId || '');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [serviceId, setServiceId] = useState<number | ''>(agendamento?.serviceId || '');
  const [date, setDate] = useState<string>(() => {
    const initial = agendamento?.date || '';
    if (!initial) return '';
    const d = new Date(initial);
    if (d.getTime() < Date.now()) {
      const t = new Date();
      const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
      const nowMin = t.getHours() * 60 + t.getMinutes();
      for (let h = 8; h <= 20; h++) {
        if (h * 60 > nowMin) return `${todayStr}T${String(h).padStart(2, '0')}:00`;
        if (h < 20 && (h * 60 + 30) > nowMin) return `${todayStr}T${String(h).padStart(2, '0')}:30`;
      }
      return `${todayStr}T20:00`;
    }
    return initial;
  });
  const [status, setStatus] = useState<string>(agendamento?.status || 'agendado');
  const [notes, setNotes] = useState<string>(agendamento?.notes || '');
  const [professional, setProfessional] = useState<string>(agendamento?.professional || '');
  const [busyAppointments, setBusyAppointments] = useState<{ id: number; date: string; service: { duration: number } }[]>([]);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = agendamento?.date ? new Date(agendamento.date) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const customerSearchRef = useRef<HTMLDivElement>(null);

  const todayLocal = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const dateOnly = date.split('T')[0];
  const selectedService = services.find(s => s.id === Number(serviceId));
  const durationMinutes = selectedService?.duration ?? 30;

  const todayStart = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  }, []);

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

  const selectDay = (year: number, month: number, day: number) => {
    const timePart = date.split('T')[1] || '09:00';
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setDate(`${d}T${timePart}`);
  };

  useEffect(() => {
    if (!dateOnly) return;
    const [y, m] = dateOnly.split('-').map(Number);
    if (viewMonth.year === y && viewMonth.month === m - 1) return;
    setViewMonth({ year: y, month: m - 1 });
  }, [dateOnly, viewMonth.year, viewMonth.month]);

  // Buscar compromissos do dia (do profissional ou todos) para bloquear horários considerando duração
  useEffect(() => {
    if (!dateOnly) {
      setBusyAppointments([]);
      return;
    }
    const start = new Date(dateOnly + 'T00:00:00');
    const end = new Date(dateOnly + 'T23:59:59.999');
    const url = professional
      ? `/api/appointments?professional=${encodeURIComponent(professional)}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      : `/api/appointments?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
    fetchAuth(url)
      .then((r) => r.json())
      .then((data: { data?: unknown[] } | unknown[]) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []) as { id: number; date: string; status?: string; professional?: string | null; service?: { duration?: number } }[];
        const nonCancelled = list.filter((a) => (a.status || '').toLowerCase() !== 'cancelado');
        const excludeId = agendamento?.id;
        const filtered = excludeId ? nonCancelled.filter((a) => a.id !== excludeId) : nonCancelled;
        setBusyAppointments(filtered.map((a) => ({
          id: a.id,
          date: typeof a.date === 'string' ? a.date : new Date(a.date).toISOString(),
          service: { duration: a.service?.duration ?? 30 },
        })));
      })
      .catch(() => setBusyAppointments([]));
  }, [professional, dateOnly, agendamento?.id]);

  // Horários disponíveis (30 em 30 min)
  const timeOptions = useMemo(() => {
    const opts: string[] = [];
    for (let h = 8; h <= 20; h++) {
      opts.push(`${String(h).padStart(2, '0')}:00`);
      if (h < 20) opts.push(`${String(h).padStart(2, '0')}:30`);
    }
    return opts;
  }, []);

  /** Bloqueia se o período do agendamento (início até início+duração) sobrepõe qualquer horário já ocupado. */
  const isTimeBlocked = (timeStr: string): boolean => {
    if (busyAppointments.length === 0) return false;
    const slotStart = new Date(dateOnly + 'T' + timeStr + ':00').getTime();
    const slotEnd = slotStart + durationMinutes * 60 * 1000;
    return busyAppointments.some((appt) => {
      const apptStart = new Date(appt.date).getTime();
      const apptEnd = apptStart + (appt.service?.duration ?? 30) * 60 * 1000;
      return slotStart < apptEnd && slotEnd > apptStart;
    });
  };

  const isTimeInPast = (timeStr: string): boolean => {
    if (dateOnly !== todayLocal) return false;
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const slotMinutes = h * 60 + m;
    return slotMinutes <= nowMinutes;
  };

  const isTimeUnavailable = (timeStr: string): boolean =>
    isTimeInPast(timeStr) || isTimeBlocked(timeStr);

  // Hoje: mostrar só horários futuros. Outros dias: mostrar todos.
  const visibleTimeOptions = useMemo(() => {
    if (dateOnly !== todayLocal) return timeOptions;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return timeOptions.filter((t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m > nowMinutes;
    });
  }, [dateOnly, todayLocal, timeOptions]);

  const currentTime = date.split('T')[1]?.slice(0, 5) || '09:00';
  const isCurrentTimeUnavailable =
    !visibleTimeOptions.includes(currentTime) || isTimeBlocked(currentTime);

  // Se o horário selecionado não está na lista (passou) ou está ocupado, ajustar para primeiro disponível
  useEffect(() => {
    if (!dateOnly || !isCurrentTimeUnavailable) return;
    const firstAvailable = visibleTimeOptions.find((t) => !isTimeBlocked(t));
    if (firstAvailable) setDate(`${dateOnly}T${firstAvailable}`);
  }, [dateOnly, isCurrentTimeUnavailable, visibleTimeOptions, professional, busyAppointments, durationMinutes]);

  // Carregar cliente selecionado ao editar
  useEffect(() => {
    if (agendamento?.customerId) {
      const customer = customers.find(c => c.id === agendamento.customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setCustomerSearchTerm(customer.name);
      }
    }
  }, [agendamento, customers]);

  // Garantir que a data nunca fique no passado (ex.: edição com data passada ou mudança de fuso)
  useEffect(() => {
    if (!dateOnly || dateOnly >= todayLocal) return;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const first = timeOptions.find((t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m > nowMinutes;
    });
    const firstAvailable = first || timeOptions[timeOptions.length - 1];
    setDate(`${todayLocal}T${firstAvailable}`);
  }, [dateOnly, todayLocal, timeOptions]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setShowCustomerSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtrar clientes baseado na busca
  const filteredCustomers = customers.filter(customer => {
    if (!customerSearchTerm) return false;
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchLower) ||
      customer.cpf?.includes(searchLower)
    );
  }).slice(0, 5); // Limitar a 5 sugestões

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerId(customer.id);
    setCustomerSearchTerm(customer.name);
    setShowCustomerSuggestions(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerId('');
    setCustomerSearchTerm('');
    setShowCustomerSuggestions(false);
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Validação
    if (!customerId || !serviceId || !date) {
      warning('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Não permitir data/horário no passado
    const chosen = new Date(date);
    if (chosen.getTime() < Date.now()) {
      warning('Não é possível agendar para data ou horário que já passou.');
      return;
    }

    onSave({ 
      ...agendamento, 
      customerId: Number(customerId), 
      serviceId: Number(serviceId), 
      date, 
      status, 
      notes: notes || null, 
      professional: professional || null 
    });
  }

  return (
    <ModalBase
      isOpen={true}
      onClose={onClose}
      title={agendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
      subtitle={agendamento ? 'Atualize os dados do agendamento abaixo' : 'Preencha os dados para criar um novo agendamento'}
      size="xl"
      footer={
        <div className="flex flex-row gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" form="appointment-form">
            {agendamento ? 'Salvar Alterações' : 'Criar Agendamento'}
          </Button>
        </div>
      }
    >
      <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="relative" ref={customerSearchRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Buscar por nome, CPF ou telefone..."
                value={customerSearchTerm}
                onChange={(e) => {
                  setCustomerSearchTerm(e.target.value);
                  setShowCustomerSuggestions(true);
                  if (!e.target.value) {
                    handleClearCustomer();
                  }
                }}
                onFocus={() => setShowCustomerSuggestions(true)}
                required
              />
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Sugestões de Clientes */}
            {showCustomerSuggestions && customerSearchTerm && !selectedCustomer && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {customer.photo ? (
                            <Image
                              src={customer.photo}
                              alt={customer.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                            {customer.phone && <span>{customer.phone}</span>}
                            {customer.cpf && <span>CPF: {customer.cpf}</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-gray-500">
                    <p className="text-sm">Nenhum cliente encontrado</p>
                    <p className="text-xs mt-1">Tente buscar por nome, CPF ou telefone</p>
                  </div>
                )}
              </div>
            )}

            {/* Cliente Selecionado */}
            {selectedCustomer && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {selectedCustomer.photo ? (
                        <Image
                          src={selectedCustomer.photo}
                          alt={selectedCustomer.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-green-900">{selectedCustomer.name}</div>
                      <div className="text-sm text-green-700 flex items-center gap-3 mt-1">
                        {selectedCustomer.phone && <span>Tel: {selectedCustomer.phone}</span>}
                        {selectedCustomer.cpf && <span>CPF: {selectedCustomer.cpf}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Serviço *</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={serviceId}
                onChange={e => setServiceId(Number(e.target.value))}
                required
              >
                <option value="">Selecione o serviço</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({(s.duration ?? 30)} min)
                  </option>
                ))}
              </select>
              {selectedService && (
                <p className="mt-1 text-xs text-gray-500">
                  Duração: <span className="font-medium text-gray-700">{durationMinutes} min</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Profissional</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={professional}
                onChange={e => setProfessional(e.target.value)}
              >
                <option value="">Selecione o profissional</option>
                {professionals.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <div className="flex items-center justify-between px-2 py-1.5 bg-stone-50 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() =>
                      setViewMonth((v) =>
                        v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }
                      )
                    }
                    className="p-1 rounded hover:bg-stone-200 text-stone-600"
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold text-stone-800 capitalize">
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
                    className="p-1 rounded hover:bg-stone-200 text-stone-600"
                    aria-label="Próximo mês"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-2">
                  <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-stone-500 font-medium mb-1">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((w) => (
                      <div key={w}>{w}</div>
                    ))}
                  </div>
                  {calendarGrid.rows.map((row, ri) => (
                    <div key={ri} className="grid grid-cols-7 gap-0.5">
                      {row.map((cell, ci) => {
                        if (cell.day === null) return <div key={ci} className="aspect-square" />;
                        const past = isDayPast(calendarGrid.year, calendarGrid.month, cell.day);
                        const selected =
                          dateOnly ===
                          `${calendarGrid.year}-${String(calendarGrid.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                        return (
                          <button
                            key={ci}
                            type="button"
                            disabled={past}
                            onClick={() => !past && selectDay(calendarGrid.year, calendarGrid.month, cell.day!)}
                            className={`aspect-square rounded text-sm transition-colors
                              ${past ? 'text-stone-300 cursor-not-allowed bg-transparent' : 'text-stone-800 hover:bg-amber-100'}
                              ${selected && !past ? 'bg-stone-800 text-amber-400 font-semibold hover:bg-stone-700 border border-amber-600/50' : ''}`}
                          >
                            {cell.day}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <input type="hidden" name="date" value={date.split('T')[0] || ''} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Horário *</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={date.split('T')[1]?.slice(0, 5) || '09:00'}
                onChange={e => {
                  const d = date.split('T')[0] || todayLocal;
                  setDate(`${d}T${e.target.value}`);
                }}
                required
              >
                {visibleTimeOptions.map((t) => {
                  const blocked = professional ? isTimeBlocked(t) : false;
                  return (
                    <option key={t} value={t} disabled={blocked}>
                      {t}{blocked ? ' (ocupado)' : ''}
                    </option>
                  );
                })}
              </select>
              {professional && busyAppointments.length > 0 && (
                <p className="text-xs text-stone-500 mt-1">
                  Horários já comprometidos do profissional aparecem desabilitados (ocupado).
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observações do agendamento"
            />
          </div>
        </div>
      </form>
    </ModalBase>
  );
}
