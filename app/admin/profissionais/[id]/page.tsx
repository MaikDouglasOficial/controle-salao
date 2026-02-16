'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BadgeDollarSign, Calendar, User, DollarSign, TrendingUp, Filter, Pencil } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import ProfissionalEditarModal from '@/components/ProfissionalEditarModal';
import { useToast } from '@/hooks/useToast';
import { useScrollToTopOnFocus } from '@/hooks/useScrollToTopOnFocus';

interface PerformanceService {
  saleId: number;
  date: string;
  customerName: string;
  serviceName: string;
  quantity: number;
  price: number;
  commission: number;
}

interface PerformanceResponse {
  professional: {
    id: number;
    name: string;
    specialty: string | null;
    photo: string | null;
    active: boolean;
    commissionPercentage: number;
  };
  summary: {
    today: number;
    month: number;
    total: number;
  };
  services: PerformanceService[];
}

export default function ProfessionalProfilePage() {
  const params = useParams();
  const professionalId = params.id as string;
  const { success, error } = useToast();
  const scrollToTopOnFocus = useScrollToTopOnFocus();
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | '7days' | '30days' | '90days' | 'year'>('all');
  const [filterType, setFilterType] = useState<'all' | 'services'>('all');
  const [showEditModal, setShowEditModal] = useState(false);

  const filteredServices = useMemo(() => {
    const base = data?.services || [];
    let list = [...base];

    if (filterPeriod !== 'all') {
      const now = new Date();
      const days = {
        '7days': 7,
        '30days': 30,
        '90days': 90,
        year: 365,
      }[filterPeriod];

      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      list = list.filter((item) => new Date(item.date) >= cutoff);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((item) =>
        item.customerName.toLowerCase().includes(term) ||
        item.serviceName.toLowerCase().includes(term)
      );
    }

    return list;
  }, [data?.services, filterPeriod, searchTerm]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/professionals/${professionalId}/performance`);
        const json = await response.json();
        if (response.ok) {
          setData(json);
        } else {
          setData(null);
          console.error(json.error || 'Erro ao carregar desempenho');
        }
      } catch (error) {
        console.error('Erro ao carregar desempenho:', error);
      } finally {
        setLoading(false);
      }
    };

    if (professionalId) {
      load();
    }
  }, [professionalId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
          Não foi possível carregar o perfil do profissional.
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-4 sm:space-y-6 mt-6">
      <div className="flex items-center justify-between gap-4 page-header">
        <div>
          <h1 className="page-title">Perfil do profissional</h1>
          <p className="page-subtitle">Desempenho e comissões</p>
        </div>
        <Link
          href="/admin/profissionais"
          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-stone-600" />
        </Link>
      </div>

      {/* Informações do Profissional */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
              {data.professional.photo ? (
                <Image
                  src={data.professional.photo}
                  alt={data.professional.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{data.professional.name}</h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {data.professional.specialty || 'Profissional'} • Comissão {data.professional.commissionPercentage}%
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <Pencil className="h-4 w-4" />
            <span>Editar</span>
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-gray-600">Comissão Hoje</p>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
              {formatCurrency(data.summary.today)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-gray-600">Comissão do Mês</p>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 truncate">
              {formatCurrency(data.summary.month)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-gray-600">Comissão Total</p>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-purple-600 truncate">
              {formatCurrency(data.summary.total)}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={scrollToTopOnFocus}
              placeholder="Buscar por cliente ou serviço..."
              className="w-full h-11 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full h-11 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="services">Serviços</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="w-full h-11 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="90days">Últimos 90 dias</option>
              <option value="year">Último ano</option>
            </select>
          </div>
        </div>
      </div>

      {/* Serviços realizados */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Calendar className="h-4 w-4" />
          Serviços realizados
        </div>
        <div className="md:hidden divide-y divide-gray-200">
          {filteredServices.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              Nenhum serviço encontrado
            </div>
          ) : (
            filteredServices.map((item, index) => (
              <div key={`${item.saleId}-${index}`} className="p-4 space-y-2">
                <div className="text-sm text-gray-600">{formatDate(item.date)}</div>
                <div className="text-sm font-semibold text-gray-900">
                  {item.customerName}
                </div>
                <div className="text-sm text-gray-600">{item.serviceName}</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(item.commission)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block table-responsive touch-pan-y">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comissão</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    Nenhum serviço encontrado
                  </td>
                </tr>
              ) : (
                filteredServices.map((item, index) => (
                  <tr key={`${item.saleId}-${index}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(item.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.customerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.serviceName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      {formatCurrency(item.commission)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && data && (
        <ProfissionalEditarModal
          profissional={{
            id: data.professional.id,
            name: data.professional.name,
            specialty: data.professional.specialty || '',
            phone: '',
            email: '',
            active: data.professional.active,
            photo: data.professional.photo || '',
            commissionPercentage: data.professional.commissionPercentage,
          }}
          onSave={async (updated) => {
            try {
              const response = await fetch('/api/professionals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
              });

              if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erro ao atualizar profissional');
              }

              success('Profissional atualizado com sucesso!');
              setShowEditModal(false);
              const refreshed = await fetch(`/api/professionals/${data.professional.id}/performance`);
              const refreshedData = await refreshed.json();
              if (refreshed.ok) {
                setData(refreshedData);
              }
            } catch (err: any) {
              error(err.message || 'Erro ao atualizar profissional');
            }
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}