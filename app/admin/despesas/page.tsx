
'use client';

import { useEffect, useState } from 'react';
import { TrendingDown, Calendar, DollarSign, Pencil, Trash2, Filter, X, Package, Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  
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
  }, [expenses, selectedMonth, selectedYear, selectedCategory, startDate, endDate, searchTerm]);

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

    setFilteredExpenses(filtered);
  };

  const clearFilters = () => {
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
      {/* Botão flutuante de nova despesa */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-black text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all z-50"
        aria-label="Nova Despesa"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <div className="bg-white rounded-lg border border-gray-200 px-4 py-2 space-y-1 my-2">
        <div className="text-sm text-gray-700">
          Total de despesas: <span className="font-semibold text-gray-900">{filteredExpenses.length}</span>
        </div>
        <div className="text-sm text-gray-700">
          Valor total: <span className="font-semibold text-gray-900">{formatCurrency(totalExpenses)}</span>
        </div>
        <div className="text-sm text-gray-700">
          Média por despesa: <span className="font-semibold text-gray-900">{filteredExpenses.length > 0 ? formatCurrency(totalExpenses / filteredExpenses.length) : formatCurrency(0)}</span>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border-0 focus:ring-0 focus:outline-none"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Filtros</h3>
          </div>
          {(selectedMonth || selectedYear || selectedCategory || startDate || endDate || searchTerm) && (
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
      </div>

      {/* Lista de Despesas */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Mobile View (Cards) */}
        <div className="md:hidden divide-y divide-gray-200">
          {filteredExpenses.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">Nenhuma despesa encontrada</div>
          ) : (
            filteredExpenses.map((expense) => (
              <div key={expense.id} className="p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{expense.description}</div>
                    <div className="text-xs text-gray-500">{formatDate(expense.date)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    <span className="text-xs text-gray-400">Valor</span>
                    <div className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Categoria</span>
                    <div>
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </div>
                  </div>
                  {expense.notes && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-400">Notas</span>
                      <div className="text-sm text-gray-700">{expense.notes}</div>
                    </div>
                  )}
                </div>

                {/* Edit/Delete buttons below info for mobile */}
                <div className="flex items-center justify-start space-x-2 pt-2">
                  <Button onClick={() => handleEdit(expense)} variant="edit" size="sm" icon={Pencil} />
                  <Button onClick={() => handleDelete(expense.id)} variant="danger" size="sm" icon={Trash2} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block table-responsive">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">Nenhuma despesa encontrada</td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                      {expense.notes && <div className="text-xs text-gray-500">{expense.notes}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(expense.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Button onClick={() => handleEdit(expense)} variant="edit" size="sm" icon={Pencil} />
                        <Button onClick={() => handleDelete(expense.id)} variant="danger" size="sm" icon={Trash2} />
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
