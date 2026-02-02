"use client";

import { useState, useEffect } from "react";
import { useToast } from '@/hooks/useToast';
import AgendamentoModal from "@/components/AgendamentoModal";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, Trash2, ShoppingCart, Pencil } from "lucide-react";
import AgendaCalendar from "@/components/AgendaCalendar";
import { ModalBase } from "@/components/ui/ModalBase";

interface Appointment {
  id: number;
  customerId: number;
  serviceId: number;
  date: string;
  status: string;
  professional: string | null;
  notes: string | null;
  customer: {
    id: number;
    name: string;
    phone: string;
    photo?: string;
  };
  service: {
    id: number;
    name: string;
    duration: number;
    price: number;
  };
}

export default function AgendamentosPage() {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'agendado' | 'confirmado' | 'concluido' | 'cancelado'>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [customersRes, servicesRes, professionalsRes, appointmentsRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/services'),
        fetch('/api/professionals'),
        fetch('/api/appointments')
      ]);

      const customersData = await customersRes.json();
      const servicesData = await servicesRes.json();
      const professionalsData = await professionalsRes.json();
      const appointmentsData = await appointmentsRes.json();

      setCustomers(customersData);
      setServices(servicesData);
      setProfessionals(professionalsData.filter((p: any) => p.active).map((p: any) => p.name));
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(agendamento: any) {
    try {
      console.log('Enviando agendamento:', agendamento);
      
      const isEditing = editingAppointment !== null;
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing ? { ...agendamento, id: editingAppointment.id } : agendamento;
      
      const response = await fetch('/api/appointments', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      console.log('Resposta da API:', data);

      if (response.ok) {
        setShowModal(false);
        setEditingAppointment(null);
        toast.success(isEditing ? 'Agendamento atualizado com sucesso!' : 'Agendamento criado com sucesso!');
        fetchData(); // Recarregar lista
      } else {
        console.error('Erro da API:', data);
        toast.error(data.error || `Erro ao ${isEditing ? 'atualizar' : 'criar'} agendamento`);
      }
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error('Erro ao salvar agendamento. Verifique o console para mais detalhes.');
    }
  }

  function handleEditar(appointment: Appointment) {
    setEditingAppointment(appointment);
    setShowModal(true);
  }

  async function handleConfirmar(id: number) {
    const confirmed = await toast.confirm({
      title: 'Confirmar agendamento',
      message: 'Confirmar este agendamento?\n\nApós confirmar, você poderá finalizar o serviço quando for realizado.',
      type: 'info'
    });
    if (!confirmed) return;
    
    try {
      const appointment = appointments.find(a => a.id === id);
      if (!appointment) return;

      // Validar que está agendado
      if (appointment.status !== 'agendado') {
        toast.error('ATENÇÃO: Este agendamento já foi processado!');
        return;
      }

      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...appointment,
          status: 'confirmado'
        })
      });

      if (response.ok) {
        toast.success('Agendamento confirmado!\n\nQuando o serviço for realizado, clique em "Finalizar Serviço".');
        fetchData();
      } else {
        toast.error('ERRO: Não foi possível confirmar agendamento');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('ERRO: Não foi possível confirmar agendamento');
    }
  }

  async function handleConcluir(id: number) {
    const confirmed = await toast.confirm({
      title: 'Finalizar serviço',
      message: 'Confirmar que o serviço foi finalizado?\n\nApós confirmar, você poderá ir para o PDV para faturamento.',
      type: 'info'
    });
    if (!confirmed) return;
    
    try {
      const appointment = appointments.find(a => a.id === id);
      if (!appointment) return;

      // Validar que está confirmado
      if (appointment.status !== 'confirmado') {
        toast.error('ATENÇÃO: Este agendamento precisa estar confirmado primeiro!');
        return;
      }

      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...appointment,
          status: 'concluido'
        })
      });

      if (response.ok) {
        toast.success('Serviço finalizado com sucesso!\n\nAgora você pode ir para o PDV para faturamento.');
        fetchData();
      } else {
        toast.error('ERRO: Não foi possível finalizar serviço');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('ERRO: Não foi possível finalizar serviço');
    }
  }

  async function handleCancelar(id: number) {
    const confirmed = await toast.confirm({
      title: 'Cancelar agendamento',
      message: 'Deseja cancelar este agendamento?',
      type: 'warning'
    });
    if (!confirmed) return;
    
    try {
      const appointment = appointments.find(a => a.id === id);
      if (!appointment) return;

      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...appointment,
          status: 'cancelado'
        })
      });

      if (response.ok) {
        toast.success('Agendamento cancelado!');
        fetchData();
      } else {
        toast.error('Erro ao cancelar agendamento');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao cancelar agendamento');
    }
  }

  async function handleExcluir(id: number) {
    const confirmed = await toast.confirm({
      title: 'Excluir agendamento',
      message: 'Deseja realmente excluir este agendamento? Esta ação não pode ser desfeita.',
      type: 'danger'
    });
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/appointments?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Agendamento excluído!');
        fetchData();
      } else {
        toast.error('Erro ao excluir agendamento');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao excluir agendamento');
    }
  }

  function handleIrParaPDV(appointment: Appointment) {
    // Verificar se o serviço foi concluído
    if (appointment.status !== 'concluido') {
      toast.error('O serviço precisa ser finalizado antes de ir para o PDV!');
      return;
    }

    // Salvar dados do agendamento no localStorage para usar no PDV
    localStorage.setItem('pdv_appointment_data', JSON.stringify({
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      customerName: appointment.customer.name,
      serviceId: appointment.serviceId,
      serviceName: appointment.service.name,
      servicePrice: appointment.service.price,
      professional: appointment.professional || ''
    }));
    
    // Redirecionar para PDV
    window.location.href = '/admin/pdv';
  }

  const filteredAppointments = appointments.filter(apt => {
    if (filterStatus === 'all') return true;
    return apt.status === filterStatus;
  });

  const calendarAppointments = filteredAppointments.map((appointment) => ({
    id: appointment.id,
    dataHora: appointment.date,
    cliente: { nome: appointment.customer.name },
    servico: { nome: appointment.service.name, duracaoMinutos: appointment.service.duration },
    status: appointment.status,
    profissional: appointment.professional,
  }));

  function handleSelectCalendarEvent(event: { id: number }) {
    const appointment = appointments.find((apt) => apt.id === event.id) || null;
    setSelectedAppointment(appointment);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Agendamentos
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie seus agendamentos
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto"
          >
            Novo Agendamento
          </Button>
        </div>

        {/* Calendário de Agendamentos */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <AgendaCalendar agendamentos={calendarAppointments} onSelectEvent={handleSelectCalendarEvent} />
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              onClick={() => setFilterStatus('all')}
              className={`w-full sm:w-auto px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap text-white border shadow-sm hover:shadow-md ${
                filterStatus === 'all'
                  ? 'bg-slate-900 border-slate-900'
                  : 'bg-slate-700 border-slate-700'
              }`}
            >
              Todos ({appointments.length})
            </button>
            <button
              onClick={() => setFilterStatus('agendado')}
              className={`w-full sm:w-auto px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap text-white border shadow-sm hover:shadow-md ${
                filterStatus === 'agendado'
                  ? 'bg-orange-600 border-orange-600'
                  : 'bg-orange-500 border-orange-500'
              }`}
            >
              Agendados ({appointments.filter(a => a.status === 'agendado').length})
            </button>
            <button
              onClick={() => setFilterStatus('confirmado')}
              className={`w-full sm:w-auto px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap text-white border shadow-sm hover:shadow-md ${
                filterStatus === 'confirmado'
                  ? 'bg-green-600 border-green-600'
                  : 'bg-green-500 border-green-500'
              }`}
            >
              Confirmados ({appointments.filter(a => a.status === 'confirmado').length})
            </button>
            <button
              onClick={() => setFilterStatus('concluido')}
              className={`w-full sm:w-auto px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap text-white border shadow-sm hover:shadow-md ${
                filterStatus === 'concluido'
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-blue-500 border-blue-500'
              }`}
            >
              Concluídos ({appointments.filter(a => a.status === 'concluido').length})
            </button>
            <button
              onClick={() => setFilterStatus('cancelado')}
              className={`w-full sm:w-auto px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap text-white border shadow-sm hover:shadow-md ${
                filterStatus === 'cancelado'
                  ? 'bg-red-600 border-red-600'
                  : 'bg-red-500 border-red-500'
              }`}
            >
              Cancelados ({appointments.filter(a => a.status === 'cancelado').length})
            </button>
          </div>
        </div>

      <ModalBase
        isOpen={Boolean(selectedAppointment)}
        onClose={() => setSelectedAppointment(null)}
        title="Ações do agendamento"
        size="md"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-4 bg-white">
              <div className="text-sm font-semibold text-gray-900">
                {selectedAppointment.service.name} - {selectedAppointment.customer.name}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {new Date(selectedAppointment.date).toLocaleDateString('pt-BR')} às{' '}
                {new Date(selectedAppointment.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {selectedAppointment.professional && (
                <div className="mt-1 text-xs text-gray-500">
                  Profissional: {selectedAppointment.professional}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {(selectedAppointment.status === 'agendado' || selectedAppointment.status === 'confirmado') && (
                <Button
                  onClick={() => {
                    setSelectedAppointment(null);
                    handleEditar(selectedAppointment);
                  }}
                  variant="edit"
                  size="sm"
                  icon={Pencil}
                >
                  Editar
                </Button>
              )}

              {selectedAppointment.status === 'agendado' && (
                <Button
                  onClick={() => {
                    handleConfirmar(selectedAppointment.id);
                    setSelectedAppointment(null);
                  }}
                  variant="orange"
                  size="sm"
                  icon={CheckCircle}
                >
                  Confirmar
                </Button>
              )}

              {selectedAppointment.status === 'confirmado' && (
                <Button
                  onClick={() => {
                    handleConcluir(selectedAppointment.id);
                    setSelectedAppointment(null);
                  }}
                  variant="success"
                  size="sm"
                  icon={CheckCircle}
                >
                  Concluir
                </Button>
              )}

              {selectedAppointment.status === 'concluido' && (
                <Button
                  onClick={() => {
                    handleIrParaPDV(selectedAppointment);
                    setSelectedAppointment(null);
                  }}
                  variant="blue-dark"
                  size="sm"
                  icon={ShoppingCart}
                >
                  PDV
                </Button>
              )}

              {selectedAppointment.status !== 'cancelado' && selectedAppointment.status !== 'concluido' && (
                <Button
                  onClick={() => {
                    handleCancelar(selectedAppointment.id);
                    setSelectedAppointment(null);
                  }}
                  variant="dark"
                  size="sm"
                  icon={XCircle}
                >
                  Cancelar
                </Button>
              )}

              <Button
                onClick={() => {
                  handleExcluir(selectedAppointment.id);
                  setSelectedAppointment(null);
                }}
                variant="danger"
                size="sm"
                icon={Trash2}
              >
                Excluir
              </Button>
            </div>
          </div>
        )}
      </ModalBase>

      {/* Modal de Novo/Editar Agendamento */}
      {showModal && (
        <AgendamentoModal
          customers={customers}
          services={services}
          professionals={professionals}
          agendamento={editingAppointment ? {
            id: editingAppointment.id,
            customerId: editingAppointment.customerId,
            serviceId: editingAppointment.serviceId,
            date: editingAppointment.date,
            professional: editingAppointment.professional || '',
            notes: editingAppointment.notes || ''
          } : undefined}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingAppointment(null);
          }}
        />
      )}
    </div>
  );
}
