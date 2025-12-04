'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Search, Eye, Edit2, Trash2, Users, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/Loading';
import { NoResults } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';

interface Professional {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  active: boolean;
  photo: string | null;
  createdAt: string;
}

export default function ProfissionaisPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingProfessional, setDeletingProfessional] = useState<Professional | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      const response = await fetch('/api/professionals');
      if (response.ok) {
        const data = await response.json();
        setProfessionals(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar profissionais:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (professional: Professional) => {
    setDeletingProfessional(professional);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingProfessional) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/professionals?id=${deletingProfessional.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        success('Profissional excluído com sucesso');
        fetchProfessionals();
        setShowDeleteDialog(false);
        setDeletingProfessional(null);
      } else {
        const errorData = await response.json();
        error(errorData.error || 'Erro ao excluir profissional');
      }
    } catch (err) {
      console.error('Erro ao excluir profissional:', err);
      error('Erro ao excluir profissional');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProfessionals = professionals.filter((prof) => {
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

  return (
    <div className="container-app">
      {/* Header */}
      <div className="mb-spacing-section">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white">
              Profissionais
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Gerencie sua equipe de profissionais
            </p>
          </div>
          <Button
            onClick={() => router.push('/admin/profissionais/novo')}
            className="touch-target"
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
              className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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

      {/* Desktop Table */}
      {loading ? (
        <div className="hidden lg:block">
          <SkeletonTable />
        </div>
      ) : filteredProfessionals.length === 0 ? (
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
                  {filteredProfessionals.map((professional) => (
                    <tr key={professional.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                            {professional.photo ? (
                              <Image
                                src={professional.photo}
                                alt={professional.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                <Users className="w-5 h-5" />
                              </div>
                            )}
                          </div>
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
                            onClick={() => handleDeleteClick(professional)}
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
            {filteredProfessionals.map((professional) => (
              <div
                key={professional.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    {professional.photo ? (
                      <Image
                        src={professional.photo}
                        alt={professional.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <Users className="w-8 h-8" />
                      </div>
                    )}
                  </div>
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
                    onClick={() => handleDeleteClick(professional)}
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

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && deletingProfessional && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Confirmar Exclusão
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tem certeza que deseja excluir o profissional <strong>{deletingProfessional.name}</strong>? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingProfessional(null);
                }}
                disabled={deleting}
                className="touch-target"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="touch-target bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
