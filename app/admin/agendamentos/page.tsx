"use client";

import { useState, useEffect } from "react";
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
        alert(isEditing ? 'Agendamento atualizado com sucesso!' : 'Agendamento criado com sucesso!');
        fetchData(); // Recarregar lista
      } else {
        console.error('Erro da API:', data);
        alert(data.error || `Erro ao ${isEditing ? 'atualizar' : 'criar'} agendamento`);
      }
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      alert('Erro ao salvar agendamento. Verifique o console para mais detalhes.');
    }
  }

  function handleEditar(appointment: Appointment) {
    setEditingAppointment(appointment);
    setShowModal(true);
  }

  async function handleConfirmar(id: number) {
    if (!confirm('Confirmar este agendamento?\n\nApós confirmar, você poderá finalizar o serviço quando for realizado.')) return;
    
    try {
      const appointment = appointments.find(a => a.id === id);
      if (!appointment) return;

      // Validar que está agendado
      if (appointment.status !== 'agendado') {
        alert('ATENÇÃO: Este agendamento já foi processado!');
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
        alert('Agendamento confirmado!\n\nQuando o serviço for realizado, clique em "Finalizar Serviço".');
        fetchData();
      } else {
        alert('ERRO: Não foi possível confirmar agendamento');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('ERRO: Não foi possível confirmar agendamento');
    }
  }

  async function handleConcluir(id: number) {
    if (!confirm('Confirmar que o serviço foi finalizado?\n\nApós confirmar, você poderá ir para o PDV para faturamento.')) return;
    
    try {
      const appointment = appointments.find(a => a.id === id);
      if (!appointment) return;

      // Validar que está confirmado
      if (appointment.status !== 'confirmado') {
        alert('ATENÇÃO: Este agendamento precisa estar confirmado primeiro!');
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
        alert('Serviço finalizado com sucesso!\n\nAgora você pode ir para o PDV para faturamento.');
        fetchData();
      } else {
        alert('ERRO: Não foi possível finalizar serviço');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('ERRO: Não foi possível finalizar serviço');
    }
  }

  async function handleCancelar(id: number) {
    if (!confirm('Deseja cancelar este agendamento?')) return;
    
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
        alert('Agendamento cancelado!');
        fetchData();
      } else {
        alert('Erro ao cancelar agendamento');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao cancelar agendamento');
    }
  }

  async function handleExcluir(id: number) {
    if (!confirm('Deseja realmente excluir este agendamento? Esta ação não pode ser desfeita.')) return;
    
    try {
      const response = await fetch(`/api/appointments?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Agendamento excluído!');
        fetchData();
      } else {
        alert('Erro ao excluir agendamento');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao excluir agendamento');
    }
  }

  function handleIrParaPDV(appointment: Appointment) {
    // Verificar se o serviço foi concluído
    if (appointment.status !== 'concluido') {
      alert('O serviço precisa ser finalizado antes de ir para o PDV!');
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
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
            size="lg"
          >
            Novo Agendamento
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setFilterStatus('all')}
            variant={filterStatus === 'all' ? 'primary' : 'outline'}
            size="sm"
          >
            Todos ({appointments.length})
          </Button>
          <Button
            onClick={() => setFilterStatus('agendado')}
            variant={filterStatus === 'agendado' ? 'primary' : 'outline'}
            size="sm"
          >
            Agendados ({appointments.filter(a => a.status === 'agendado').length})
          </Button>
          <Button
            onClick={() => setFilterStatus('confirmado')}
            variant={filterStatus === 'confirmado' ? 'success' : 'outline'}
            size="sm"
          >
            Confirmados ({appointments.filter(a => a.status === 'confirmado').length})
          </Button>
          <Button
            onClick={() => setFilterStatus('concluido')}
            variant={filterStatus === 'concluido' ? 'secondary' : 'outline'}
            size="sm"
          >
            Concluídos ({appointments.filter(a => a.status === 'concluido').length})
          </Button>
          <Button
            onClick={() => setFilterStatus('cancelado')}
            variant={filterStatus === 'cancelado' ? 'danger' : 'outline'}
            size="sm"
          >
            Cancelados ({appointments.filter(a => a.status === 'cancelado').length})
          </Button>
        </div>

        {/* Tabela de Agendamentos */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
        )}
      </div>

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
