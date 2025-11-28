"use client";

import { useState, useEffect } from "react";
import { useToast } from '@/hooks/useToast';
import AgendamentoModal from "@/components/AgendamentoModal";
import { Button } from "@/components/ui/Button";
import { Plus, Calendar, CheckCircle, XCircle, Trash2, ShoppingCart, Clock, User, Scissors, Edit } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Image from 'next/image';

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

  const getStatusBadge = (status: string) => {
    const badges = {
      agendado: 'bg-blue-100 text-blue-800',
      confirmado: 'bg-green-100 text-green-800',
      concluido: 'bg-gray-100 text-gray-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      agendado: 'Agendado',
      confirmado: 'Confirmado',
      concluido: 'Concluído',
      cancelado: 'Cancelado'
    };
    
    return (
      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
            icon={Plus}
            className="w-full sm:w-auto"
          >
            Novo Agendamento
          </Button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Todos ({appointments.length})
            </button>
            <button
              onClick={() => setFilterStatus('agendado')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'agendado'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Agendados ({appointments.filter(a => a.status === 'agendado').length})
            </button>
            <button
              onClick={() => setFilterStatus('confirmado')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'confirmado'
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Confirmados ({appointments.filter(a => a.status === 'confirmado').length})
            </button>
            <button
              onClick={() => setFilterStatus('concluido')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'concluido'
                  ? 'bg-purple-50 text-purple-600 border border-purple-200'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Concluídos ({appointments.filter(a => a.status === 'concluido').length})
            </button>
            <button
              onClick={() => setFilterStatus('cancelado')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'cancelado'
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cancelados ({appointments.filter(a => a.status === 'cancelado').length})
            </button>
          </div>
        </div>

        {/* Lista de Agendamentos */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <>
            {/* Desktop - Tabela */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profissional</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(appointment.date).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(appointment.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {appointment.customer.photo ? (
                              <Image
                                src={appointment.customer.photo}
                                alt={appointment.customer.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{appointment.customer.name}</div>
                            <div className="text-xs text-gray-500">{appointment.customer.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Scissors className="h-3 w-3 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{appointment.service.name}</div>
                            <div className="text-xs text-gray-500">{appointment.service.duration} min</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {appointment.professional || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(appointment.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* SEQUÊNCIA OBRIGATÓRIA: agendado → confirmado → concluido → PDV */}
                          
                          {/* 1. Editar - disponível para agendado e confirmado */}
                          {(appointment.status === 'agendado' || appointment.status === 'confirmado') && (
                            <Button
                              onClick={() => handleEditar(appointment)}
                              variant="ghost"
                              size="sm"
                              icon={Edit}
                              title="Editar"
                            />
                          )}
                          
                          {/* 2. Confirmar - PRIMEIRO PASSO (apenas para agendado) */}
                          {appointment.status === 'agendado' && (
                            <Button
                              onClick={() => handleConfirmar(appointment.id)}
                              variant="ghost"
                              size="sm"
                              icon={CheckCircle}
                              title="Passo 1: Confirmar Agendamento"
                            />
                          )}
                          
                          {/* 3. Finalizar Serviço - SEGUNDO PASSO (apenas para confirmado) */}
                          {appointment.status === 'confirmado' && (
                            <Button
                              onClick={() => handleConcluir(appointment.id)}
                              variant="ghost"
                              size="sm"
                              icon={CheckCircle}
                              title="Passo 2: Finalizar Serviço"
                            />
                          )}
                          
                          {/* 4. Ir para PDV - TERCEIRO PASSO (apenas para concluído) */}
                          {appointment.status === 'concluido' && (
                            <Button
                              onClick={() => handleIrParaPDV(appointment)}
                              variant="ghost"
                              size="sm"
                              icon={ShoppingCart}
                              title="🛒 Passo 3: Ir para PDV e Faturar"
                            />
                          )}
                          
                          {/* Cancelar - não disponível para concluído e cancelado */}
                          {appointment.status !== 'cancelado' && appointment.status !== 'concluido' && (
                            <Button
                              onClick={() => handleCancelar(appointment.id)}
                              variant="ghost"
                              size="sm"
                              icon={XCircle}
                              title="Cancelar Agendamento"
                            />
                          )}
                          
                          {/* Excluir - sempre disponível */}
                          <Button
                            onClick={() => handleExcluir(appointment.id)}
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            title="Excluir"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

            {/* Mobile - Cards */}
            <div className="lg:hidden space-y-3">
              {filteredAppointments.map((appointment) => (
                <div key={`mobile-${appointment.id}`} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                  {/* Header do Card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {appointment.customer.photo ? (
                          <Image
                            src={appointment.customer.photo}
                            alt={appointment.customer.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{appointment.customer.name}</div>
                        <div className="text-xs text-gray-500">{appointment.customer.phone}</div>
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>

                  {/* Info do Agendamento */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>
                        {new Date(appointment.date).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(appointment.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Scissors className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{appointment.service.name} ({appointment.service.duration} min)</span>
                    </div>
                    {appointment.professional && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{appointment.professional}</span>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    {(appointment.status === 'agendado' || appointment.status === 'confirmado') && (
                      <Button
                        onClick={() => handleEditar(appointment)}
                        variant="outline"
                        size="sm"
                        icon={Edit}
                      >
                        Editar
                      </Button>
                    )}
                    
                    {appointment.status === 'agendado' && (
                      <Button
                        onClick={() => handleConfirmar(appointment.id)}
                        variant="success"
                        size="sm"
                        icon={CheckCircle}
                      >
                        Confirmar
                      </Button>
                    )}
                    
                    {appointment.status === 'confirmado' && (
                      <Button
                        onClick={() => handleConcluir(appointment.id)}
                        variant="primary"
                        size="sm"
                        icon={CheckCircle}
                      >
                        Concluir
                      </Button>
                    )}
                    
                    {appointment.status === 'concluido' && (
                      <Button
                        onClick={() => handleIrParaPDV(appointment)}
                        variant="success"
                        size="sm"
                        icon={ShoppingCart}
                      >
                        PDV
                      </Button>
                    )}
                    
                    {(appointment.status === 'agendado' || appointment.status === 'confirmado') && (
                      <Button
                        onClick={() => handleCancelar(appointment.id)}
                        variant="danger"
                        size="sm"
                        icon={XCircle}
                      >
                        Cancelar
                      </Button>
                    )}
                    
                    {(appointment.status === 'cancelado' || appointment.status === 'concluido') && (
                      <Button
                        onClick={() => handleExcluir(appointment.id)}
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                      >
                        Excluir
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

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
