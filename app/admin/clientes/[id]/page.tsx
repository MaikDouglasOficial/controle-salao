'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign,
  ShoppingBag,
  Scissors,
  Clock,
  Filter,
  TrendingUp,
  Award,
  Pencil
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import CustomerGallery from '@/components/CustomerGallery';
import { useToast } from '@/hooks/useToast';
import { ModalBase } from '@/components/ui/ModalBase';

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  birthday: string | null;
  notes: string | null;
  createdAt: string;
  photo?: string;
}

interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  notes: string | null;
  service: {
    name: string;
    price: number;
    duration: number;
  };
}

interface Sale {
  id: number;
  date: string;
  total: number;
  paymentMethod: string;
  items: {
    product?: {
      name: string;
    };
    service?: {
      name: string;
    };
    quantity: number;
    price: number;
  }[];
}

export default function ClienteDetalhesPage() {
  const { success, error } = useToast();
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);

  // Filtros
  const [filterType, setFilterType] = useState<'all' | 'appointments' | 'sales'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | '7days' | '30days' | '90days' | 'year'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const [customerRes, appointmentsRes, salesRes, galleryRes] = await Promise.all([
        fetch(`/api/customers/${customerId}`),
        fetch(`/api/appointments?customerId=${customerId}`),
        fetch(`/api/sales?customerId=${customerId}`),
        fetch(`/api/customers/${customerId}/gallery`),
      ]);

      if (customerRes.ok) {
        const customerData = await customerRes.json();
        setCustomer(customerData);
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setAppointments(appointmentsData);
      }

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData);
      }

      if (galleryRes.ok) {
        const galleryData = await galleryRes.json();
        setGalleryPhotos(galleryData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (customer) {
      setEditingCustomer(customer);
      setShowEditModal(true);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingCustomer),
      });

      if (response.ok) {
        await fetchCustomerData();
        setShowEditModal(false);
        setEditingCustomer(null);
        success('Cliente atualizado com sucesso!');
      } else {
        const err = await response.json();
        error(err.error || 'Erro ao atualizar cliente');
      }
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err);
      error('Erro ao atualizar cliente');
    }
  };

  // Estatísticas
  const totalGasto = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalAgendamentos = appointments.length;
  const agendamentosConcluidos = appointments.filter(a => a.status === 'CONCLUIDO').length;
  const ultimaVisita = appointments.length > 0 
    ? new Date(Math.max(...appointments.map(a => new Date(a.date).getTime())))
    : null;

  // Filtros aplicados
  const getFilteredData = () => {
    let filteredAppointments = [...appointments];
    let filteredSales = [...sales];

    // Filtro por período
    if (filterPeriod !== 'all') {
      const now = new Date();
      const days = {
        '7days': 7,
        '30days': 30,
        '90days': 90,
        'year': 365
      }[filterPeriod] || 0;
      
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      filteredAppointments = filteredAppointments.filter(
        a => new Date(a.date) >= cutoffDate
      );
      filteredSales = filteredSales.filter(
        s => new Date(s.date) >= cutoffDate
      );
    }

    // Filtro por status (agendamentos)
    if (filterStatus !== 'all') {
      filteredAppointments = filteredAppointments.filter(
        a => a.status === filterStatus
      );
    }

    // Filtro por tipo
    if (filterType === 'appointments') {
      filteredSales = [];
    } else if (filterType === 'sales') {
      filteredAppointments = [];
    }

    // Busca por termo
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredAppointments = filteredAppointments.filter(
        a => a.service.name.toLowerCase().includes(term) ||
             a.status.toLowerCase().includes(term)
      );
      filteredSales = filteredSales.filter(
        s => s.paymentMethod.toLowerCase().includes(term) ||
             s.items.some(item => 
               item.product?.name.toLowerCase().includes(term) ||
               item.service?.name.toLowerCase().includes(term)
             )
      );
    }

    return { filteredAppointments, filteredSales };
  };

  const { filteredAppointments, filteredSales } = getFilteredData();

  // Combinar e ordenar por data
  const combinedHistory = [
    ...filteredAppointments.map(a => ({ type: 'appointment', data: a, date: new Date(a.date) })),
    ...filteredSales.map(s => ({ type: 'sale', data: s, date: new Date(s.date) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const getStatusColor = (status: string) => {
    const colors = {
      agendado: 'bg-blue-100 text-blue-800',
      confirmado: 'bg-green-100 text-green-800',
      concluido: 'bg-gray-100 text-gray-800',
      cancelado: 'bg-red-100 text-red-800',
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      CONFIRMADO: 'bg-blue-100 text-blue-800',
      CONCLUIDO: 'bg-green-100 text-green-800',
      CANCELADO: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    const labels = {
      agendado: 'Agendado',
      confirmado: 'Confirmado',
      concluido: 'Concluído',
      cancelado: 'Cancelado',
      PENDENTE: 'Pendente',
      CONFIRMADO: 'Confirmado',
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPaymentMethodColor = (method: string) => {
    const colors = {
      DINHEIRO: 'bg-green-100 text-green-800',
      CARTAO_CREDITO: 'bg-blue-100 text-blue-800',
      CARTAO_DEBITO: 'bg-purple-100 text-purple-800',
      PIX: 'bg-teal-100 text-teal-800',
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatPaymentMethod = (method: string) => {
    const methods = {
      DINHEIRO: 'Dinheiro',
      CARTAO_CREDITO: 'Cartão Crédito',
      CARTAO_DEBITO: 'Cartão Débito',
      PIX: 'PIX',
    };
    return methods[method as keyof typeof methods] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="page-container space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-gray-600">Cliente não encontrado</p>
          <Link
            href="/admin/clientes"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700"
          >
            Voltar para clientes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link
            href="/admin/clientes"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Detalhes do Cliente</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">Histórico completo e informações</p>
          </div>
        </div>

      {/* Informações do Cliente */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
              {customer.photo ? (
                <Image
                  src={customer.photo}
                  alt={customer.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{customer.name}</h2>
              <p className="text-xs sm:text-sm text-gray-600">Cliente desde {new Date(customer.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <button
            onClick={handleEdit}
            className="flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors w-full sm:w-auto text-sm"
          >
            <Pencil className="h-4 w-4" />
            <span>Editar</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {customer.email && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg min-w-0">
              <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900 truncate">{customer.email}</p>
              </div>
            </div>
          )}
          
          {customer.phone && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg min-w-0">
              <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Telefone</p>
                <p className="text-sm font-medium text-gray-900 truncate">{customer.phone}</p>
              </div>
            </div>
          )}
          
          {customer.birthday && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg min-w-0">
              <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Aniversário</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(customer.birthday).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </div>

        {customer.notes && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Observações</p>
            <p className="text-sm text-blue-700">{customer.notes}</p>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-gray-600">Total Gasto</p>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
              R$ {totalGasto.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-gray-600">Agendamentos</p>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-blue-600">{totalAgendamentos}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-gray-600">Concluídos</p>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-purple-600">{agendamentosConcluidos}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-gray-600">Última Visita</p>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
            </div>
            <p className="text-base sm:text-lg font-bold text-orange-600 truncate">
              {ultimaVisita ? ultimaVisita.toLocaleDateString('pt-BR') : 'Nunca'}
            </p>
          </div>
        </div>
      </div>

      {/* Galeria de Fotos */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <CustomerGallery
          customerId={parseInt(customerId)}
          photos={galleryPhotos}
          onPhotosUpdate={fetchCustomerData}
        />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="appointments">Agendamentos</option>
              <option value="sales">Vendas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todo período</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="90days">Últimos 90 dias</option>
              <option value="year">Último ano</option>
            </select>
          </div>
        </div>

        {(searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterPeriod !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterStatus('all');
              setFilterPeriod('all');
            }}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Histórico ({combinedHistory.length})
        </h3>

        {combinedHistory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Nenhum registro encontrado</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {combinedHistory.map((item, index) => (
              <div
                key={`${item.type}-${index}`}
                className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-primary-300 transition-colors"
              >
                {item.type === 'appointment' ? (
                  // Agendamento
                  <div className="flex flex-col sm:flex-row items-start justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-start space-x-3 flex-1 w-full">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Scissors className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                          <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                            {(item.data as Appointment).service.name}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor((item.data as Appointment).status)} w-fit`}>
                            {formatStatus((item.data as Appointment).status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{new Date((item.data as Appointment).date).toLocaleDateString('pt-BR')}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{(item.data as Appointment).time}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="whitespace-nowrap">R$ {(item.data as Appointment).service.price.toFixed(2)}</span>
                          </span>
                        </div>
                        {(item.data as Appointment).notes && (
                          <p className="mt-2 text-sm text-gray-500 italic">
                            {(item.data as Appointment).notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Venda
                  <div className="flex flex-col sm:flex-row items-start justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-start space-x-3 flex-1 w-full">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                          <h4 className="font-semibold text-sm sm:text-base text-gray-900">Venda</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPaymentMethodColor((item.data as Sale).paymentMethod)} w-fit`}>
                            {formatPaymentMethod((item.data as Sale).paymentMethod)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{new Date((item.data as Sale).date).toLocaleDateString('pt-BR')}</span>
                          </span>
                          <span className="flex items-center space-x-1 text-green-600 font-semibold">
                            <DollarSign className="h-4 w-4" />
                            <span>R$ {(item.data as Sale).total.toFixed(2)}</span>
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          {(item.data as Sale).items.map((saleItem, idx) => (
                            <div key={idx} className="text-sm text-gray-600">
                              • {saleItem.product?.name || saleItem.service?.name} 
                              <span className="text-gray-400"> x{saleItem.quantity}</span>
                              <span className="text-gray-500"> - R$ {saleItem.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      <ModalBase
        isOpen={Boolean(showEditModal && editingCustomer)}
        onClose={() => {
          setShowEditModal(false);
          setEditingCustomer(null);
        }}
        title="Editar Cliente"
        size="2xl"
      >
        {editingCustomer && (
          <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.name}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingCustomer.email || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value || null })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="joao@email.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={editingCustomer.birthday ? editingCustomer.birthday.split('T')[0] : ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, birthday: e.target.value || null })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    rows={3}
                    value={editingCustomer.notes || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value || null })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: Cliente VIP, prefere horários pela manhã..."
                  />
                </div>
              </div>

              <div className="modal-actions flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCustomer(null);
                  }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
        )}
      </ModalBase>
    </div>
  );
}
