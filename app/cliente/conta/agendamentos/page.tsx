'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { CalendarDays, Pencil, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModalBase } from '@/components/ui/ModalBase';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { useToast } from '@/hooks/useToast';

interface ServiceOption {
  id: number;
  name: string;
  duration: number;
  price: number;
}

interface AppointmentItem {
  id: number;
  date: string;
  status: string;
  professional: string | null;
  notes: string | null;
  service: { id?: number; name: string; duration: number; price: number };
}

const STATUS_LABEL: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export default function ClienteAgendamentosPage() {
  const toast = useToast();
  const [upcoming, setUpcoming] = useState<AppointmentItem[]>([]);
  const [past, setPast] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [professionals, setProfessionals] = useState<string[]>([]);

  const [actionModal, setActionModal] = useState<'edit' | 'confirm' | 'cancel' | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
  const [justification, setJustification] = useState('');
  const [editForm, setEditForm] = useState({ serviceId: 0, date: '', professional: '', notes: '' });
  const [viewMonth, setViewMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [busySlots, setBusySlots] = useState<{ start: string; end: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    fetch('/api/cliente/agendamentos')
      .then((r) => r.json())
      .then((data) => {
        setUpcoming(data?.upcoming ?? []);
        setPast(data?.past ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (actionModal === 'edit') {
      Promise.all([
        fetch('/api/booking/services').then((r) => r.json()),
        fetch('/api/booking/professionals').then((r) => r.json()),
      ]).then(([svc, prof]) => {
        setServices(Array.isArray(svc) ? svc : []);
        setProfessionals(Array.isArray(prof) ? prof : []);
      });
    }
  }, [actionModal]);

  const editDateOnly = editForm.date.split('T')[0];
  const editTimePart = editForm.date.split('T')[1]?.slice(0, 5) || '09:00';
  const selectedServiceForEdit = services.find((s) => s.id === editForm.serviceId);
  const durationMinutes = selectedServiceForEdit?.duration ?? 30;

  useEffect(() => {
    if (actionModal !== 'edit' || !editDateOnly) {
      setBusySlots([]);
      return;
    }
    let url = editForm.professional
      ? `/api/booking/slots?professional=${encodeURIComponent(editForm.professional)}&date=${editDateOnly}`
      : `/api/booking/slots?date=${editDateOnly}`;
    if (selectedAppointment?.id) url += `&excludeId=${selectedAppointment.id}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setBusySlots(Array.isArray(data) ? data : []))
      .catch(() => setBusySlots([]));
  }, [actionModal, editForm.professional, editDateOnly, selectedAppointment?.id]);

  const todayLocal = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
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

  useEffect(() => {
    if (!editDateOnly || actionModal !== 'edit') return;
    const [y, m] = editDateOnly.split('-').map(Number);
    setViewMonth((prev) => (prev.year === y && prev.month === m - 1 ? prev : { year: y, month: m - 1 }));
  }, [editDateOnly, actionModal]);

  const isDayPast = (year: number, month: number, day: number) =>
    new Date(year, month, day).getTime() < todayStart;

  const selectDay = (year: number, month: number, day: number) => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setEditForm((f) => ({ ...f, date: `${d}T${editTimePart}` }));
  };

  const timeOptions = useMemo(() => {
    const opts: string[] = [];
    for (let h = 8; h <= 20; h++) {
      opts.push(`${String(h).padStart(2, '0')}:00`);
      if (h < 20) opts.push(`${String(h).padStart(2, '0')}:30`);
    }
    return opts;
  }, []);

  /** Bloqueia se o período do novo agendamento (início até início+duração) sobrepõe qualquer horário ocupado. */
  const isTimeBlocked = (timeStr: string): boolean => {
    if (busySlots.length === 0) return false;
    const slotStart = new Date(editDateOnly + 'T' + timeStr + ':00').getTime();
    const slotEnd = slotStart + durationMinutes * 60 * 1000;
    return busySlots.some((s) => {
      const start = new Date(s.start).getTime();
      const end = new Date(s.end).getTime();
      return slotStart < end && slotEnd > start;
    });
  };

  const isTimeInPast = (timeStr: string): boolean => {
    if (editDateOnly !== todayLocal) return false;
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
  };

  const visibleTimeOptions = useMemo(() => {
    if (editDateOnly !== todayLocal) return timeOptions;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return timeOptions.filter((t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m > nowMin;
    });
  }, [editDateOnly, todayLocal, timeOptions]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const canChange = (a: AppointmentItem) =>
    a.status === 'agendado' || a.status === 'confirmado';

  const handleDelete = async (apt: AppointmentItem) => {
    const confirmed = await toast.confirm({
      title: 'Excluir agendamento',
      message: 'Tem certeza que deseja excluir este agendamento do seu histórico? Digite sua senha para confirmar.',
      type: 'danger',
      confirmText: 'Excluir',
      requirePassword: true,
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cliente/agendamentos/${apt.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error || 'Não foi possível excluir.');
        return;
      }
      loadData();
      toast.success('Agendamento excluído.');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  /** Remove do campo observação as linhas de log do sistema (Confirmação/Alteração/Cancelamento pelo cliente). */
  const userNotesOnly = (notes: string | null) => {
    if (!notes || !notes.trim()) return '';
    return notes
      .split('\n')
      .filter((line) => {
        const t = line.trim();
        return !(t.startsWith('[') && t.includes('] ') && t.includes('pelo cliente:'));
      })
      .join('\n')
      .trim();
  };

  const openModal = (type: 'edit' | 'confirm' | 'cancel', apt: AppointmentItem) => {
    setSelectedAppointment(apt);
    setActionModal(type);
    setJustification('');
    setError('');
    if (type === 'edit' && apt.service?.id) {
      const d = new Date(apt.date);
      const dateStr =
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0');
      const timeStr =
        String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      setEditForm({
        serviceId: apt.service.id,
        date: `${dateStr}T${timeStr}`,
        professional: apt.professional || '',
        notes: userNotesOnly(apt.notes),
      });
      setViewMonth({ year: d.getFullYear(), month: d.getMonth() });
    }
  };

  const closeModal = () => {
    setActionModal(null);
    setSelectedAppointment(null);
    setJustification('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedAppointment || justification.trim().length < 3) {
      setError('Justificativa é obrigatória (mínimo 3 caracteres).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = { justification: justification.trim() };
      if (actionModal === 'edit') {
        body.serviceId = editForm.serviceId;
        body.date = editForm.date; // datetime-local format YYYY-MM-DDTHH:mm
        body.professional = editForm.professional || null;
        body.notes = editForm.notes || null;
      } else if (actionModal === 'confirm') {
        body.status = 'confirmado';
      } else if (actionModal === 'cancel') {
        body.status = 'cancelado';
      }
      const res = await fetch(`/api/cliente/agendamentos/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || 'Erro ao salvar.';
        setError(msg);
        toast.error(msg);
        setSaving(false);
        return;
      }
      closeModal();
      loadData();
      if (actionModal === 'edit') toast.success('Agendamento atualizado!');
      else if (actionModal === 'confirm') toast.success('Agendamento confirmado!');
      else if (actionModal === 'cancel') toast.success('Agendamento cancelado.');
    } catch {
      const msg = 'Erro de conexão. Tente novamente.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const renderList = (list: AppointmentItem[], title: string, showActions: boolean) => (
    <div className="card card-body mb-6">
      <h3 className="card-title mb-4 flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-[var(--brand-primary)]" />
        {title}
      </h3>
      {list.length === 0 ? (
        <p className="text-stone-500 text-sm">
          {title.includes('Próxim') ? 'Nenhum agendamento futuro.' : 'Nenhum agendamento passado.'}
        </p>
      ) : (
        <ul className="space-y-0">
          {list.map((a) => {
            const d = new Date(a.date);
            return (
              <li key={a.id} className="py-3 border-b border-stone-100 last:border-0">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-900">{a.service.name}</p>
                    <p className="text-sm text-stone-500 mt-1">
                      {d.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}{' '}
                      · {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {a.professional && ` · ${a.professional}`}
                    </p>
                    <p className="text-sm text-stone-600 mt-1">{formatCurrency(a.service.price)}</p>
                    {!showActions && a.status !== 'concluido' && (
                      <span
                        className={`inline-block mt-2 text-xs font-medium px-2 py-1 rounded ${
                          a.status === 'confirmado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.status === 'concluido'
                              ? 'bg-sky-100 text-sky-800'
                              : a.status === 'cancelado'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(showActions || a.status === 'concluido') && (
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          a.status === 'confirmado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.status === 'concluido'
                              ? 'bg-sky-100 text-sky-800'
                              : a.status === 'cancelado'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    )}
                    {a.status === 'concluido' ? (
                      <ActionsMenu
                        alignRight
                        items={[
                          { icon: Trash2, label: 'Excluir', onClick: () => handleDelete(a), danger: true },
                        ]}
                      />
                    ) : showActions && canChange(a) ? (
                      <ActionsMenu
                        alignRight
                        items={[
                          { icon: Pencil, label: 'Editar agendamento', onClick: () => openModal('edit', a) },
                          ...(a.status === 'agendado'
                            ? [{ icon: CheckCircle, label: 'Confirmar agendamento', onClick: () => openModal('confirm', a) }]
                            : []),
                          { icon: XCircle, label: 'Cancelar agendamento', onClick: () => openModal('cancel', a), danger: true },
                        ]}
                      />
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  const modalTitle =
    actionModal === 'edit'
      ? 'Editar Agendamento'
      : actionModal === 'confirm'
        ? 'Confirmar agendamento'
        : 'Cancelar agendamento';
  const modalSubtitle =
    actionModal === 'edit'
      ? 'Atualize os dados do agendamento abaixo'
      : actionModal === 'confirm'
        ? 'Informe uma justificativa para confirmar'
        : 'Informe o motivo do cancelamento';

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
        <h1 className="page-title">Meus agendamentos</h1>
        <p className="page-subtitle">Próximos e histórico</p>
      </div>
      {renderList(upcoming, 'Próximos agendamentos', true)}
      {renderList(past, 'Histórico', false)}

      <div className="flex flex-row items-center justify-end gap-3 flex-nowrap">
        <Link href="/agendar">
          <Button type="button" variant="primary" icon={Calendar}>
            Novo agendamento
          </Button>
        </Link>
      </div>

      <ModalBase
        isOpen={actionModal !== null}
        onClose={closeModal}
        title={modalTitle}
        subtitle={modalSubtitle}
        size={actionModal === 'edit' ? 'xl' : 'md'}
        footer={
          <div className="flex flex-row gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={closeModal}>
              {actionModal === 'edit' ? 'Cancelar' : 'Fechar'}
            </Button>
            <Button
              type="button"
              variant={actionModal === 'cancel' ? 'danger' : 'primary'}
              onClick={handleSubmit}
              disabled={saving || justification.trim().length < 3}
              loading={saving}
            >
              {actionModal === 'edit' ? 'Salvar alterações' : actionModal === 'confirm' ? 'Confirmar' : 'Cancelar agendamento'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 border border-red-100">
              {error}
            </div>
          )}
          {actionModal === 'edit' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Serviço *</label>
                  <select
                    className="form-input w-full"
                    value={editForm.serviceId}
                    onChange={(e) => setEditForm((f) => ({ ...f, serviceId: Number(e.target.value) }))}
                  >
                    <option value="">Selecione o serviço</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.duration} min · {formatCurrency(s.price)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Profissional</label>
                  <select
                    className="form-input w-full"
                    value={editForm.professional}
                    onChange={(e) => setEditForm((f) => ({ ...f, professional: e.target.value }))}
                  >
                    <option value="">Selecione o profissional</option>
                    {professionals.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Data *</label>
                  <div className="border border-stone-300 rounded-lg overflow-hidden bg-white">
                    <div className="flex items-center justify-between px-2 py-1.5 bg-stone-50 border-b border-stone-200">
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
                              editDateOnly ===
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Horário *</label>
                  <select
                    className="form-input w-full"
                    value={editTimePart}
                    onChange={(e) => setEditForm((f) => ({ ...f, date: `${editDateOnly}T${e.target.value}` }))}
                  >
                    {visibleTimeOptions.map((t) => {
                      const blocked = editForm.professional ? isTimeBlocked(t) : false;
                      const past = isTimeInPast(t);
                      const disabled = blocked || past;
                      return (
                        <option key={t} value={t} disabled={disabled}>
                          {t}
                          {blocked ? ' (ocupado)' : past ? ' (passado)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {editForm.professional && busySlots.length > 0 && (
                    <p className="text-xs text-stone-500 mt-1">
                      Horários já comprometidos do profissional aparecem desabilitados (ocupado).
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Observações</label>
                <textarea
                  rows={3}
                  className="form-input w-full"
                  placeholder="Observações do agendamento"
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Justificativa *</label>
            <textarea
              className="form-input min-h-[80px] w-full"
              placeholder="Informe o motivo da alteração (mín. 3 caracteres)"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              minLength={3}
              rows={3}
            />
          </div>
        </div>
      </ModalBase>
    </div>
  );
}
