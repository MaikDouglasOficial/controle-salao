'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Calendar, DollarSign, User, Trash2, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface Sale {
  id: number;
  customerId: number | null;
  professional: string | null;
  paymentMethod: string;
  total: number;
  installments: number | null;
  installmentValue: number | null;
  createdAt: string;
  customer: {
    id: number;
    name: string;
    phone: string;
  } | null;
  items: {
    id: number;
    quantity: number;
    price: number;
    product: {
      id: number;
      name: string;
    } | null;
    service: {
      id: number;
      name: string;
    } | null;
  }[];
}

export default function VendasPage() {
  const { success, error, confirm } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Não autorizado - redirecionando para login');
          window.location.href = '/login';
          return;
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSales(data);
      setFilteredSales(data);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      setSales([]);
      setFilteredSales([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sales];

    // Filtrar por forma de pagamento
    if (selectedPayment) {
      filtered = filtered.filter(sale => sale.paymentMethod === selectedPayment);
    }

    // Filtrar por intervalo de datas OU por mês/ano (modo exclusivo)
    const hasDateRange = startDate || endDate;
    const hasMonthYear = selectedMonth || selectedYear;

    if (hasDateRange) {
      // Modo: Filtro por intervalo de datas
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        const start = startDate ? new Date(startDate) : new Date('1900-01-01');
        const end = endDate ? new Date(endDate) : new Date('2100-12-31');
        
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        return saleDate >= start && saleDate <= end;
      });
    } else if (hasMonthYear) {
      // Modo: Filtro por mês e/ou ano
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        const saleMonth = saleDate.getMonth() + 1;
        const saleYear = saleDate.getFullYear();

        const monthMatch = !selectedMonth || saleMonth === parseInt(selectedMonth);
        const yearMatch = !selectedYear || saleYear === parseInt(selectedYear);

        return monthMatch && yearMatch;
      });
    }

    setFilteredSales(filtered);
  };

  const clearFilters = () => {
    setSelectedPayment('');
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
    setSelectedYear('');
    setFilteredSales(sales);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    if (sales.length > 0) {
      applyFilters();
    }
  }, [sales, selectedPayment, startDate, endDate, selectedMonth, selectedYear]);

  const handleDeleteSale = async (id: number) => {
    const confirmed = await confirm({
      title: 'Excluir venda',
      message: 'Tem certeza que deseja excluir esta venda?',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        success('Venda excluída com sucesso!');
        fetchSales();
      } else {
        error('Erro ao deletar venda');
      }
    } catch (err) {
      console.error('Erro ao deletar venda:', err);
      error('Erro ao deletar venda');
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      DINHEIRO: 'bg-green-100 text-green-700',
      CARTAO_CREDITO: 'bg-blue-100 text-blue-700',
      CARTAO_DEBITO: 'bg-purple-100 text-purple-700',
      PIX: 'bg-cyan-100 text-cyan-700',
    };
    return colors[method] || 'bg-gray-100 text-gray-700';
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      DINHEIRO: 'Dinheiro',
      CARTAO_CREDITO: 'Cartão Crédito',
      CARTAO_DEBITO: 'Cartão Débito',
      PIX: 'PIX',
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const totalRevenue = filteredSales?.reduce((acc, sale) => acc + sale.total, 0) || 0;

  return (
    <div className="page-container space-y-6 mt-6">
      <div className="page-header">
        <h1 className="page-title">Vendas</h1>
        <p className="page-subtitle">Histórico de vendas</p>
      </div>

      {/* Resumo em cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{filteredSales.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Receita total</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-stone-100 rounded-xl flex items-center justify-center">
              <Filter className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Filtros</h3>
              <p className="text-sm text-gray-500">Refine sua busca</p>
            </div>
          </div>
          {(selectedPayment || startDate || endDate || selectedMonth || selectedYear) && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Calendar className="h-4 w-4 text-stone-600" />
              <span>Data Inicial</span>
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
              disabled={!!(selectedMonth || selectedYear)}
              className="w-full h-11 px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm disabled:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Calendar className="h-4 w-4 text-stone-600" />
              <span>Data Final</span>
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
              disabled={!!(selectedMonth || selectedYear)}
              className="w-full h-11 px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm disabled:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Calendar className="h-4 w-4 text-stone-600" />
              <span>Mês</span>
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
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm disabled:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Todos</option>
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
              <Calendar className="h-4 w-4 text-stone-600" />
              <span>Ano</span>
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
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm disabled:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Todos</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <DollarSign className="h-4 w-4 text-stone-600" />
              <span>Forma de Pagamento</span>
            </label>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm"
            >
              <option value="">Todas</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              <option value="CARTAO_DEBITO">Cartão de Débito</option>
              <option value="PIX">PIX</option>
            </select>
          </div>
        </div>

        {(selectedPayment || startDate || endDate || selectedMonth || selectedYear) && (
          <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-900">
              Mostrando {filteredSales.length} de {sales.length} vendas
              {startDate && endDate && (
                <span className="ml-2 text-amber-800">
                  • Período: {new Date(startDate).toLocaleDateString('pt-BR')} até {new Date(endDate).toLocaleDateString('pt-BR')}
                </span>
              )}
              {selectedMonth && (
                <span className="ml-2 text-amber-800">
                  • Mês: {['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(selectedMonth)]}
                </span>
              )}
              {selectedYear && (
                <span className="ml-2 text-amber-800">• Ano: {selectedYear}</span>
              )}
              {selectedPayment && (
                <span className="ml-2 text-amber-800">• Pagamento: {getPaymentMethodLabel(selectedPayment)}</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Lista de Vendas */}
      <div className="space-y-4">
        {filteredSales.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <ShoppingBag className="h-16 w-16 text-stone-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma venda encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSales.map((sale) => (
              <div
                key={sale.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Header com ID, Data/Hora e Valor */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Venda #{sale.id}</h3>
                      <p className="text-white/90 text-sm flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        {new Date(sale.createdAt).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })} às {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">
                      {formatCurrency(sale.total)}
                    </p>
                    <button
                      onClick={() => handleDeleteSale(sale.id)}
                      className="mt-1 p-1.5 text-red-100 hover:text-white hover:bg-red-600/30 rounded-lg transition-all"
                      title="Deletar venda"
                    >
                      <Trash2 className="h-4 w-4 text-red-200" />
                    </button>
                  </div>
                </div>

                {/* Informações Principais */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cliente */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Cliente</p>
                      {sale.customer ? (
                        <div className="flex items-center space-x-2">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{sale.customer.name}</p>
                            <p className="text-xs text-gray-500">{sale.customer.phone}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Venda sem cliente</p>
                      )}
                    </div>

                    {/* Profissional */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Profissional</p>
                      {sale.professional ? (
                        <div className="flex items-center space-x-2">
                          <div className="h-10 w-10 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-stone-600" />
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{sale.professional}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Não informado</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div className="px-6 py-3 bg-white border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Forma de Pagamento:</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getPaymentMethodBadge(
                          sale.paymentMethod
                        )}`}
                      >
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </span>
                      {sale.paymentMethod === 'CARTAO_CREDITO' && sale.installments && sale.installments > 1 && (
                        <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                          {sale.installments}x de {formatCurrency(sale.installmentValue || 0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Itens da Venda */}
                <div className="px-6 py-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-3 flex items-center">
                    <ShoppingBag className="h-4 w-4 mr-1.5" />
                    Produtos e Serviços Consumidos
                  </p>
                  <div className="space-y-2">
                    {sale.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0">
                            <span className="text-sm font-bold text-amber-600">{item.quantity}x</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {item.product?.name || item.service?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(item.price)} cada
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
    </div>
  );
}
