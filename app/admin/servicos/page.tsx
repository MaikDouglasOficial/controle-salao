'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Scissors, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ServiceModal from '@/components/ServiceModal';
import { Button } from '@/components/ui/Button';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { useToast } from '@/hooks/useToast';
import { fetchAuth } from '@/lib/api';
import { useScrollToTopOnFocus } from '@/hooks/useScrollToTopOnFocus';

interface Service {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  price: number;
}

export default function ServicosPage() {
  const { success, error, confirm } = useToast();
  const scrollToTopOnFocus = useScrollToTopOnFocus();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDuration, setFilterDuration] = useState<'all' | 'short' | 'long'>('all');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetchAuth('/api/services');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: number) => {
    const service = services.find(s => s.id === id);
    if (service) {
      setEditingService(service);
      setShowEditModal(true);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      const response = await fetchAuth('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingService),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingService(null);
        fetchServices();
      } else {
        error('Erro ao atualizar serviço');
      }
    } catch (err) {
      console.error('Erro ao atualizar serviço:', err);
      error('Erro ao atualizar serviço');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Confirmar exclusão',
      message: 'Deseja realmente excluir este serviço?',
      type: 'danger',
      requirePassword: true
    });
    if (!confirmed) return;

    try {
      const response = await fetchAuth(`/api/services?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        success('Serviço excluído com sucesso');
        fetchServices();
      } else {
        error('Erro ao deletar serviço');
      }
    } catch (err) {
      console.error('Erro ao deletar serviço:', err);
      error('Erro ao deletar serviço');
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterDuration === 'short') return service.duration <= 60;
    if (filterDuration === 'long') return service.duration > 60;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 mt-6">
      <div className="page-header">
        <h1 className="page-title">Serviços</h1>
        <p className="page-subtitle">Catálogo de serviços e preços</p>
      </div>
      {/* Resumo em cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{services.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Preço médio</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">
            {services.length > 0 ? formatCurrency(services.reduce((acc, s) => acc + s.price, 0) / services.length) : 'R$ 0,00'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Duração média</p>
          <p className="mt-1 text-2xl font-semibold text-gray-600">
            {services.length > 0 ? Math.round(services.reduce((acc, s) => acc + s.duration, 0) / services.length) : 0} min
          </p>
        </div>
      </div>

      <button
        onClick={() => setShowNewModal(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-black text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all z-50"
        aria-label="Novo Serviço"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Busca e filtros - sticky */}
      <div className="sticky top-0 z-10 bg-[var(--bg-main)] pt-1 pb-2 -mx-1 px-1">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={scrollToTopOnFocus}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilterDuration('all')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterDuration === 'all' ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterDuration('short')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterDuration === 'short' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Até 60 min
              </button>
              <button
                type="button"
                onClick={() => setFilterDuration('long')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterDuration === 'long' ? 'bg-stone-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Acima 60 min
              </button>
            </div>
          </div>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Scissors className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Nenhum serviço cadastrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-visible md:overflow-hidden">
          <div className="md:hidden divide-y divide-gray-100">
            {filteredServices.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-500">Nenhum serviço encontrado</div>
            ) : (
              filteredServices.map((service) => (
              <div key={service.id} className="p-4 pr-2 pt-4 pb-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="h-12 w-12 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Scissors className="h-6 w-6 text-stone-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-gray-900">{service.name}</span>
                      {service.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{service.description}</p>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 pt-0.5">
                    <ActionsMenu
                      alignRight={true}
                      items={[
                        { icon: Pencil, label: 'Editar informações', onClick: () => handleEdit(service.id) },
                        { icon: Trash2, label: 'Excluir', onClick: () => handleDelete(service.id), danger: true },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <p className="text-gray-600">
                    <span className="text-gray-400">Duração</span>
                    <span className="ml-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                        {service.duration} min
                      </span>
                    </span>
                  </p>
                  <p className="text-gray-600">
                    <span className="text-gray-400">Preço</span>
                    <span className="ml-2 font-medium text-gray-900">{formatCurrency(service.price)}</span>
                  </p>
                </div>
              </div>
            ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                  <th className="px-5 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-500">Nenhum serviço encontrado</td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Scissors className="h-5 w-5 text-stone-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{service.name}</div>
                          {service.description && <div className="text-xs text-gray-500 mt-0.5">{service.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                        {service.duration} min
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(service.price)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        <ActionsMenu
                          items={[
                            { icon: Pencil, label: 'Editar informações', onClick: () => handleEdit(service.id) },
                            { icon: Trash2, label: 'Excluir', onClick: () => handleDelete(service.id), danger: true },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && editingService && (
        <ServiceModal
          service={{
            ...editingService,
            description: editingService.description ?? ''
          }}
          onSave={async (dadosAtualizados) => {
            try {
              const response = await fetchAuth('/api/services', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: editingService.id,
                  name: dadosAtualizados.name,
                  description: dadosAtualizados.description,
                  duration: dadosAtualizados.duration,
                  price: dadosAtualizados.price
                })
              });
              if (response.ok) {
                success('Serviço atualizado com sucesso');
                setShowEditModal(false);
                setEditingService(null);
                fetchServices();
              } else {
                error('Erro ao atualizar serviço');
              }
            } catch (err) {
              error('Erro ao atualizar serviço');
            }
          }}
          onClose={() => {
            setShowEditModal(false);
            setEditingService(null);
          }}
        />
      )}

      {/* Modal de Novo Serviço */}
      {showNewModal && (

        <ServiceModal
          onSave={async (novoServico) => {
            try {
              const response = await fetchAuth('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: novoServico.name,
                  description: novoServico.description,
                  duration: novoServico.duration,
                  price: novoServico.price
                })
              });
              if (response.ok) {
                success('Serviço criado com sucesso');
                setShowNewModal(false);
                fetchServices();
              } else {
                error('Erro ao criar serviço');
              }
            } catch (err) {
              error('Erro ao criar serviço');
            }
          }}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
}
