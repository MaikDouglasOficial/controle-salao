"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useToast } from '@/hooks/useToast';
import AgendamentoModal from "@/components/AgendamentoModal";
import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { 
  Trash2, Pencil, User, Plus, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, MessageSquare, Scissors, Info, AlertCircle, Lock,
  CalendarDays, LayoutGrid, List
} from "lucide-react";

interface Appointment {
  id: number;
  customerId: number;
  serviceId: number;
  date: string;
  status: string;
  professional: string | null;
  notes: string | null;
  customer: { id: number; name: string; phone: string; };
  service: { id: number; name: string; duration: number; price: number; };
}

export default function AgendamentosPage() {
  const toast = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showStatusConfirm, setShowStatusConfirm] = useState<{show: boolean, data: any} | null>(null);
  
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState<{id: number; name: string; duration: number; price: number;}[]>([]);
  const [professionals, setProfessionals] = useState([]);

  const [viewMode, setViewMode] = useState<'day' | 'month' | 'list'>('day');
  const [listFilter, setListFilter] = useState<'all' | 'month' | 'day'>('month');
  const [listSearch, setListSearch] = useState('');
  const [nowPosition, setNowPosition] = useState(0);
  const START_HOUR = 8;
  const END_HOUR = 22;
  const HOUR_HEIGHT = 80;

  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const dateStrip = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  }, [selectedDate.getMonth(), selectedDate.getFullYear()]);

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
  }, [selectedDate.getMonth(), selectedDate.getFullYear()]);

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
    try {
      const [c, s, p, a] = await Promise.all([
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/services').then(r => r.json()),
        fetch('/api/professionals').then(r => r.json()),
        fetch('/api/appointments').then(r => r.json())
      ]);
      setCustomers(c);
      setServices(s);
      setProfessionals(p.filter((prof: any) => prof.active).map((prof: any) => prof.name));
      setAppointments(a);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  const filteredAppointments = appointments.filter(apt => {
    const d = new Date(apt.date);
    return d.toDateString() === selectedDate.toDateString();
  });

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach(apt => {
      const key = new Date(apt.date).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    });
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    return map;
  }, [appointments]);

  const listFilteredAppointments = useMemo(() => {
    let list = [...appointments];
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
  }, [appointments, listFilter, listSearch, selectedDate]);

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
      case 'cancelado': return { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-800', badge: 'bg-gray-200 text-gray-800', accent: 'bg-gray-500' };
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

  async function handleStatusUpdate(id: number, newStatus: string) {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;
    try {
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...apt, status: newStatus })
      });
      if (res.ok) { await fetchData(); setSelectedAppointment(null); toast.success(`Status: ${newStatus}`); }
    } catch (e) { toast.error('Erro ao atualizar'); }
  }

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    newDate.setDate(1);
    setSelectedDate(newDate);
    isInitialLoad.current = true;
  };

  async function saveAppointment(data: any, statusOverride?: string) {
    const isEdit = editingAppointment !== null;
    
    const start = new Date(data.date).getTime();
    const foundService = services.find((s: any) => s.id === Number(data.serviceId));
    const duration = foundService && typeof foundService.duration === 'number' ? foundService.duration : 30;
    const end = start + duration * 60000;
    const conflict = appointments.find(apt => {
      if (isEdit && apt.id === editingAppointment!.id) return false;
      if (apt.professional !== data.professional) return false;
      const aptStart = new Date(apt.date).getTime();
      const aptEnd = aptStart + (apt.service.duration * 60000);
      return (start < aptEnd && end > aptStart);
    });

    if (conflict) {
      toast.error(`Conflito: ${data.professional} já tem agendamento neste horário!`);
      return;
    }

    let finalStatus = statusOverride || (isEdit ? editingAppointment!.status : 'agendado');
    
    if (isEdit && editingAppointment!.status === 'confirmado' && editingAppointment!.date !== data.date) {
      finalStatus = 'agendado';
      toast.info('Horário alterado: Status resetado para Agendado');
    }

    // CORREÇÃO DE FLUXO: Fecha o modal de edição ANTES de mostrar a confirmação
    if (finalStatus === 'agendado' && !statusOverride) {
      setShowFormModal(false); // Fecha o modal de edição primeiro
      setTimeout(() => {
        setShowStatusConfirm({ show: true, data });
      }, 100); // Pequeno atraso para garantir que o modal sumiu
      return;
    }

    const finalData = { ...data, status: finalStatus };
    try {
      const res = await fetch('/api/appointments', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...finalData, id: editingAppointment!.id } : finalData)
      });
      if (res.ok) { 
        await fetchData(); 
        setShowFormModal(false); 
        setEditingAppointment(null);
        setShowStatusConfirm(null);
        toast.success('Salvo!'); 
      }
    } catch (e) { toast.error('Erro ao salvar'); }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="page-container flex-shrink-0 pt-4 pb-2 border-b border-stone-100 bg-white page-header">
        <h1 className="page-title">Agendamentos</h1>
        <p className="page-subtitle">Calendário e agenda</p>
      </div>

      <header className="bg-white border-b border-stone-100 pt-2 pb-2 flex-shrink-0">
        <div className="px-4 flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex rounded-xl bg-stone-100 p-1 flex-wrap gap-0.5">
            {[
              { id: 'day' as const, label: 'Dia', icon: CalendarDays },
              { id: 'month' as const, label: 'Mês', icon: LayoutGrid },
              { id: 'list' as const, label: 'Lista', icon: List }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === id ? 'bg-white text-amber-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {viewMode !== 'list' && (
              <>
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors"><ChevronLeft className="h-4 w-4 text-stone-500"/></button>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors"><ChevronRight className="h-4 w-4 text-stone-500"/></button>
              </>
            )}
          </div>
        </div>

        {viewMode === 'day' && (
          <>
            <div className="px-4 flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-stone-700 capitalize">
                {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <div className="relative flex items-center justify-center w-8 h-8 bg-amber-50 rounded-lg border border-amber-200/60">
                <CalendarIcon className="h-4 w-4 text-amber-600" />
                <input
                  type="date"
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer rounded-lg"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => { setSelectedDate(new Date(e.target.value + 'T00:00:00')); isInitialLoad.current = true; }}
                />
              </div>
            </div>
            <div ref={scrollRef} className="flex overflow-x-auto no-scrollbar px-3 gap-2 pb-1 scroll-smooth">
              {dateStrip.map((date, i) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const count = (appointmentsByDate[date.toDateString()] || []).length;
                return (
                  <button
                    key={i}
                    data-selected={isSelected}
                    onClick={() => setSelectedDate(new Date(date))}
                    className={`flex flex-col items-center justify-center min-w-[44px] h-14 transition-all flex-shrink-0 rounded-xl ${
                      isSelected ? 'bg-amber-500 text-white shadow-md' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-amber-100' : 'text-stone-400'}`}>
                      {date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                    </span>
                    <span className="text-sm font-bold">{date.getDate()}</span>
                    {count > 0 && <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-amber-200' : 'text-amber-600'}`}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {viewMode === 'month' && (
          <div className="px-4 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-stone-700 capitalize">
              {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
            <button
              type="button"
              onClick={() => { const t = new Date(); setSelectedDate(t); }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
            >
              Hoje
            </button>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="px-4 space-y-2">
            <input
              type="text"
              placeholder="Buscar..."
              value={listSearch}
              onChange={e => setListSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-50/80 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300 focus:border-stone-300"
            />
            <div className="flex gap-1 p-0.5 bg-stone-100 rounded-lg">
              {[
                { id: 'day' as const, label: 'Dia' },
                { id: 'month' as const, label: 'Mês' },
                { id: 'all' as const, label: 'Todos' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setListFilter(id)}
                  className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors min-h-[40px] ${
                    listFilter === id ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {listFilter === 'day' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => changeDay(-1)}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                  aria-label="Dia anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <label className="flex-1 min-h-[40px] flex flex-col justify-center rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-center">
                  <input
                    type="date"
                    className="w-full text-sm text-stone-700 bg-transparent focus:outline-none focus:ring-0 text-center"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={e => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
                  />
                  <span className="text-[11px] text-stone-400 capitalize block">
                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => changeDay(1)}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                  aria-label="Próximo dia"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
            {listFilter === 'month' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex-1 min-h-[40px] flex items-center justify-center px-2">
                  <span className="text-sm text-stone-600 capitalize text-center">
                    {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date())}
                  className="flex-shrink-0 py-2 px-2.5 rounded-lg text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-700 min-h-[40px]"
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
                    className={`absolute rounded-xl border-l-4 p-2.5 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98] overflow-hidden flex flex-col box-border ${styles.bg} ${styles.border}`}
                    style={{ ...aptStyle, left: layout.left, width: layout.width }}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <p className={`text-[9px] font-bold uppercase ${styles.text} opacity-70`}>
                        {new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-bold uppercase ${styles.badge}`}>{apt.status}</span>
                    </div>
                    <p className={`text-[10px] font-semibold truncate flex items-center gap-1 ${styles.text}`}>
                      <Scissors className="h-3 w-3 flex-shrink-0" /> {apt.service.name}
                    </p>
                    <div className="mt-auto pt-1.5 border-t border-black/5 flex justify-between items-center">
                      <span className={`text-[9px] font-medium ${styles.text} opacity-80`}>{apt.professional?.split(' ')[0]}</span>
                      <span className={`text-[10px] font-semibold ${styles.text}`}>R$ {Number(apt.service.price).toFixed(0)}</span>
                    </div>
                    {isLocked && <div className="absolute top-1 right-1 opacity-20"><Lock className="h-3 w-3" /></div>}
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
                              ? 'bg-amber-100 ring-1 ring-amber-300 ring-inset hover:bg-amber-100'
                              : isToday
                                ? 'bg-amber-50 hover:bg-amber-100/50'
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
                                ? 'bg-amber-500 text-white'
                                : isSelected
                                  ? 'text-amber-800'
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
                  return (
                    <div
                      key={apt.id}
                      className={`rounded-xl border ${styles.border} ${styles.bg} p-4 flex flex-wrap items-start gap-3 sm:gap-4 cursor-pointer hover:shadow-md transition-all group`}
                      onClick={() => setSelectedAppointment(apt)}
                    >
                      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base border-2 ${styles.badge}`}>
                        {apt.customer.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-900 truncate">{apt.service.name}</p>
                        <p className="text-sm text-stone-600 truncate mt-0.5">{apt.customer.name}</p>
                        <p className="text-xs text-stone-500 mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis" title={`${aptDate.toLocaleDateString('pt-BR', { weekday: 'long' })} · ${aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – ${endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}>
                          {aptDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })} · {aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {apt.professional && <p className="text-xs text-stone-400 mt-0.5 truncate">Prof. {apt.professional}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${styles.badge}`}>{apt.status}</span>
                        <span className="text-sm font-semibold text-stone-700">R$ {Number(apt.service.price).toFixed(2)}</span>
                        <div onClick={e => e.stopPropagation()}>
                          <ActionsMenu
                            alignRight
                            items={[
                              { icon: Info, label: 'Ver detalhes', onClick: () => setSelectedAppointment(apt) },
                              ...(!isLocked ? [{ icon: Pencil, label: 'Editar', onClick: () => { setEditingAppointment(apt); setShowFormModal(true); } }] : []),
                              { icon: Trash2, label: 'Excluir', onClick: async () => {
                                const confirmed = await toast.confirm({ title: 'Excluir agendamento', message: 'Tem certeza?', type: 'danger', requirePassword: true });
                                if (confirmed) { await fetch(`/api/appointments?id=${apt.id}`, { method: 'DELETE' }); fetchData(); }
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

      <button onClick={() => { setEditingAppointment(null); setShowFormModal(true); }} className="fixed bottom-6 right-6 w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center active:scale-95 transition-all z-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2">
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
        const actionItems = [
          ...(!isLocked ? [{
            icon: Pencil,
            label: 'Editar',
            onClick: () => { setEditingAppointment(apt); setShowFormModal(true); setSelectedAppointment(null); }
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
                await fetch(`/api/appointments?id=${apt.id}`, { method: 'DELETE' });
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
            subtitle={`${startHour} - ${endHour} • ${apt.status}`}
            size="md"
            footer={
              <div className="flex flex-col gap-3 w-full">
                {apt.status === 'agendado' && (
                  <Button variant="success" fullWidth onClick={() => handleStatusUpdate(apt.id, 'confirmado')}>Confirmar agendamento</Button>
                )}
                {apt.status === 'confirmado' && (
                  <Button variant="blue-dark" fullWidth onClick={() => handleStatusUpdate(apt.id, 'concluido')}>Finalizar serviço</Button>
                )}
                {apt.status === 'concluido' && (
                  <Button variant="primary" fullWidth onClick={() => {
                    localStorage.setItem('pdv_appointment_data', JSON.stringify({
                      appointmentId: apt.id, customerId: apt.customerId, customerName: apt.customer.name,
                      serviceId: apt.serviceId, serviceName: apt.service.name, servicePrice: apt.service.price,
                      professional: apt.professional || ''
                    }));
                    window.location.href = '/admin/pdv';
                  }}>Faturar no PDV</Button>
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
            </div>
          </ModalBase>
        );
      })()}

      {/* Confirmação de status — padrão ModalBase + Button */}
      {showStatusConfirm && (
        <ModalBase
          isOpen={true}
          onClose={() => setShowStatusConfirm(null)}
          title="Confirmar alteração de status"
          subtitle="O agendamento será marcado como confirmado."
          size="sm"
          footer={
            <div className="flex gap-3 w-full">
              <Button variant="secondary" onClick={() => setShowStatusConfirm(null)} className="flex-1">Cancelar</Button>
              <Button variant="primary" onClick={() => saveAppointment(showStatusConfirm.data, 'confirmado')} className="flex-1">Confirmar</Button>
            </div>
          }
        >
          <p className="text-stone-600 text-sm text-center">Tem certeza que deseja alterar o status deste agendamento para confirmado?</p>
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
  );
}
