"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useToast } from '@/hooks/useToast';
import AgendamentoModal from "@/components/AgendamentoModal";
import { 
  Trash2, Pencil, User, Plus, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, MessageSquare, Scissors, Info, AlertCircle, Lock
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
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);

  const [nowPosition, setNowPosition] = useState(0);
  const START_HOUR = 8;
  const END_HOUR = 22;
  const HOUR_HEIGHT = 140;

  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const dateStrip = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
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

  const getAppointmentLayout = (apt: Appointment) => {
    const start = new Date(apt.date).getTime();
    const end = start + (apt.service.duration * 60000);
    const overlaps = filteredAppointments.filter(other => {
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

  const getAptStyle = (dateStr: string, duration: number) => {
    const date = new Date(dateStr);
    const aptHour = date.getHours() + date.getMinutes() / 60;
    const top = (aptHour - START_HOUR) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;
    return { top: `${top}px`, height: `${height}px` };
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
    const end = start + (services.find((s:any) => s.id === data.serviceId)?.duration || 30) * 60000;
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

      <header className="bg-white border-b border-gray-100 pt-2 pb-1 flex-shrink-0">
        <div className="px-4 flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900 capitalize">
              {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <div className="relative flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full">
              <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
              <input 
                type="date" 
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  setSelectedDate(new Date(e.target.value + 'T00:00:00'));
                  isInitialLoad.current = true;
                }}
              />
            </div>
          </div>
          <div className="flex gap-0.5">
            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-md"><ChevronLeft className="h-4 w-4 text-gray-400"/></button>
            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-md"><ChevronRight className="h-4 w-4 text-gray-400"/></button>
          </div>
        </div>

        <div ref={scrollRef} className="flex overflow-x-auto no-scrollbar px-3 gap-2 pb-1 scroll-smooth">
          {dateStrip.map((date, i) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={i}
                data-selected={isSelected}
                onClick={() => setSelectedDate(new Date(date))}
                className={`flex flex-col items-center justify-center min-w-[42px] h-14 transition-all flex-shrink-0
                  ${isSelected ? 'bg-blue-600 text-white shadow-md rounded-b-2xl rounded-t-none' : 'bg-gray-50 text-gray-400 rounded-b-2xl rounded-t-none'}`}
              >
                <span className={`text-[8px] font-black uppercase mb-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                  {date.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 1)}
                </span>
                <span className="text-xs font-black">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 relative overflow-y-auto bg-white pb-24">
        <div className="relative w-full pt-6" style={{ height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT + 40}px` }}>
          <div className="absolute left-0 top-6 w-12 h-full border-r border-gray-50 z-10 bg-white/90 backdrop-blur-sm">
            {Array.from({ length: (END_HOUR - START_HOUR) * 2 + 1 }).map((_, i) => {
              const isHalfHour = i % 2 !== 0;
              const hour = START_HOUR + Math.floor(i / 2);
              const top = (i * HOUR_HEIGHT) / 2;
              return (
                <div key={i} className="absolute w-full text-center" style={{ top: `${top - 8}px` }}>
                  <span className={`font-black tracking-tighter ${isHalfHour ? 'text-[8px] text-gray-200' : 'text-[10px] text-gray-500'}`}>
                    {hour}:{isHalfHour ? '30' : '00'}
                  </span>
                </div>
              );
            })}
          </div>

          {Array.from({ length: (END_HOUR - START_HOUR) * 2 + 1 }).map((_, i) => (
            <div key={i} className={`absolute w-full border-t ${i % 2 === 0 ? 'border-gray-100' : 'border-gray-50 border-dashed'}`} style={{ top: `${(i * HOUR_HEIGHT) / 2 + 24}px` }} />
          ))}

          {nowPosition >= 0 && (
            <div className="absolute w-full z-20 flex items-center" style={{ top: `${nowPosition + 24}px` }}>
              <div className="w-2 h-2 bg-red-500 rounded-full ml-11 border border-white shadow-sm" />
              <div className="flex-1 border-t border-red-500/30" />
            </div>
          )}

          <div className="absolute left-12 right-0 h-full pt-6">
            {filteredAppointments.map(apt => {
              const styles = getStatusStyles(apt.status);
              const layout = getAppointmentLayout(apt);
              const isLocked = ['concluido', 'faturado'].includes(apt.status.toLowerCase());
              return (
                <div 
                  key={apt.id}
                  onClick={() => setSelectedAppointment(apt)}
                  className={`absolute rounded-2xl border-l-[5px] p-3 shadow-md cursor-pointer transition-all active:scale-[0.96] overflow-hidden flex flex-col
                    ${styles.bg} ${styles.border}`}
                  style={{ ...getAptStyle(apt.date, apt.service.duration), ...layout }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-[9px] font-black uppercase tracking-wider ${styles.text} opacity-60`}>
                      {new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase ${styles.badge}`}>
                      {apt.status}
                    </div>
                  </div>
                  <h3 className={`font-black text-xs leading-tight truncate mb-0.5 ${styles.text}`}>{apt.customer.name}</h3>
                  <p className={`text-[10px] font-bold truncate flex items-center gap-1 ${styles.text} opacity-80`}>
                    <Scissors className="h-3 w-3" /> {apt.service.name}
                  </p>
                  {apt.notes && (
                    <div className="mt-1 p-1.5 bg-black/5 rounded-lg border border-black/5">
                      <p className={`text-[9px] font-bold italic leading-tight ${styles.text} opacity-80 line-clamp-2`}>
                        "{apt.notes}"
                      </p>
                    </div>
                  )}
                  <div className="mt-auto pt-2 border-t border-black/5 flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <div className={`w-5 h-5 rounded-full ${styles.accent} flex items-center justify-center text-[8px] text-white font-black`}>
                        {apt.professional?.[0]}
                      </div>
                      <span className={`text-[9px] font-black ${styles.text} opacity-70`}>{apt.professional?.split(' ')[0]}</span>
                    </div>
                    <span className={`text-[10px] font-black ${styles.text}`}>R${apt.service.price}</span>
                  </div>
                  {isLocked && <div className="absolute top-1 right-1 opacity-20"><Lock className="h-3 w-3" /></div>}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <button onClick={() => { setEditingAppointment(null); setShowFormModal(true); }} className="fixed bottom-6 right-6 w-12 h-12 bg-black text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all z-50">
        <Plus className="h-7 w-7" />
      </button>

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end justify-center p-0" onClick={() => setSelectedAppointment(null)}>
          <div className="w-full max-w-md bg-white rounded-t-[32px] p-8 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-8" />
            <div className="flex items-center gap-5 mb-8">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl border-2 ${getStatusStyles(selectedAppointment.status).badge}`}>
                {selectedAppointment.customer.name[0]}
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedAppointment.customer.name}</h2>
                <p className="text-base font-bold text-blue-600">{selectedAppointment.service.name}</p>
              </div>
            </div>
            <div className="space-y-4">
              {selectedAppointment.status === 'agendado' && (
                <button onClick={() => handleStatusUpdate(selectedAppointment.id, 'confirmado')} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-all">Confirmar Agora</button>
              )}
              {selectedAppointment.status === 'confirmado' && (
                <button onClick={() => handleStatusUpdate(selectedAppointment.id, 'concluido')} className="w-full py-5 bg-sky-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-all">Finalizar Serviço</button>
              )}
              {selectedAppointment.status === 'concluido' && (
                <button onClick={() => {
                  localStorage.setItem('pdv_appointment_data', JSON.stringify({
                    appointmentId: selectedAppointment.id, customerId: selectedAppointment.customerId, customerName: selectedAppointment.customer.name,
                    serviceId: selectedAppointment.serviceId, serviceName: selectedAppointment.service.name, servicePrice: selectedAppointment.service.price,
                    professional: selectedAppointment.professional || ''
                  }));
                  window.location.href = '/admin/pdv';
                }} className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-all">Faturar no PDV</button>
              )}
              <div className="grid grid-cols-2 gap-4">
                {!['concluido', 'faturado'].includes(selectedAppointment.status.toLowerCase()) ? (
                  <button onClick={() => { setEditingAppointment(selectedAppointment); setShowFormModal(true); setSelectedAppointment(null); }} className="py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"><Pencil className="h-5 w-5"/> Editar</button>
                ) : (
                  <div className="py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-not-allowed"><Lock className="h-5 w-5"/> Bloqueado</div>
                )}
                <button onClick={() => { if(confirm('Excluir?')) { fetch(`/api/appointments?id=${selectedAppointment.id}`, { method: 'DELETE' }).then(() => { fetchData(); setSelectedAppointment(null); }); } }} className="py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"><Trash2 className="h-5 w-5"/> Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE STATUS: Z-INDEX MÁXIMO E FLUXO CORRIGIDO */}
      {showStatusConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[300] flex items-center justify-center p-6">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Confirmar Agendamento?</h3>
            <p className="text-gray-500 font-bold text-sm mb-8">Deseja salvar e já mudar o status para Confirmado ou manter apenas como Agendado?</p>
            <div className="space-y-3">
              <button onClick={() => saveAppointment(showStatusConfirm.data, 'confirmado')} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-base active:scale-95 transition-all">Salvar e Confirmar</button>
              <button onClick={() => saveAppointment(showStatusConfirm.data, 'agendado')} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-base active:scale-95 transition-all">Manter como Agendado</button>
            </div>
          </div>
        </div>
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
