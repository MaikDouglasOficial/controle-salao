'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Eye, Edit2, Trash2, Receipt, TrendingUp, TrendingDown, AlertTriangle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/Loading';
import { NoResults, ErrorState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import { useExpenses, useDeleteExpense } from '@/hooks/useApi';

interface Expense {
  id: number;
  name: string;
  category: string;
  value: number;
  type: string;
  date: string;
  notes: string | null;
}

export default function DespesasPage() {
  const router = useRouter();
  const { confirm } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'FIXA' | 'VARIAVEL'>('all');

  // React Query hooks
  const { data: expenses = [], isLoading, isError, error: queryError } = useExpenses();
  const deleteMutation = useDeleteExpense();

  const handleDelete = async (expense: Expense) => {
    const confirmed = await confirm({
      title: 'Excluir Despesa',
      message: `Tem certeza que deseja excluir a despesa "${expense.name}"? Esta ação não pode ser desfeita.`,
      type: 'danger'
    });

    if (!confirmed) return;

    await deleteMutation.mutateAsync(expense.id.toString());
  };

  // Memoizar filtros
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    
    return expenses.filter((expense: Expense) => {
      const matchesSearch =
        expense.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === 'all' || expense.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [expenses, searchTerm, filterType]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum: number, exp: Expense) => sum + exp.value, 0);
  }, [filteredExpenses]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <Receipt className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Despesas
                </h1>
              </div>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Gerencie suas despesas fixas e variáveis
              </p>
            </div>
            
            <Button
              onClick={() => router.push('/admin/despesas/nova')}
              size="lg"
              className="w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="mb-spacing-element bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Despesas</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              R$ {totalExpenses.toFixed(2)}
            </p>
          </div>
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
              placeholder="Buscar por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 md:py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors touch-target ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterType('FIXA')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors touch-target ${
                filterType === 'FIXA'
                  ? 'bg-purple-600 text-white dark:bg-purple-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Fixas
            </button>
            <button
              onClick={() => setFilterType('VARIAVEL')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors touch-target ${
                filterType === 'VARIAVEL'
                  ? 'bg-orange-600 text-white dark:bg-orange-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Variáveis
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {isError && <ErrorState message={queryError?.message || 'Erro ao carregar despesas'} />}

      {/* Desktop Table */}
      {isLoading ? (
        <div className="hidden lg:block">
          <SkeletonTable />
        </div>
      ) : filteredExpenses.length === 0 ? (
        searchTerm ? (
          <NoResults
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm('')}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
            <Receipt className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma despesa cadastrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Comece registrando sua primeira despesa
            </p>
            <Button onClick={() => router.push('/admin/despesas/nova')}>
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Despesa
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
                      Despesa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredExpenses.map((expense: Expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Receipt className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {expense.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {expense.type === 'FIXA' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            Fixa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            Variável
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          {new Date(expense.date).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-base font-semibold text-red-600 dark:text-red-400">
                          R$ {expense.value?.toFixed(2) ?? '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/despesas/${expense.id}`)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors touch-target"
                            aria-label="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/despesas/${expense.id}/editar`)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-green-900/20 rounded-lg transition-colors touch-target"
                            aria-label="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense)}
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
            {filteredExpenses.map((expense: Expense) => (
              <div
                key={expense.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {expense.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {expense.category}
                      </p>
                    </div>
                  </div>
                  {expense.type === 'FIXA' ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      Fixa
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                      Variável
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Data</p>
                    <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                      <Calendar className="w-4 h-4" />
                      {new Date(expense.date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Valor</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      R$ {expense.value?.toFixed(2) ?? '0.00'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/despesas/${expense.id}`)}
                    className="flex-1 touch-target"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/despesas/${expense.id}/editar`)}
                    className="flex-1 touch-target"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <button
                    onClick={() => handleDelete(expense)}
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
