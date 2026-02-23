"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { fetchAuth, unwrapListResponse } from '@/lib/api';
import AgendamentoModal from "@/components/AgendamentoModal";
import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { LoadingSpinner } from '@/components/ui/Layout';
import { 
  Trash2, Pencil, User, Plus, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, MessageSquare, Scissors, Info, AlertCircle, Lock,
  CalendarDays, LayoutGrid, List, XCircle, CalendarClock, RefreshCw
} from "lucide-react";

interface Appointment {
  id: number;
  customerId: number;
  serviceId: number;
  date: string;
  status: string;
  professional: string | null;
  notes: string | null;
  cancellationReason?: string | null;
  customer: { id: number; name: string; phone: string; };
  service: { id: number; name: string; duration: number; price: number; };
}

export default function AgendamentosPage() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const openedFromLink = useRef(false);
  const openedNewModal = useRef(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [cancelReasonAppointment, setCancelReasonAppointment] = useState<Appointment | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState<{id: number; name: string; duration: number; price: number;}[]>([]);
  const [professionals, setProfessionals] = useState([]);

  const [viewMode, setViewMode] = useState<'day' | 'month' | 'list'>('day');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [listFilter, setListFilter] = useState<'all' | 'month' | 'day'>('month');
  const [listSearch, setListSearch] = useState('');
  const [nowPosition, setNowPosition] = useState(0);
  const START_HOUR = 8;
  const END_HOUR = 22;
  const HOUR_HEIGHT = 80;

  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const fetchIdRef = useRef(0);

  const dateStrip = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  }, [selectedDate.getTime()]);

  const monthGrid = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = first.getDay();
    const daysInMonth = last.getDate();
    const rows: Date[][] = [];
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    let dayCount = 1;
    let nextMonthDay = 1;
    for (let r = 0; r < 6; r++) {
      const row: Date[] = [];
      for (let c = 0; c < 7; c++) {
        const cellIndex = r * 7 + c;
        if (cellIndex < startDay) {
          const d = daysPrevMonth - startDay + cellIndex + 1;
          row.push(new Date(prevYear, prevMonth, d));
        } else if (dayCount <= daysInMonth) {
          row.push(new Date(year, month, dayCount));
          dayCount++;
        } else {
          row.push(new Date(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, nextMonthDay));
          nextMonthDay++;
        }
      }
      rows.push(row);
    }
    return rows;
  }, [selectedDate.getTime()]);

  useEffect(() => {
    fetchData();
    updateNowPosition();
    const interval = setInterval(updateNowPosition, 60000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  useEffect(() => {
    const scrollToSelected = () => {
      if (scrollRef.current) {
        const selectedElement = scrollRef.current.querySelector('[data-selected="true"]');
        if (selectedElement) {
          if (isInitialLoad.current) {
            scrollRef.current.scrollLeft = (selectedElement as HTMLElement).offsetLeft - 12;
            isInitialLoad.current = false;
          } else {
            selectedElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        }
      }
    };
    const timer = setTimeout(scrollToSelected, 100);
    return () => clearTimeout(timer);
  }, [selectedDate.toDateString(), loading]);

  // Abrir agendamento quando vier do dashboard com ?id=...
  useEffect(() => {
    if (loading || openedFromLink.current) return;
    const idParam = searchParams.get('id');
    if (!idParam) return;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) return;
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return;
    openedFromLink.current = true;
    setSelectedDate(new Date(apt.date));
    setSelectedAppointment(apt);
    window.history.replaceState({}, '', '/admin/agendamentos');
  }, [loading, searchParams, appointments]);

  // Abrir modal de criar quando vier do dashboard com ?new=1
  useEffect(() => {
    if (loading || openedNewModal.current) return;
    if (searchParams.get('new') !== '1') return;
    openedNewModal.current = true;
    setEditingAppointment(null);
    setShowFormModal(true);
    window.history.replaceState({}, '', '/admin/agendamentos');
  }, [loading, searchParams]);

  const updateNowPosition = () => {
    const now = new Date();
    if (now.toDateString() === selectedDate.toDateString()) {
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const position = (currentHour - START_HOUR) * HOUR_HEIGHT;
      setNowPosition(position);
    } else {
      setNowPosition(-1);
    }
  };

  async function fetchData() {
    const myId = ++fetchIdRef.current;
    setLoading(true);
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
      const startDate = start.toISOString();
      const endDate = end.toISOString();

      const [cRes, sRes, pRes, aRes] = await Promise.all([
        fetchAuth('/api/customers'),
        fetchAuth('/api/services'),
        fetchAuth('/api/professionals'),
        fetchAuth(`/api/appointments?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`),
      ]);

      if (!cRes.ok || !sRes.ok || !pRes.ok || !aRes.ok) {
        throw new Error('Falha ao carregar dados');
      }

      const [c, s, p, aJson] = await Promise.all([cRes.json(), sRes.json(), pRes.json(), aRes.json()]);
      const customersList = unwrapListResponse(c);
      const appointmentsList = unwrapListResponse(aJson);

      if (myId !== fetchIdRef.current) return;

      setCustomers(customersList);
      setServices(s);
      setProfessionals(Array.isArray(p) ? p.filter((prof: { active?: boolean }) => prof.active).map((prof: { name: string }) => prof.name) : []);
      setAppointments(appointmentsList);
    } catch (e) {
      console.error(e);
      if (myId === fetchIdRef.current) {
        toast.error('Erro ao carregar agendamentos. Tente novamente.');
        setAppointments([]);
      }
    } finally {
      if (myId === fetchIdRef.current) setLoading(false);
    }
  }

  const appointmentsByStatus = useMemo(() => {
    if (statusFilter === 'all') return appointments;
    return appointments.filter(apt => apt.status.toLowerCase() === statusFilter);
  }, [appointments, statusFilter]);

  const filteredAppointments = useMemo(() => {
    return appointmentsByStatus.filter(apt => {
      const d = new Date(apt.date);
      return d.toDateString() === selectedDate.toDateString();
    });
  }, [appointmentsByStatus, selectedDate]);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointmentsByStatus.forEach(apt => {
      const key = new Date(apt.date).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    });
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    return map;
  }, [appointmentsByStatus]);

  const listFilteredAppointments = useMemo(() => {
    let list = [...appointmentsByStatus];
    const now = new Date();
    if (listFilter === 'month') {
      const y = selectedDate.getFullYear();
      const m = selectedDate.getMonth();
      list = list.filter(apt => {
        const d = new Date(apt.date);
        return d.getFullYear() === y && d.getMonth() === m;
      });
    } else if (listFilter === 'day') {
      const key = selectedDate.toDateString();
      list = list.filter(apt => new Date(apt.date).toDateString() === key);
    }
    if (listSearch.trim()) {
      const q = listSearch.trim().toLowerCase();
      list = list.filter(apt =>
        apt.customer.name.toLowerCase().includes(q) ||
        apt.service.name.toLowerCase().includes(q) ||
        (apt.professional || '').toLowerCase().includes(q)
      );
    }
    // Ordenar por "próximo da vez": primeiro os que ainda vão acontecer (do mais próximo ao mais distante), depois os passados (do mais recente ao mais antigo)
    const nowTs = now.getTime();
    list.sort((a, b) => {
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      const aFuturo = ta >= nowTs;
      const bFuturo = tb >= nowTs;
      if (aFuturo && bFuturo) return ta - tb;   // ambos futuros: mais próximo primeiro
      if (!aFuturo && !bFuturo) return tb - ta;  // ambos passados: mais recente primeiro
      return aFuturo ? -1 : 1;                   // futuro antes de passado
    });
    return list;
  }, [appointmentsByStatus, listFilter, listSearch, selectedDate]);

  const changeDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
  };

  const getAppointmentLayoutInList = (apt: Appointment, list: Appointment[]) => {
    const start = new Date(apt.date).getTime();
    const end = start + (apt.service.duration * 60000);
    const overlaps = list.filter(other => {
      const otherStart = new Date(other.date).getTime();
      const otherEnd = otherStart + (other.service.duration * 60000);
      return (start < otherEnd && end > otherStart);
    }).sort((a, b) => a.id - b.id);
    const count = overlaps.length;
    const index = overlaps.findIndex(o => o.id === apt.id);
    const width = 100 / count;
    const left = index * width;
    return { width: `${width}%`, left: `${left}%` };
  };

  const getAppointmentLayout = (apt: Appointment) => getAppointmentLayoutInList(apt, filteredAppointments);

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'agendado': return { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-900', badge: 'bg-amber-200 text-amber-900', accent: 'bg-amber-500' };
      case 'confirmado': return { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-900', badge: 'bg-emerald-200 text-emerald-900', accent: 'bg-emerald-600' };
      case 'concluido': return { bg: 'bg-sky-50', border: 'border-sky-500', text: 'text-sky-900', badge: 'bg-sky-200 text-sky-900', accent: 'bg-sky-600' };
      case 'faturado': return { bg: 'bg-violet-50', border: 'border-violet-500', text: 'text-violet-900', badge: 'bg-violet-200 text-violet-900', accent: 'bg-violet-600' };
      case 'cancelado': return { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-800', badge: 'bg-red-200 text-red-800', accent: 'bg-red-500' };
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900', badge: 'bg-gray-100 text-gray-800', accent: 'bg-gray-400' };
    }
  };

  const MIN_BLOCK_HEIGHT = 36;
  const getAptStyle = (dateStr: string, duration: number) => {
    const date = new Date(dateStr);
    const aptHour = date.getHours() + date.getMinutes() / 60;
    const top = (aptHour - START_HOUR) * HOUR_HEIGHT;
    const heightPx = Math.max((duration / 60) * HOUR_HEIGHT, MIN_BLOCK_HEIGHT);
    return { top: `${top}px`, height: `${heightPx}px`, minHeight: `${MIN_BLOCK_HEIGHT}px` };
  };

  async function handleStatusUpdate(id: number, newStatus: string, cancellationReason?: string) {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    try {
      const payload: Record<string, unknown> = { ...apt, status: newStatus };
      if (newStatus === 'cancelado' && cancellationReason !== undefined) payload.cancellationReason = cancellationReason;
      const res = await fetchAuth('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchData();
        setSelectedAppointment(null);
        setCancelReasonAppointment(null);
        setCancelReasonText('');
        toast.success(newStatus === 'cancelado' ? 'Agendamento cancelado' : `Status: ${newStatus}`);
      }
    } catch (e) { toast.error('Erro ao atualizar'); }
  }

  const changeMonth = (offset: number) => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    setSelectedDate(new Date(year, month + offset, 1));
    isInitialLoad.current = true;
  };

  async function saveAppointment(data: any, statusOverride?: string) {
    const isEdit = editingAppointment !== null;
    
    const start = new Date(data.date).getTime();
    const foundService = services.find((s: any) => s.id === Number(data.serviceId));
    const duration = foundService && typeof foundService.duration === 'number' ? foundService.duration : 30;
    const end = start + duration * 60000;

    // Conflito: mesmo profissional + mesmo horário
    const professionalConflict = appointments.find(apt => {
      if (isEdit && apt.id === editingAppointment!.id) return false;
      if (apt.professional !== data.professional) return false;
      const aptStart = new Date(apt.date).getTime();
      const aptEnd = aptStart + (apt.service.duration * 60000);
      return (start < aptEnd && end > aptStart);
    });
    if (professionalConflict) {
      toast.error(`${data.professional} já tem agendamento neste horário.`);
      return;
    }

    // Conflito: mesmo cliente + mesmo horário (não pode dois serviços ao mesmo tempo)
    const customerIdNum = Number(data.customerId);
    const clientConflict = appointments.find(apt => {
      if (isEdit && apt.id === editingAppointment!.id) return false;
      if (apt.customerId !== customerIdNum) return false;
      const aptStart = new Date(apt.date).getTime();
      const aptEnd = aptStart + (apt.service.duration * 60000);
      return (start < aptEnd && end > aptStart);
    });
    if (clientConflict) {
      toast.error('Este cliente já possui outro agendamento neste horário.');
      return;
    }

    let finalStatus = statusOverride || (isEdit ? editingAppointment!.status : 'agendado');
    // Reagendar: cancelado volta para agendado
    if (isEdit && editingAppointment!.status.toLowerCase() === 'cancelado') {
      finalStatus = 'agendado';
    }
    // Reset para Agendado: se estava Confirmado e alterou data, serviço ou profissional
    const dateChanged = isEdit && editingAppointment!.date !== data.date;
    const serviceChanged = isEdit && Number(editingAppointment!.serviceId) !== Number(data.serviceId);
    const professionalChanged = isEdit && (editingAppointment!.professional || '') !== (data.professional || '');
    if (isEdit && editingAppointment!.status === 'confirmado' && (dateChanged || serviceChanged || professionalChanged)) {
      finalStatus = 'agendado';
      toast.info('Alteração detectada: status resetado para Agendado.');
    }

    const finalData = { ...data, status: finalStatus };
    try {
      const res = await fetchAuth('/api/appointments', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...finalData, id: editingAppointment!.id } : finalData)
      });
      if (res.ok) {
        await fetchData();
        setShowFormModal(false);
        setEditingAppointment(null);
        setSelectedDate(new Date(data.date));
        isInitialLoad.current = true;
        toast.success('Salvo!');
        return;
      }
      const err = await res.json().catch(() => ({}));
      const msg = err?.error || (res.status === 409 ? 'Conflito de horário ou profissional.' : 'Erro ao salvar');
      toast.error(msg);
      return;
    } catch (e) { toast.error('Erro ao salvar'); }
  }

  if (loading && !refreshing) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const scrollbarHideCss = '.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideCss }} />
      <div className="flex flex-col h-full bg-white overflow-hidden">

      <div className="page-container flex-shrink-0 pt-4 pb-2 border-b border-stone-100 bg-white">
        <div className="page-header text-center relative">
          <button
            type="button"
            onClick={async () => { try { setRefreshing(true); await Promise.all([fetchData(), new Promise(r => setTimeout(r, 1000))]); } finally { setRefreshing(false); } }}
            disabled={refreshing}
            className="hidden sm:flex absolute right-0 top-0 w-9 h-9 rounded-full items-center justify-center text-stone-500 hover:text-amber-500 hover:bg-stone-100 active:!text-stone-500 active:!bg-transparent focus:!text-stone-500 focus:!bg-transparent focus:outline-none transition-colors disabled:opacity-50"
            aria-label="Atualizar"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <h1 className="page-title">Agendamentos</h1>
          <p className="page-subtitle">Calendário e agenda</p>
          <div className="flex justify-center mt-3 sm:hidden">
            <button
              type="button"
              onClick={async () => { try { setRefreshing(true); await Promise.all([fetchData(), new Promise(r => setTimeout(r, 1000))]); } finally { setRefreshing(false); } }}
              disabled={refreshing}
              className="w-9 h-9 rounded-full flex items-center justify-center text-stone-500 hover:text-amber-500 hover:bg-stone-100 active:!text-stone-500 active:!bg-transparent focus:!text-stone-500 focus:!bg-transparent focus:outline-none transition-colors disabled:opacity-50"
              aria-label="Atualizar"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <header className="bg-white border-b border-stone-100 pt-2 pb-3 flex-shrink-0">
        <div className="page-container flex items-center gap-2 mb-3 flex-nowrap overflow-x-auto no-scrollbar">
          <div className="inline-flex rounded-lg bg-stone-100 p-1 gap-0.5 flex-shrink-0 items-center">
            {[
              { id: 'day' as const, label: 'Dia', icon: CalendarDays },
              { id: 'month' as const, label: 'Mês', icon: LayoutGrid },
              { id: 'list' as const, label: 'Lista', icon: List }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  viewMode === id
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-stone-600 hover:text-stone-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
            <div className="w-px h-5 bg-stone-200 mx-0.5 flex-shrink-0" aria-hidden />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className={`rounded-md border-0 px-2.5 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-stone-400/50 min-w-[7.5rem] cursor-pointer flex-shrink-0 transition-colors ${getStatusStyles(statusFilter === 'all' ? '' : statusFilter).badge}`}
            >
              <option value="all">Todos</option>
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="concluido">Concluído</option>
              <option value="faturado">Faturado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {viewMode === 'day' && (
          <div className="page-container flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeDay(-1)}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
              aria-label="Dia anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <label className="flex-1 flex flex-col items-center justify-center min-h-[44px] rounded-lg border border-stone-200 bg-white px-4 py-2 cursor-pointer hover:bg-stone-50 transition-colors">
              <input
                type="date"
                className="sr-only"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => { setSelectedDate(new Date(e.target.value + 'T00:00:00')); isInitialLoad.current = true; }}
              />
              <span className="text-sm font-semibold text-stone-800 tabular-nums">
                {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
              <span className="text-xs text-stone-500 capitalize mt-0.5">
                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
              </span>
            </label>
            <button
              type="button"
              onClick={() => changeDay(1)}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
              aria-label="Próximo dia"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {viewMode === 'month' && (
          <div className="page-container flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <label className="flex-1 flex items-center justify-center min-h-[44px] rounded-lg border border-stone-200 bg-white px-4 py-2 cursor-pointer hover:bg-stone-50 transition-colors">
              <input
                type="month"
                className="sr-only"
                value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`}
                onChange={e => {
                  const [y, m] = e.target.value.split('-').map(Number);
                  setSelectedDate(new Date(y, m - 1, 1));
                  isInitialLoad.current = true;
                }}
              />
              <span className="text-sm font-semibold text-stone-800 capitalize text-center pointer-events-none">
                {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
            </label>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(new Date())}
              className="flex-shrink-0 py-2 px-3 rounded-lg text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            >
              Hoje
            </button>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="page-container space-y-3">
            <input
              type="text"
              placeholder="Buscar por cliente, serviço ou profissional..."
              value={listSearch}
              onChange={e => setListSearch(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 bg-stone-50/50 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
            />
            <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
              {[
                { id: 'day' as const, label: 'Dia' },
                { id: 'month' as const, label: 'Mês' },
                { id: 'all' as const, label: 'Todos' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setListFilter(id)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all min-h-[40px] ${
                    listFilter === id ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-600 hover:text-stone-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {listFilter === 'day' && (
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => changeDay(-1)}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                  aria-label="Dia anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <label className="flex-1 min-h-[44px] flex flex-col justify-center rounded-lg border border-stone-200 bg-white px-3 py-2 text-center cursor-pointer hover:bg-stone-50 transition-colors">
                  <input
                    type="date"
                    className="sr-only"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={e => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
                  />
                  <span className="text-sm font-semibold text-stone-800 tabular-nums">
                    {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-stone-500 capitalize block mt-0.5">
                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => changeDay(1)}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                  aria-label="Próximo dia"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
            {listFilter === 'month' && (
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex-1 min-h-[44px] flex items-center justify-center rounded-lg border border-stone-200 bg-white px-3 py-2">
                  <span className="text-sm font-semibold text-stone-800 capitalize text-center">
                    {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date())}
                  className="flex-shrink-0 py-2 px-3 rounded-lg text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                >
                  Hoje
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 relative overflow-auto bg-stone-50/50 pb-24">
        {viewMode === 'day' && (
          <div className="relative w-full pt-6 px-2" style={{ minHeight: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT + 40}px` }}>
            <div className="absolute left-0 top-6 w-12 h-full border-r border-stone-200 z-10 bg-white/95 backdrop-blur-sm rounded-r-lg">
              {Array.from({ length: (END_HOUR - START_HOUR) * 2 + 1 }).map((_, i) => {
                const isHalfHour = i % 2 !== 0;
                const hour = START_HOUR + Math.floor(i / 2);
                const top = (i * HOUR_HEIGHT) / 2;
                return (
                  <div key={i} className="absolute w-full text-center" style={{ top: `${top - 8}px` }}>
                    <span className={`font-semibold tracking-tight ${isHalfHour ? 'text-[9px] text-stone-200' : 'text-xs text-stone-500'}`}>
                      {hour}:{isHalfHour ? '30' : '00'}
                    </span>
                  </div>
                );
              })}
            </div>
            {Array.from({ length: (END_HOUR - START_HOUR) * 2 + 1 }).map((_, i) => (
              <div key={i} className={`absolute w-full border-t ${i % 2 === 0 ? 'border-stone-200' : 'border-stone-100 border-dashed'}`} style={{ top: `${(i * HOUR_HEIGHT) / 2 + 24}px`, left: 48 }} />
            ))}
            {nowPosition >= 0 && (
              <div className="absolute w-full z-20 flex items-center" style={{ top: `${nowPosition + 24}px`, left: 48 }}>
                <div className="w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm" />
                <div className="flex-1 border-t border-red-500/40" />
              </div>
            )}
            <div className="absolute left-12 right-2 h-full pt-6 px-0.5">
              {filteredAppointments.map(apt => {
                const styles = getStatusStyles(apt.status);
                const layout = getAppointmentLayout(apt);
                const isLocked = ['concluido', 'faturado'].includes(apt.status.toLowerCase());
                const aptStyle = getAptStyle(apt.date, apt.service.duration);
                return (
                  <div
                    key={apt.id}
                    onClick={() => setSelectedAppointment(apt)}
                    className={`absolute rounded-lg border-l-4 p-1.5 min-w-0 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98] overflow-hidden flex flex-col box-border ${styles.bg} ${styles.border}`}
                    style={{ ...aptStyle, left: layout.left, width: layout.width }}
                    title={`${apt.service.name} · ${apt.customer.name} · ${new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                  >
                    <div className="flex items-center gap-1.5 flex-shrink-0 min-w-0">
                      <span className={`text-[11px] font-bold ${styles.text} tabular-nums flex-shrink-0`}>
                        {new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase flex-shrink-0 truncate max-w-[60%] ${styles.badge}`}>{apt.status}</span>
                    </div>
                    <div className="flex-1 min-h-0 min-w-0 flex flex-col justify-center py-0.5">
                      <p className={`text-[11px] font-semibold truncate leading-snug ${styles.text}`} title={apt.service.name}>
                        {apt.service.name}
                      </p>
                      <p className={`text-[10px] font-medium truncate leading-snug ${styles.text}`} title={apt.customer.name}>
                        {apt.customer.name}
                      </p>
                    </div>
                    <div className="flex-shrink-0 pt-1 border-t border-black/10 flex justify-between items-center gap-1 min-w-0">
                      <span className={`text-[10px] font-medium truncate min-w-0 ${styles.text}`} title={apt.professional || ''}>{apt.professional?.split(' ')[0] || '—'}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isLocked && <Lock className="h-3 w-3 opacity-80" title="Edição bloqueada" />}
                        <span className={`text-[11px] font-semibold whitespace-nowrap ${styles.text}`}>R$ {Number(apt.service.price).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'month' && (
          <div className="p-4 max-w-5xl mx-auto">
            <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
              <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} className="py-2.5 text-center text-xs font-semibold text-stone-500">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7" style={{ gridAutoRows: 'minmax(100px, 1fr)' }}>
                {monthGrid.map((row, ri) =>
                  row.map((cell, ci) => {
                    const key = cell.toDateString();
                    const isCurrentMonth = cell.getMonth() === selectedDate.getMonth();
                    const list = appointmentsByDate[key] || [];
                    const isToday = cell.toDateString() === new Date().toDateString();
                    const isSelected = cell.toDateString() === selectedDate.toDateString();
                    const isWeekend = cell.getDay() === 0 || cell.getDay() === 6;
                    return (
                      <div
                        key={key}
                        onClick={() => { setSelectedDate(new Date(cell)); setViewMode('day'); }}
                        className={`min-h-[100px] p-1.5 border-b border-r border-stone-100 cursor-pointer transition-colors flex flex-col ${
                          !isCurrentMonth
                            ? 'bg-stone-50/80 hover:bg-stone-100/80'
                            : isSelected
                              ? 'bg-amber-50 ring-1 ring-amber-500 ring-inset hover:bg-amber-100'
                              : isToday
                                ? 'bg-amber-50 hover:bg-stone-800/5'
                                : isWeekend
                                  ? 'bg-stone-50/50 hover:bg-amber-50/50'
                                  : 'bg-white hover:bg-amber-50/50'
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1 ${
                            !isCurrentMonth
                              ? 'text-stone-400'
                              : isToday
                                ? 'bg-stone-800 text-amber-400'
                                : isSelected
                                  ? 'bg-amber-500 text-white'
                                  : 'text-stone-700'
                          }`}
                        >
                          {cell.getDate()}
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-0.5 pr-0.5">
                          {list.slice(0, 5).map(apt => (
                            <div
                              key={apt.id}
                              onClick={e => { e.stopPropagation(); setSelectedAppointment(apt); }}
                              className={`text-[10px] truncate rounded px-1.5 py-0.5 ${getStatusStyles(apt.status).badge} cursor-pointer hover:opacity-90 flex-shrink-0`}
                              title={`${new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – ${apt.service.name} – ${apt.customer.name}`}
                            >
                              {new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {apt.service.name}
                            </div>
                          ))}
                          {list.length > 5 && (
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); setSelectedDate(new Date(cell)); setViewMode('day'); }}
                              className="text-[9px] font-medium text-amber-600 hover:text-amber-700 flex-shrink-0"
                            >
                              +{list.length - 5} mais
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="p-4 pb-8">
            <div className="max-w-3xl mx-auto space-y-2">
              {listFilteredAppointments.length === 0 ? (
                <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500">
                  <List className="h-12 w-12 mx-auto mb-3 text-stone-300" />
                  <p className="font-medium">Nenhum agendamento encontrado</p>
                  <p className="text-sm mt-1">Altere o filtro ou a busca.</p>
                </div>
              ) : (
                listFilteredAppointments.map(apt => {
                  const styles = getStatusStyles(apt.status);
                  const aptDate = new Date(apt.date);
                  const endDate = new Date(aptDate.getTime() + (apt.service.duration || 0) * 60000);
                  const isLocked = ['concluido', 'faturado'].includes(apt.status.toLowerCase());
                  const canCancel = ['agendado', 'confirmado'].includes(apt.status.toLowerCase());
                  return (
                    <div
                      key={apt.id}
                      className={`rounded-xl border ${styles.border} ${styles.bg} p-4 cursor-pointer hover:shadow-md transition-all flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4`}
                      onClick={() => setSelectedAppointment(apt)}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base border-2 ${styles.badge}`}>
                          {apt.customer.name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-stone-900 break-words">{apt.service.name}</p>
                          <p className="text-sm text-stone-600 break-words mt-0.5">{apt.customer.name}</p>
                          <p className="text-sm text-stone-500 mt-1.5" title={`${aptDate.toLocaleDateString('pt-BR', { weekday: 'long' })} · ${aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – ${endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}>
                            {aptDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })} · {aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {apt.professional && <p className="text-xs text-stone-500 mt-0.5">Prof. {apt.professional}</p>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-shrink-0 border-t border-stone-200/80 pt-3 sm:border-0 sm:pt-0">
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${styles.badge}`}>{apt.status}</span>
                        <span className="text-sm font-semibold text-stone-700">R$ {Number(apt.service.price).toFixed(2)}</span>
                        <div onClick={e => e.stopPropagation()}>
                          <ActionsMenu
                            alignRight
                            items={[
                              { icon: Info, label: 'Ver detalhes', onClick: () => setSelectedAppointment(apt) },
                              ...(apt.status.toLowerCase() === 'cancelado' ? [{ icon: CalendarClock, label: 'Reagendar', onClick: () => { setEditingAppointment(apt); setShowFormModal(true); } }] : !isLocked ? [{ icon: Pencil, label: 'Editar', onClick: () => { setEditingAppointment(apt); setShowFormModal(true); } }] : []),
                              ...(canCancel ? [{ icon: XCircle, label: 'Cancelar agendamento', onClick: () => { setCancelReasonAppointment(apt); setCancelReasonText(''); }, danger: true }] : []),
                              { icon: Trash2, label: 'Excluir', onClick: async () => {
                                const confirmed = await toast.confirm({ title: 'Excluir agendamento', message: 'Tem certeza?', type: 'danger', requirePassword: true });
                                if (confirmed) { await fetchAuth(`/api/appointments?id=${apt.id}`, { method: 'DELETE' }); fetchData(); }
                              }, danger: true }
                            ].filter(Boolean) as { icon: typeof Pencil; label: string; onClick: () => void; danger?: boolean }[]}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      <button onClick={() => { setEditingAppointment(null); setShowFormModal(true); }} className="fixed bottom-6 right-6 w-12 h-12 bg-stone-800 hover:bg-stone-700 text-amber-400 rounded-full shadow-lg hover:shadow-[0_0_16px_rgba(245,158,11,0.25)] border border-amber-600/50 flex items-center justify-center active:scale-95 transition-all z-50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2">
        <Plus className="h-7 w-7" />
      </button>

      {selectedAppointment && (() => {
        const apt = selectedAppointment;
        const statusStyles = getStatusStyles(apt.status);
        const startDate = new Date(apt.date);
        const startHour = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endDate = new Date(startDate.getTime() + (apt.service.duration || 0) * 60000);
        const endHour = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isLocked = ['concluido', 'faturado'].includes(apt.status.toLowerCase());
        const canCancel = ['agendado', 'confirmado'].includes(apt.status.toLowerCase());
        const actionItems = [
          ...(apt.status.toLowerCase() === 'cancelado' ? [{
            icon: CalendarClock,
            label: 'Reagendar',
            onClick: () => { setEditingAppointment(apt); setShowFormModal(true); setSelectedAppointment(null); }
          }] : !isLocked ? [{
            icon: Pencil,
            label: 'Editar',
            onClick: () => { setEditingAppointment(apt); setShowFormModal(true); setSelectedAppointment(null); }
          }] : []),
          ...(canCancel ? [{
            icon: XCircle,
            label: 'Cancelar agendamento',
            onClick: () => { setCancelReasonAppointment(apt); setCancelReasonText(''); setSelectedAppointment(null); },
            danger: true
          }] : []),
          {
            icon: Trash2,
            label: 'Excluir',
            onClick: async () => {
              const confirmed = await toast.confirm({
                title: 'Excluir agendamento',
                message: 'Tem certeza que deseja excluir este agendamento?',
                type: 'danger',
                requirePassword: true
              });
              if (confirmed) {
                await fetchAuth(`/api/appointments?id=${apt.id}`, { method: 'DELETE' });
                fetchData();
                setSelectedAppointment(null);
              }
            },
            danger: true
          }
        ].filter(Boolean) as { icon: typeof Pencil; label: string; onClick: () => void; danger?: boolean }[];
        return (
          <ModalBase
            isOpen={true}
            onClose={() => setSelectedAppointment(null)}
            title={apt.service.name}
            size="md"
            footer={
              <div className="flex flex-row gap-3 justify-end">
                {apt.status === 'agendado' && (
                  <>
                    {apt.customer.phone && (
                      <Button
                        type="button"
                        variant="secondary"
                        icon={MessageSquare}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const data = new Date(apt.date);
                          const dataStr = data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
                          const horaStr = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                          const prof = apt.professional ? ` Profissional: ${apt.professional}.` : '';
                          const message = `Olá, ${apt.customer.name}! ✨\n\nLembrando seu agendamento: *${apt.service.name}* no dia ${dataStr} às ${horaStr}.${prof}\n\nAguardamos você!`;
                          const phone = apt.customer.phone.replace(/\D/g, '');
                          const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                          window.open(whatsappUrl, '_blank');
                        }}
                      >
                        Lembrar cliente
                      </Button>
                    )}
                    <Button type="button" variant="primary" onClick={() => handleStatusUpdate(apt.id, 'confirmado')}>Confirmar agendamento</Button>
                  </>
                )}
                {apt.status === 'confirmado' && (
                  <>
                    {apt.customer.phone && (
                      <Button
                        type="button"
                        variant="secondary"
                        icon={MessageSquare}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const data = new Date(apt.date);
                          const dataStr = data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
                          const horaStr = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                          const prof = apt.professional ? ` Profissional: ${apt.professional}.` : '';
                          const message = `Olá, ${apt.customer.name}! ✨\n\nLembrando seu agendamento: *${apt.service.name}* no dia ${dataStr} às ${horaStr}.${prof}\n\nAguardamos você!`;
                          const phone = apt.customer.phone.replace(/\D/g, '');
                          const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                          window.open(whatsappUrl, '_blank');
                        }}
                      >
                        Lembrar cliente
                      </Button>
                    )}
                    <Button type="button" variant="primary" onClick={() => handleStatusUpdate(apt.id, 'concluido')}>Finalizar serviço</Button>
                  </>
                )}
                {apt.status === 'concluido' && (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      localStorage.setItem('pdv_appointment_data', JSON.stringify({
                        appointmentId: apt.id,
                        customerId: apt.customerId,
                        customerName: apt.customer.name,
                        serviceId: apt.serviceId,
                        serviceName: apt.service.name,
                        servicePrice: apt.service.price,
                        professional: apt.professional || ''
                      }));
                      setSelectedAppointment(null);
                      router.push('/admin/pdv');
                    }}
                  >
                    Faturar no PDV
                  </Button>
                )}
              </div>
            }
          >
            <div className="flex justify-end -mt-1 mb-4">
              <ActionsMenu items={actionItems} alignRight />
            </div>
            <div className="space-y-3">
              <div className={`rounded-xl border p-4 ${statusStyles.bg} ${statusStyles.border}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border-2 ${statusStyles.badge}`}>
                    {apt.customer.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">{apt.customer.name}</p>
                    {apt.customer.phone && <p className="text-sm text-stone-500">{apt.customer.phone}</p>}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Profissional</span>
                  <span className="font-medium text-stone-900">{apt.professional || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Valor</span>
                  <span className="font-semibold text-stone-900">R$ {Number(apt.service.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-500">Status</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${statusStyles.badge}`}>{apt.status}</span>
                </div>
              </div>
              {apt.notes && (
                <div className="rounded-xl border border-stone-200 bg-amber-50/30 p-4">
                  <p className="text-xs font-medium text-amber-800/80 mb-1">Observações</p>
                  <p className="text-sm text-stone-700">{apt.notes}</p>
                </div>
              )}
              {apt.status.toLowerCase() === 'cancelado' && apt.cancellationReason && (
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                  <p className="text-xs font-medium text-red-800/80 mb-1">Motivo do cancelamento</p>
                  <p className="text-sm text-stone-700">{apt.cancellationReason}</p>
                </div>
              )}
            </div>
          </ModalBase>
        );
      })()}

      {cancelReasonAppointment && (
        <ModalBase
          isOpen={true}
          onClose={() => { setCancelReasonAppointment(null); setCancelReasonText(''); }}
          title="Cancelar agendamento"
          size="sm"
          footer={
            <div className="flex flex-row gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={() => { setCancelReasonAppointment(null); setCancelReasonText(''); }}>Voltar</Button>
              <Button type="button" variant="danger" onClick={() => handleStatusUpdate(cancelReasonAppointment.id, 'cancelado', cancelReasonText)}>Confirmar cancelamento</Button>
            </div>
          }
        >
          <label className="block text-sm font-medium text-stone-700 mb-2">Motivo do cancelamento</label>
          <textarea
            value={cancelReasonText}
            onChange={e => setCancelReasonText(e.target.value)}
            placeholder="Ex.: Cliente desistiu, remarcado para outra data..."
            className="w-full rounded-xl border border-stone-300 p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
            rows={3}
          />
        </ModalBase>
      )}

      {showFormModal && (
        <AgendamentoModal
          customers={customers} services={services} professionals={professionals}
          agendamento={editingAppointment ? {
            id: editingAppointment.id, customerId: editingAppointment.customerId,
            serviceId: editingAppointment.serviceId, date: editingAppointment.date,
            professional: editingAppointment.professional || '', notes: editingAppointment.notes || ''
          } : undefined}
          onSave={async (data) => saveAppointment(data)}
          onClose={() => { setShowFormModal(false); setEditingAppointment(null); }}
        />
      )}
      </div>
    </>
  );
}
