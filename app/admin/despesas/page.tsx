'use client';

import { useEffect, useState } from 'react';
import { Plus, TrendingDown, Calendar, DollarSign, Pencil, Trash2, Filter, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import DespesaModal from '@/components/DespesaModal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Filtros
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [expenses, selectedMonth, selectedYear, selectedCategory, startDate, endDate]);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses');
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

    setFilteredExpenses(filtered);
  };

  const clearFilters = () => {
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedCategory('');
    setStartDate('');
    setEndDate('');
    setFilteredExpenses(expenses);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Excluir Despesa',
      message: 'Tem certeza que deseja excluir esta despesa?',
      type: 'danger'
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch('/api/expenses', {
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
      
      const response = await fetch('/api/expenses', {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Despesas</h1>
            <p className="text-sm text-gray-500 mt-1">Controle seus gastos</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={Plus}
            size="lg"
          >
            Nova Despesa
          </Button>
        </div>
                          variant="danger"
      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Filtros</h3>
          </div>
          {(selectedMonth || selectedYear || selectedCategory) && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <X className="h-3 w-3" />
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
              className="w-full h-11 px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
              className="w-full h-11 px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todos os anos</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
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
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
        
        {(selectedMonth || selectedYear || selectedCategory || startDate || endDate) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm font-medium text-blue-900">
              Mostrando {filteredExpenses.length} de {expenses.length} despesas
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {startDate && `De: ${new Date(startDate).toLocaleDateString('pt-BR')}`}
              {startDate && endDate && ' • '}
              {endDate && `Até: ${new Date(endDate).toLocaleDateString('pt-BR')}`}
              {(startDate || endDate) && selectedCategory && ' • '}
              {!startDate && !endDate && selectedMonth && `Mês: ${['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][parseInt(selectedMonth) - 1]}`}
              {!startDate && !endDate && selectedMonth && selectedYear && ' • '}
              {!startDate && !endDate && selectedYear && `Ano: ${selectedYear}`}
              {(!startDate && !endDate && (selectedMonth || selectedYear)) && selectedCategory && ' • '}
              {selectedCategory && `Categoria: ${selectedCategory}`}
            </div>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Total de Despesas</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Total de Registros</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredExpenses.length}</p>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Média por Despesa</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredExpenses.length > 0 ? formatCurrency(totalExpenses / filteredExpenses.length) : formatCurrency(0)}
              </p>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Despesas */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {expenses.length === 0 
                ? 'Nenhuma despesa registrada' 
                : 'Nenhuma despesa encontrada com os filtros selecionados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {expense.description}
                      </div>
                      {expense.notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          {expense.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                          expense.category
                        )}`}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-red-600">
                        {formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center space-x-1">
                        <Button
                          onClick={() => handleEdit(expense)}
                          variant="edit"
                          size="sm"
                          icon={Pencil}
                          title="Editar despesa"
                        />
                        <Button
                          onClick={() => handleDelete(expense.id)}
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          title="Excluir despesa"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
