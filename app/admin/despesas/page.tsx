'use client';

import { useEffect, useState } from 'react';
import { Plus, TrendingDown, Calendar, DollarSign, Pencil, Trash2, Filter, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import DespesaModal from '@/components/DespesaModal';
import { Button } from '@/components/ui/Button';

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  notes: string | null;
}

export default function DespesasPage() {
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
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) {
      return;
    }

    try {
      const response = await fetch('/api/expenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        fetchExpenses();
      } else {
        alert('Erro ao deletar despesa');
      }
    } catch (error) {
      console.error('Erro ao deletar despesa:', error);
      alert('Erro ao deletar despesa');
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
        setShowEditModal(false);
        setShowCreateModal(false);
        setEditingExpense(null);
        fetchExpenses();
      } else {
        const error = await response.json();
        alert(error.error || `Erro ao ${isEdit ? 'atualizar' : 'criar'} despesa`);
      }
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      alert('Erro ao salvar despesa');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-pink-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header Aprimorado */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-in">
                <TrendingDown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-red-700 bg-clip-text text-transparent leading-tight pb-2">
                  Despesas
                </h1>
                <p className="text-xl text-gray-600 mt-2">
                  Controle completo dos seus gastos
                </p>
              </div>
            </div>
            <div className="h-1 w-32 bg-gradient-to-r from-red-500 to-pink-600 rounded-full animate-slideRight"></div>
          </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={Plus}
          size="lg"
        >
          Nova Despesa
        </Button>
      </div>

      {/* Filtros Modernos */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Filtros Avançados</h3>
              <p className="text-sm text-gray-500">Refine sua busca por período e categoria</p>
            </div>
          </div>
          {(selectedMonth || selectedYear || selectedCategory) && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-medium shadow-sm"
            >
              <X className="h-4 w-4" />
              <span>Limpar</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Data Inicial</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                // Limpar mês/ano se usar intervalo
                if (e.target.value) {
                  setSelectedMonth('');
                  setSelectedYear('');
                }
              }}
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 font-medium shadow-sm hover:border-blue-300"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Data Final</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                // Limpar mês/ano se usar intervalo
                if (e.target.value) {
                  setSelectedMonth('');
                  setSelectedYear('');
                }
              }}
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 font-medium shadow-sm hover:border-blue-300"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Mês</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                // Limpar intervalo se usar mês/ano
                if (e.target.value) {
                  setStartDate('');
                  setEndDate('');
                }
              }}
              disabled={!!(startDate || endDate)}
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 font-medium shadow-sm hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Ano</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                // Limpar intervalo se usar mês/ano
                if (e.target.value) {
                  setStartDate('');
                  setEndDate('');
                }
              }}
              disabled={!!(startDate || endDate)}
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 font-medium shadow-sm hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todos os anos</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span>Categoria</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 font-medium shadow-sm hover:border-blue-300"
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
          <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{filteredExpenses.length}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Mostrando {filteredExpenses.length} de {expenses.length} despesas
                  </p>
                  <p className="text-xs text-blue-600">
                    {startDate && `De: ${new Date(startDate).toLocaleDateString('pt-BR')}`}
                    {startDate && endDate && ' • '}
                    {endDate && `Até: ${new Date(endDate).toLocaleDateString('pt-BR')}`}
                    {(startDate || endDate) && selectedCategory && ' • '}
                    {!startDate && !endDate && selectedMonth && `Mês: ${['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][parseInt(selectedMonth) - 1]}`}
                    {!startDate && !endDate && selectedMonth && selectedYear && ' • '}
                    {!startDate && !endDate && selectedYear && `Ano: ${selectedYear}`}
                    {(!startDate && !endDate && (selectedMonth || selectedYear)) && selectedCategory && ' • '}
                    {selectedCategory && `Categoria: ${selectedCategory}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Total de Despesas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm mb-1">Total de Despesas</p>
              <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total de Registros</p>
              <p className="text-3xl font-bold text-gray-900">{filteredExpenses.length}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Média por Despesa</p>
              <p className="text-3xl font-bold text-gray-900">
                {filteredExpenses.length > 0 ? formatCurrency(totalExpenses / filteredExpenses.length) : formatCurrency(0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Despesas */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Data
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Descrição
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Categoria
                  </th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">
                    Valor
                  </th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(expense.date)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">
                        {expense.description}
                      </div>
                      {expense.notes && (
                        <div className="text-sm text-gray-500 mt-1">
                          {expense.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                          expense.category
                        )}`}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-semibold text-red-600">
                        {formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          onClick={() => handleEdit(expense)}
                          variant="ghost"
                          size="sm"
                          icon={Pencil}
                          title="Editar despesa"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        />
                        <Button
                          onClick={() => handleDelete(expense.id)}
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          title="Excluir despesa"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </div>
  );
}
