
'use client';

import { useEffect, useState } from 'react';
import { TrendingDown, Calendar, DollarSign, Pencil, Trash2, Filter, X, Package, Search, Plus, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import DespesaModal from '@/components/DespesaModal';
import { Button } from '@/components/ui/Button';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { LoadingSpinner } from '@/components/ui/Layout';
import { useToast } from '@/hooks/useToast';
import { fetchAuth } from '@/lib/api';
import { useScrollToTopOnFocus } from '@/hooks/useScrollToTopOnFocus';

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  notes: string | null;
}

export default function DespesasPage() {
  const { success, error, confirm } = useToast();
  const scrollToTopOnFocus = useScrollToTopOnFocus();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQuick, setFilterQuick] = useState<'all' | 'this_month' | 'older'>('all');
  
  // Filtros
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [expenses, selectedMonth, selectedYear, selectedCategory, startDate, endDate, searchTerm, filterQuick]);

  const fetchExpenses = async () => {
    try {
      const response = await fetchAuth('/api/expenses');
      const data = await response.json();
      setExpenses(data);
      setFilteredExpenses(data);
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    // Filtrar por termo de busca (descrição ou categoria)
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por intervalo de datas (prioritário sobre mês/ano)
    if (startDate || endDate) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        const start = startDate ? new Date(startDate) : new Date('1900-01-01');
        const end = endDate ? new Date(endDate) : new Date('2100-12-31');
        
        // Ajustar para incluir o dia inteiro
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        return expenseDate >= start && expenseDate <= end;
      });
    } else {
      // Filtrar por mês (somente se não houver intervalo de datas)
      if (selectedMonth) {
        filtered = filtered.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() + 1 === parseInt(selectedMonth);
        });
      }

      // Filtrar por ano (somente se não houver intervalo de datas)
      if (selectedYear) {
        filtered = filtered.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getFullYear() === parseInt(selectedYear);
        });
      }
    }

    // Filtrar por categoria
    if (selectedCategory) {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    // Filtro rápido: Este mês / Anteriores
    if (filterQuick === 'this_month') {
      const now = new Date();
      filtered = filtered.filter(expense => {
        const d = new Date(expense.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (filterQuick === 'older') {
      const now = new Date();
      filtered = filtered.filter(expense => {
        const d = new Date(expense.date);
        return d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear();
      });
    }

    setFilteredExpenses(filtered);
  };

  const clearFilters = () => {
    setFilterQuick('all');
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedCategory('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setFilteredExpenses(expenses);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Excluir Despesa',
      message: 'Tem certeza que deseja excluir esta despesa?',
      type: 'danger',
      requirePassword: true
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetchAuth('/api/expenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        success('Despesa excluída com sucesso!');
        fetchExpenses();
      } else {
        error('Erro ao deletar despesa');
      }
    } catch (err) {
      console.error('Erro ao deletar despesa:', err);
      error('Erro ao deletar despesa');
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowEditModal(true);
  };

  const handleSaveExpense = async (expenseData: any) => {
    try {
      const isEdit = !!expenseData.id;
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetchAuth('/api/expenses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        success(`Despesa ${isEdit ? 'atualizada' : 'criada'} com sucesso!`);
        setShowEditModal(false);
        setShowCreateModal(false);
        setEditingExpense(null);
        fetchExpenses();
      } else {
        const err = await response.json();
        error(err.error || `Erro ao ${isEdit ? 'atualizar' : 'criar'} despesa`);
      }
    } catch (err) {
      console.error('Erro ao salvar despesa:', err);
      error('Erro ao salvar despesa');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      PRODUTOS: 'bg-blue-100 text-blue-700',
      SALARIO: 'bg-green-100 text-green-700',
      ALUGUEL: 'bg-indigo-100 text-indigo-700',
      MARKETING: 'bg-rose-100 text-rose-700',
      OUTROS: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors.OUTROS;
  };

  const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  // Gerar lista de anos (últimos 5 anos + ano atual)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 mt-6">
      <div className="page-header text-center mb-8 relative">
        <button
          type="button"
          onClick={async () => { setRefreshing(true); await fetchExpenses(); setRefreshing(false); }}
          disabled={refreshing}
          className="hidden sm:flex absolute right-0 top-0 w-9 h-9 rounded-full items-center justify-center text-stone-500 hover:text-amber-500 hover:bg-stone-100 active:!text-stone-500 active:!bg-transparent focus:!text-stone-500 focus:!bg-transparent focus:outline-none transition-colors disabled:opacity-50"
          aria-label="Atualizar lista"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
        <h1 className="page-title">Despesas</h1>
        <p className="page-subtitle">Controle de gastos</p>
        <div className="flex justify-center mt-3 sm:hidden">
          <button
            type="button"
            onClick={async () => { setRefreshing(true); await fetchExpenses(); setRefreshing(false); }}
            disabled={refreshing}
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-500 hover:text-amber-500 hover:bg-stone-100 active:!text-stone-500 active:!bg-transparent focus:!text-stone-500 focus:!bg-transparent focus:outline-none transition-colors disabled:opacity-50"
            aria-label="Atualizar lista"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="mt-3 sm:mt-5 flex justify-center">
          <Button
            variant="secondary"
            size="md"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
            className="min-w-[200px] uppercase tracking-wide font-semibold"
          >
            Adicionar despesa
          </Button>
        </div>
      </div>
      {/* Resumo em cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{filteredExpenses.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Valor total</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Média por despesa</p>
          <p className="mt-1 text-2xl font-semibold text-gray-600">
            {filteredExpenses.length > 0 ? formatCurrency(totalExpenses / filteredExpenses.length) : formatCurrency(0)}
          </p>
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-[var(--bg-main)] pt-1 pb-2 -mx-1 px-1">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por descrição ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={scrollToTopOnFocus}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilterQuick('all')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterQuick === 'all' ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterQuick('this_month')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterQuick === 'this_month' ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Este mês
              </button>
              <button
                type="button"
                onClick={() => setFilterQuick('older')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterQuick === 'older' ? 'bg-stone-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Anteriores
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-stone-500" />
            <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
          </div>
          {(selectedMonth || selectedYear || selectedCategory || startDate || endDate || searchTerm) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Limpar</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value) {
                  setSelectedMonth('');
                  setSelectedYear('');
                }
              }}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (e.target.value) {
                  setSelectedMonth('');
                  setSelectedYear('');
                }
              }}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Mês
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                if (e.target.value) {
                  setStartDate('');
                  setEndDate('');
                }
              }}
              disabled={!!(startDate || endDate)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todos os meses</option>
              <option value="1">Janeiro</option>
              <option value="2">Fevereiro</option>
              <option value="3">Março</option>
              <option value="4">Abril</option>
              <option value="5">Maio</option>
              <option value="6">Junho</option>
              <option value="7">Julho</option>
              <option value="8">Agosto</option>
              <option value="9">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Ano
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                if (e.target.value) {
                  setStartDate('');
                  setEndDate('');
                }
              }}
              disabled={!!(startDate || endDate)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todos os anos</option>
              {years.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm"
            >
              <option value="">Todas as categorias</option>
              <option value="PRODUTOS">Produtos</option>
              <option value="SALARIO">Salário</option>
              <option value="ALUGUEL">Aluguel</option>
              <option value="MARKETING">Marketing</option>
              <option value="OUTROS">Outros</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Despesas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-visible md:overflow-hidden">
        <div className="md:hidden divide-y divide-gray-100">
          {filteredExpenses.length === 0 ? (
            <div className="min-h-[200px] flex items-center justify-center px-5 py-10 text-center text-sm text-gray-500">Nenhuma despesa encontrada</div>
          ) : (
            filteredExpenses.map((expense) => (
              <div key={expense.id} className="p-4 pr-2 pt-4 pb-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-stone-100 flex-shrink-0 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-stone-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-gray-900">{expense.description}</span>
                      <p className="text-sm text-gray-500 mt-0.5">{formatDate(expense.date)}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 pt-0.5">
                    <ActionsMenu
                      alignRight={true}
                      items={[
                        { icon: Pencil, label: 'Editar informações', onClick: () => handleEdit(expense) },
                        { icon: Trash2, label: 'Excluir', onClick: () => handleDelete(expense.id), danger: true },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <p className="text-gray-600">
                    <span className="text-gray-400">Valor</span>
                    <span className="ml-2 font-medium text-gray-900">{formatCurrency(expense.amount)}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="text-gray-400">Categoria</span>
                    <span className="ml-2">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </span>
                  </p>
                  {expense.notes && (
                    <p className="text-gray-600">
                      <span className="text-gray-400">Notas</span>
                      <span className="ml-2 text-gray-900">{expense.notes}</span>
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-5 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">Nenhuma despesa encontrada</td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{expense.description}</div>
                      {expense.notes && <div className="text-xs text-gray-500 mt-0.5">{expense.notes}</div>}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">{formatDate(expense.date)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        <ActionsMenu
                          items={[
                            { icon: Pencil, label: 'Editar informações', onClick: () => handleEdit(expense) },
                            { icon: Trash2, label: 'Excluir', onClick: () => handleDelete(expense.id), danger: true },
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

      {/* Modal de Criação */}
      {showCreateModal && (
        <DespesaModal
          onSave={handleSaveExpense}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Modal de Edição */}
      {showEditModal && editingExpense && (
        <DespesaModal
          despesa={editingExpense}
          onSave={handleSaveExpense}
          onClose={() => {
            setShowEditModal(false);
            setEditingExpense(null);
          }}
        />
      )}
    </div>
  );
}
