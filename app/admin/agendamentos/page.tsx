"use client";

import { useState, useEffect } from "react";
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

  const [weekOffset, setWeekOffset] = useState(0);
  const dateStrip = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + (weekOffset * 7));
    return d;
  });

  useEffect(() => {
    fetchData();
    updateNowPosition();
    const interval = setInterval(updateNowPosition, 60000);
    return () => clearInterval(interval);
  }, [selectedDate, weekOffset]);

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

  // FUNÇÃO DE VALIDAÇÃO DE CONFLITO
  const checkConflict = (data: any, currentId: number | null) => {
    const newStart = new Date(data.date).getTime();
    const service = services.find((s: any) => s.id === parseInt(data.serviceId));
    if (!service) return false;
    const newEnd = newStart + ((service as any).duration * 60000);

    return appointments.some(apt => {
      if (apt.id === currentId) return false; // Ignora o próprio agendamento na edição
      if (apt.status === 'cancelado') return false; // Ignora cancelados
      if (apt.professional !== data.professional) return false; // Profissionais diferentes podem ter o mesmo horário

      const aptStart = new Date(apt.date).getTime();
      const aptEnd = aptStart + (apt.service.duration * 60000);

      // Verifica sobreposição de horários
      return (newStart < aptEnd && newEnd > aptStart);
    });
  };

  async function saveAppointment(data: any, statusOverride?: string) {
    const isEdit = editingAppointment !== null;
    
    // 1. Validação de Conflito
    if (checkConflict(data, isEdit ? editingAppointment!.id : null)) {
      toast.error(`Conflito: O profissional ${data.professional} já tem um agendamento neste horário!`);
      return;
    }

    let finalStatus = statusOverride || (isEdit ? editingAppointment!.status : 'agendado');

    // 2. Regra de Regressão: Se mudou data/hora de um 'confirmado', volta para 'agendado'
    if (isEdit && editingAppointment!.status === 'confirmado' && !statusOverride) {
      if (new Date(editingAppointment!.date).getTime() !== new Date(data.date).getTime()) {
        finalStatus = 'agendado';
        toast.info('Horário alterado: O status voltou para "Agendado" para nova confirmação.');
      }
    }
    
    const finalData = { ...data, status: finalStatus };
    const appointmentId = isEdit ? editingAppointment!.id : null;
    
    try {
      const res = await fetch('/api/appointments', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...finalData, id: appointmentId } : finalData)
      });
      
      if (res.ok) { 
        await fetchData(); 
        setShowFormModal(false); 
        setEditingAppointment(null);
        setShowStatusConfirm(null);
        toast.success('Agendamento salvo com sucesso!'); 
      }
    } catch (e) {
      toast.error('Erro ao salvar agendamento');
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      
      <header className="bg-white border-b border-gray-50 z-30 pt-4 pb-2">
        <div className="px-5 mb-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-gray-900 capitalize">
              {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <div className="relative flex items-center justify-center w-10 h-10 hover:bg-gray-50 rounded-full transition-colors">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <input 
                type="date" 
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="h-5 w-5 text-gray-500"/></button>
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="h-5 w-5 text-gray-500"/></button>
          </div>
        </div>

        <div className="grid grid-cols-7 px-2 gap-1.5">
          {dateStrip.map((date, i) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all
                  ${isSelected ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-50 text-gray-500'}`}
              >
                <span className={`text-[10px] font-black uppercase mb-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                  {date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').substring(0, 1)}
                </span>
                <span className="text-sm font-black">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 relative overflow-y-auto bg-white pb-24">
        <div className="relative w-full" style={{ height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` }}>
          
          <div className="absolute left-0 top-0 w-14 h-full border-r border-gray-50 z-10 bg-white/80 backdrop-blur-sm">
            {Array.from({ length: (END_HOUR - START_HOUR) * 2 + 1 }).map((_, i) => {
              const isHalfHour = i % 2 !== 0;
              const hour = START_HOUR + Math.floor(i / 2);
              const top = (i * HOUR_HEIGHT) / 2;
              return (
                <div key={i} className="absolute w-full text-center" style={{ top: `${top - 8}px` }}>
                  <span className={`font-black tracking-tighter ${isHalfHour ? 'text-[10px] text-gray-200' : 'text-[12px] text-gray-500'}`}>
                    {hour}:{isHalfHour ? '30' : '00'}
                  </span>
                </div>
              );
            })}
          </div>

          {Array.from({ length: (END_HOUR - START_HOUR) * 2 + 1 }).map((_, i) => (
            <div key={i} className="absolute w-full border-t border-gray-50" style={{ top: `${(i * HOUR_HEIGHT) / 2}px` }} />
          ))}

          {nowPosition >= 0 && (
            <div className="absolute w-full z-20 flex items-center" style={{ top: `${nowPosition}px` }}>
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full ml-12.5 border-2 border-white shadow-md" />
              <div className="flex-1 border-t-2 border-red-500/40" />
            </div>
          )}

          <div className="absolute left-14 right-0 h-full">
            {filteredAppointments.map(apt => {
              const styles = getStatusStyles(apt.status);
              const layout = getAppointmentLayout(apt);
              return (
                <div 
                  key={apt.id}
                  onClick={() => setSelectedAppointment(apt)}
                  className={`absolute rounded-2xl border-l-[6px] p-3 shadow-md cursor-pointer transition-all active:scale-[0.97] overflow-hidden flex flex-col
                    ${styles.bg} ${styles.border}`}
                  style={{ ...getAptStyle(apt.date, apt.service.duration), ...layout }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-[10px] font-black uppercase tracking-tight ${styles.text} opacity-70`}>
                      {new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className={`w-2 h-2 rounded-full ${styles.accent} shadow-sm`} />
                  </div>
                  
                  <h3 className={`font-black text-sm leading-tight truncate mb-0.5 ${styles.text}`}>{apt.customer.name}</h3>
                  
                  <p className={`text-[11px] font-black truncate flex items-center gap-1 mb-1 ${styles.text} opacity-80`}>
                    <Scissors className="h-3 w-3" /> {apt.service.name}
                  </p>

                  {apt.notes && (
                    <div className={`mt-1 p-1.5 rounded-lg bg-white/50 border border-black/5 flex items-start gap-1.5`}>
                      <Info className={`h-3 w-3 mt-0.5 flex-shrink-0 ${styles.text} opacity-60`} />
                      <p className={`text-[10px] font-bold leading-tight line-clamp-2 ${styles.text} opacity-80 italic`}>
                        {apt.notes}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-auto pt-2 border-t border-black/5 flex justify-between items-center">
                    <div className="flex items-center gap-1 overflow-hidden">
                      <User className={`h-3 w-3 flex-shrink-0 ${styles.text} opacity-60`} />
                      <span className={`text-[10px] font-black truncate ${styles.text} opacity-70`}>{apt.professional?.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-black ${styles.text}`}>R${apt.service.price}</span>
                      <span className={`text-[10px] font-bold opacity-50 ${styles.text}`}>{apt.service.duration}m</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <button 
        onClick={() => { setEditingAppointment(null); setShowFormModal(true); }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-50"
      >
        <Plus className="h-8 w-8" />
      </button>

      {/* BOTTOM SHEET DETALHES */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-end justify-center p-0 animate-in fade-in" onClick={() => setSelectedAppointment(null)}>
          <div className="w-full max-w-md bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
            
            {/* CABEÇALHO DO SHEET */}
            <div className="flex items-center gap-5 mb-8">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl border-2 ${getStatusStyles(selectedAppointment.status).badge}`}>
                {selectedAppointment.customer.name[0]}
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedAppointment.customer.name}</h2>
                <p className="text-base font-bold text-blue-600">{selectedAppointment.service.name}</p>
              </div>
            </div>

            {/* NOTAS */}
            {selectedAppointment.notes && (
              <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase mb-2 flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" /> Observação
                </p>
                <p className="text-sm font-bold text-gray-700 leading-relaxed italic">"{selectedAppointment.notes}"</p>
              </div>
            )}

            {/* AÇÕES DINÂMICAS COM REGRAS DE NEGÓCIO */}
            <div className="space-y-4">
              {selectedAppointment.status === 'agendado' && (
                <button onClick={() => handleStatusUpdate(selectedAppointment.id, 'confirmado')} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-200 active:scale-95 transition-transform">Confirmar Agendamento</button>
              )}
              {selectedAppointment.status === 'confirmado' && (
                <button onClick={() => handleStatusUpdate(selectedAppointment.id, 'concluido')} className="w-full py-5 bg-sky-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-sky-200 active:scale-95 transition-transform">Finalizar Serviço</button>
              )}
              {selectedAppointment.status === 'concluido' && (
                <button onClick={() => {
                  localStorage.setItem('pdv_appointment_data', JSON.stringify({
                    appointmentId: selectedAppointment.id, customerId: selectedAppointment.customerId, customerName: selectedAppointment.customer.name,
                    serviceId: selectedAppointment.serviceId, serviceName: selectedAppointment.service.name, servicePrice: selectedAppointment.service.price,
                    professional: selectedAppointment.professional || ''
                  }));
                  window.location.href = '/admin/pdv';
                }} className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-violet-200 active:scale-95 transition-transform">Faturar no PDV</button>
              )}

              {/* REGRAS DE EDIÇÃO/EXCLUSÃO */}
              <div className="grid grid-cols-2 gap-4">
                {['agendado', 'confirmado'].includes(selectedAppointment.status) ? (
                  <button 
                    onClick={() => { setEditingAppointment(selectedAppointment); setShowFormModal(true); setSelectedAppointment(null); }} 
                    className="py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Pencil className="h-5 w-5"/> Editar
                  </button>
                ) : (
                  <div className="py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-60">
                    <Lock className="h-5 w-5"/> Bloqueado
                  </div>
                )}
                
                <button 
                  onClick={() => { if(confirm('Deseja realmente excluir este agendamento?')) { fetch(`/api/appointments?id=${selectedAppointment.id}`, { method: 'DELETE' }).then(() => { fetchData(); setSelectedAppointment(null); }); } }} 
                  className="py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Trash2 className="h-5 w-5"/> Excluir
                </button>
              </div>

              {/* AVISO DE BLOQUEIO */}
              {['concluido', 'faturado'].includes(selectedAppointment.status) && (
                <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest mt-2">
                  Serviços finalizados não podem ser editados
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE STATUS */}
      {showStatusConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="h-10 w-10 text-amber-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 text-center mb-3">Confirmar Agora?</h3>
            <p className="text-base font-bold text-gray-500 text-center mb-10 leading-relaxed">
              Deseja já mudar o status para <span className="text-emerald-600 font-black">Confirmado</span> ou manter como Agendado?
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => saveAppointment(showStatusConfirm.data, 'confirmado')}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 active:scale-95 transition-transform"
              >
                Salvar e Confirmar
              </button>
              <button 
                onClick={() => saveAppointment(showStatusConfirm.data)}
                className="w-full py-5 bg-gray-100 text-gray-700 rounded-2xl font-black text-lg active:scale-95 transition-transform"
              >
                Apenas Salvar
              </button>
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
          onSave={async (data) => {
            if (editingAppointment && editingAppointment.status === 'agendado') {
              setShowFormModal(false);
              setShowStatusConfirm({ show: true, data });
            } else {
              saveAppointment(data);
            }
          }}
          onClose={() => { setShowFormModal(false); setEditingAppointment(null); }}
        />
      )}
    </div>
  );
}
