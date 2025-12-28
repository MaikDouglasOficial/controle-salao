'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Eye, Edit2, Trash2, Users, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/Loading';
import { NoResults, ErrorState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import { OptimizedAvatar } from '@/components/OptimizedImage';
import { useProfessionals, useDeleteProfessional } from '@/hooks/useApi';
import type { Professional } from '@/types';

export default function ProfissionaisPage() {
  const router = useRouter();
  const { confirm } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // React Query hooks
  const { data: professionals = [], isLoading, isError, error: queryError } = useProfessionals();
  const deleteMutation = useDeleteProfessional();

  const handleDelete = async (professional: Professional) => {
    const confirmed = await confirm({
      title: 'Excluir Profissional',
      message: `Tem certeza que deseja excluir ${professional.name}? Esta ação não pode ser desfeita.`,
      type: 'danger'
    });

    if (!confirmed) return;

    await deleteMutation.mutateAsync(professional.id.toString());
  };

  // Memoizar filtro
  const filteredProfessionals = useMemo(() => {
    if (!professionals) return [];
    
    return professionals.filter((prof: Professional) => {
      const matchesSearch =
        prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.phone?.includes(searchTerm);

      const matchesActive =
        filterActive === 'all' ||
        (filterActive === 'active' && prof.active) ||
        (filterActive === 'inactive' && !prof.active);

      return matchesSearch && matchesActive;
    });
  }, [professionals, searchTerm, filterActive]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Profissionais
                </h1>
              </div>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Gerencie sua equipe de profissionais
              </p>
            </div>
            
            <Button
              onClick={() => router.push('/admin/profissionais/novo')}
              size="lg"
              className="w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Profissional
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-spacing-element bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome, especialidade ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 md:py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterActive('all')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors touch-target ${
                filterActive === 'all'
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors touch-target ${
                filterActive === 'active'
                  ? 'bg-green-600 text-white dark:bg-green-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors touch-target ${
                filterActive === 'inactive'
                  ? 'bg-red-600 text-white dark:bg-red-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Inativos
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {isError && <ErrorState message={queryError?.message || 'Erro ao carregar profissionais'} />}

      {/* Desktop Table */}
      {isLoading ? (
        <div className="hidden lg:block">
          <SkeletonTable />
        </div>
      ) : !isError && filteredProfessionals.length === 0 ? (
        searchTerm ? (
          <NoResults
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm('')}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
            <Users className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum profissional cadastrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Comece adicionando o primeiro profissional da sua equipe
            </p>
            <Button onClick={() => router.push('/admin/profissionais/novo')}>
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Profissional
            </Button>
          </div>
        )
      ) : (
        <>
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Profissional
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Especialidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProfessionals.map((professional: Professional) => (
                    <tr key={professional.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <OptimizedAvatar
                            src={professional.photo}
                            alt={professional.name}
                            size="md"
                          />
                          <div className="font-medium text-gray-900 dark:text-white">
                            {professional.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {professional.specialty || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        <div className="space-y-1">
                          {professional.phone && <div>{professional.phone}</div>}
                          {professional.email && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {professional.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {professional.active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <UserCheck className="w-3 h-3" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <UserX className="w-3 h-3" />
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/profissionais/${professional.id}`)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors touch-target"
                            aria-label="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/profissionais/${professional.id}/editar`)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-green-900/20 rounded-lg transition-colors touch-target"
                            aria-label="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(professional)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-target"
                            aria-label="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden grid gap-4">
            {filteredProfessionals.map((professional: Professional) => (
              <div
                key={professional.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
              >
                <div className="flex items-start gap-4 mb-4">
                  <OptimizedAvatar
                    src={professional.photo}
                    alt={professional.name}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {professional.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {professional.specialty || 'Sem especialidade'}
                    </p>
                    {professional.active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <UserCheck className="w-3 h-3" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <UserX className="w-3 h-3" />
                        Inativo
                      </span>
                    )}
                  </div>
                </div>

                {(professional.phone || professional.email) && (
                  <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {professional.phone && <div>{professional.phone}</div>}
                    {professional.email && <div>{professional.email}</div>}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/profissionais/${professional.id}`)}
                    className="flex-1 touch-target"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/profissionais/${professional.id}/editar`)}
                    className="flex-1 touch-target"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <button
                    onClick={() => handleDelete(professional)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-target"
                    aria-label="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
