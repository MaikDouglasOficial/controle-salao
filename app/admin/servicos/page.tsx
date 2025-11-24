'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Scissors, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ServiceModal from '@/components/ServiceModal';
import { Button } from '@/components/ui/Button';

interface Service {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  price: number;
}

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
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
      const response = await fetch('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingService),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingService(null);
        fetchServices();
      } else {
        alert('Erro ao atualizar serviço');
      }
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      alert('Erro ao atualizar serviço');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este serviço?')) return;

    try {
      const response = await fetch(`/api/services?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchServices();
      } else {
        alert('Erro ao deletar serviço');
      }
    } catch (error) {
      console.error('Erro ao deletar serviço:', error);
      alert('Erro ao deletar serviço');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header Aprimorado */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-in">
                <Scissors className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-purple-700 bg-clip-text text-transparent leading-tight pb-2">
                  Serviços
                </h1>
                <p className="text-xl text-gray-600 mt-2">
                  Gerencie todos os serviços oferecidos
                </p>
              </div>
            </div>
            <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-slideRight"></div>
          </div>
          <Button
            type="button"
            onClick={() => setShowNewModal(true)}
            icon={Plus}
            size="lg"
          >
            Novo Serviço
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm font-medium text-gray-600">Total de Serviços</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {services.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm font-medium text-gray-600">Preço Médio</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {services.length > 0
                ? formatCurrency(
                    services.reduce((acc, s) => acc + s.price, 0) / services.length
                  )
                : 'R$ 0,00'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm font-medium text-gray-600">Duração Média</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {services.length > 0
                ? Math.round(
                    services.reduce((acc, s) => acc + s.duration, 0) / services.length
                  )
                : 0}{' '}
              min
            </p>
          </div>
        </div>

        {/* Lista de Serviços */}
        {services.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Scissors className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum serviço encontrado</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-purple-500 to-pink-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Duração
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr
                      key={service.id}
                      className="hover:bg-purple-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Scissors className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {service.name}
                            </div>
                            {service.description && (
                              <div className="text-sm text-gray-500 mt-1">
                                {service.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {service.duration} min
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(service.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            onClick={() => handleEdit(service.id)}
                            variant="ghost"
                            size="sm"
                            icon={Pencil}
                          />
                          <Button
                            onClick={() => handleDelete(service.id)}
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
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

      {/* Modal de Edição */}
      {showEditModal && editingService && (
        <ServiceModal
          service={{
            ...editingService,
            description: editingService.description ?? ''
          }}
          onSave={async (dadosAtualizados) => {
            try {
              const response = await fetch('/api/services', {
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
                setShowEditModal(false);
                setEditingService(null);
                fetchServices();
              } else {
                alert('Erro ao atualizar serviço');
              }
            } catch (error) {
              alert('Erro ao atualizar serviço');
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
              const response = await fetch('/api/services', {
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
                setShowNewModal(false);
                fetchServices();
              } else {
                alert('Erro ao criar serviço');
              }
            } catch (error) {
              alert('Erro ao criar serviço');
            }
          }}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
}
