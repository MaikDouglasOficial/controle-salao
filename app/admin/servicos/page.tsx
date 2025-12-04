'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Scissors, Pencil, Trash2, Eye, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/Loading';
import { NoResults, ErrorState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import { useServices, useDeleteService } from '@/hooks/useApi';

interface Service {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  createdAt: string;
}

export default function ServicosPage() {
  const { confirm } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // React Query hooks
  const { data: services = [], isLoading, isError, error: queryError } = useServices();
  const deleteMutation = useDeleteService();

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Excluir Serviço',
      message: 'Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.',
      type: 'danger'
    });

    if (!confirmed) return;

    await deleteMutation.mutateAsync(id.toString());
  };

  // Memoizar filtro
  const filteredServices = useMemo(() => {
    if (!services) return [];
    
    return services.filter((service: Service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [services, searchTerm]);

  return (
    <div className="container-app">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-spacing-section">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white">
            Serviços
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os serviços oferecidos
          </p>
        </div>
        <Link href="/admin/servicos/novo">
          <Button size="lg" className="w-full sm:w-auto touch-target">
            <Plus className="w-5 h-5 mr-2" />
            Novo Serviço
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-spacing-card shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Error State */}
      {isError && <ErrorState message={queryError?.message || 'Erro ao carregar serviços'} />}

      {/* Loading State */}
      {isLoading && <SkeletonTable />}

      {/* Empty State */}
      {!isLoading && !isError && filteredServices.length === 0 && searchTerm && (
        <NoResults
          searchTerm={searchTerm}
          onClearSearch={() => setSearchTerm('')}
        />
      )}

      {!isLoading && !isError && services.length === 0 && !searchTerm && (
        <div className="text-center py-12">
          <Scissors className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum serviço cadastrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Comece adicionando seu primeiro serviço
          </p>
          <Link href="/admin/servicos/novo">
            <Button>
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Serviço
            </Button>
          </Link>
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && !isError && filteredServices.length > 0 && (
        <>
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Duração
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredServices.map((service: Service) => (
                    <tr
                      key={service.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Scissors className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {service.name}
                            </div>
                            {service.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                                {service.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          <Clock className="w-3 h-3 mr-1" />
                          {service.duration} min
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(service.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Link href={`/admin/servicos/${service.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="touch-target"
                              aria-label="Visualizar serviço"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/servicos/${service.id}/editar`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="touch-target"
                              aria-label="Editar serviço"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 touch-target"
                            aria-label="Excluir serviço"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredServices.map((service: Service) => (
              <div
                key={service.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
              >
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Scissors className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duração</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {service.duration} min
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preço</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(service.price)}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link href={`/admin/servicos/${service.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full touch-target">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                  </Link>
                  <Link href={`/admin/servicos/${service.id}/editar`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full touch-target">
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 touch-target"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
