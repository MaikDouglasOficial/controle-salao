'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Calendar, DollarSign, User, Trash2, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

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
    if (!confirm('Tem certeza que deseja excluir esta venda?')) {
      return;
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        fetchSales();
      } else {
        alert('Erro ao deletar venda');
      }
    } catch (error) {
      console.error('Erro ao deletar venda:', error);
      alert('Erro ao deletar venda');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalRevenue = filteredSales?.reduce((acc, sale) => acc + sale.total, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/30 to-orange-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header Aprimorado */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-in">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-amber-700 bg-clip-text text-transparent leading-tight pb-2">
                  Vendas
                </h1>
                <p className="text-xl text-gray-600 mt-2">
                  Histórico completo de todas as vendas
                </p>
              </div>
            </div>
            <div className="h-1 w-32 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full animate-slideRight"></div>
          </div>
        </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Filter className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Filtros</h3>
              <p className="text-sm text-gray-500">Refine sua busca</p>
            </div>
          </div>
          {(selectedPayment || startDate || endDate || selectedMonth || selectedYear) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-medium shadow-sm"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Calendar className="h-4 w-4 text-primary-600" />
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
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 font-medium shadow-sm hover:border-primary-300 disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Calendar className="h-4 w-4 text-primary-600" />
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
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 font-medium shadow-sm hover:border-primary-300 disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Calendar className="h-4 w-4 text-primary-600" />
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
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 font-medium shadow-sm hover:border-primary-300 disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
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
              <Calendar className="h-4 w-4 text-primary-600" />
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
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 font-medium shadow-sm hover:border-primary-300 disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Todos</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <DollarSign className="h-4 w-4 text-primary-600" />
              <span>Forma de Pagamento</span>
            </label>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 font-medium shadow-sm hover:border-primary-300"
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
          <div className="mt-6 p-4 bg-primary-50 border-2 border-primary-200 rounded-xl">
            <p className="text-sm font-semibold text-primary-900">
              Mostrando {filteredSales.length} de {sales.length} vendas
              {startDate && endDate && (
                <span className="ml-2 text-primary-700">
                  • Período: {new Date(startDate).toLocaleDateString('pt-BR')} até {new Date(endDate).toLocaleDateString('pt-BR')}
                </span>
              )}
              {selectedMonth && (
                <span className="ml-2 text-primary-700">
                  • Mês: {['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(selectedMonth)]}
                </span>
              )}
              {selectedYear && (
                <span className="ml-2 text-primary-700">• Ano: {selectedYear}</span>
              )}
              {selectedPayment && (
                <span className="ml-2 text-primary-700">• Pagamento: {selectedPayment}</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Lista de Vendas */}
      <div className="space-y-4">
        {filteredSales.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma venda encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredSales.map((sale) => (
              <div
                key={sale.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
              >
                {/* Header com ID, Data/Hora e Valor */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex items-center justify-between">
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
                      className="mt-1 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                      title="Deletar venda"
                    >
                      <Trash2 className="h-4 w-4" />
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
                          <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-primary-600" />
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
                            <span className="text-sm font-bold text-primary-600">{item.quantity}x</span>
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
    </div>
  );
}
