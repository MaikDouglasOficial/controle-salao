'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Calendar, DollarSign, User, Trash2, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface SalePayment {
  id: number;
  paymentMethod: string;
  value: number;
  installments: number | null;
  installmentValue: number | null;
}

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
  payments?: SalePayment[];
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
      type: 'danger',
      requirePassword: true
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
    return colors[method] || 'bg-stone-100 text-stone-700';
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
      <div className="page-header text-center">
        <h1 className="page-title">Vendas</h1>
        <p className="page-subtitle">Histórico de vendas</p>
      </div>

      {/* Resumo em cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
          <p className="text-sm text-stone-500 uppercase tracking-wide font-medium">Total de vendas</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">{filteredSales.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
          <p className="text-sm text-stone-500 uppercase tracking-wide font-medium">Receita total</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-stone-100 rounded-xl flex items-center justify-center">
              <Filter className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900">Filtros</h3>
              <p className="text-sm text-stone-500">Refine sua busca</p>
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
            <label className="flex items-center space-x-2 text-sm font-semibold text-stone-700">
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
              className="w-full h-11 px-4 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 text-sm disabled:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-stone-700">
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
              className="w-full h-11 px-4 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 text-sm disabled:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-stone-700">
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
              className="w-full h-11 px-4 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 text-sm disabled:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
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
            <label className="flex items-center space-x-2 text-sm font-semibold text-stone-700">
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
              className="w-full h-11 px-4 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 text-sm disabled:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Todos</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-stone-700">
              <DollarSign className="h-4 w-4 text-stone-600" />
              <span>Forma de Pagamento</span>
            </label>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full h-11 px-4 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 text-sm"
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
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center shadow-sm">
            <ShoppingBag className="h-16 w-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 font-medium">Nenhuma venda encontrada</p>
            <p className="text-sm text-stone-400 mt-1">Ajuste os filtros ou registre uma nova venda no PDV.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSales.map((sale) => (
              <div
                key={sale.id}
                className="bg-white rounded-lg border border-stone-200 overflow-hidden"
              >
                {/* Cabeçalho: ID, data e valor em uma linha */}
                <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-stone-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-semibold text-stone-900">#{sale.id}</span>
                    <span className="text-stone-400">·</span>
                    <span className="text-sm text-stone-500">
                      {new Date(sale.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' às '}
                      {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-stone-900">{formatCurrency(sale.total)}</span>
                    <button
                      onClick={() => handleDeleteSale(sale.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Excluir venda"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Cliente, profissional e pagamento em linhas compactas */}
                <div className="px-4 py-3 space-y-2 border-b border-stone-100 text-sm">
                  {sale.customer && (
                    <div className="flex justify-between gap-2">
                      <span className="text-stone-500">Cliente</span>
                      <span className="text-stone-900 font-medium truncate">{sale.customer.name}</span>
                    </div>
                  )}
                  {sale.professional && (
                    <div className="flex justify-between gap-2">
                      <span className="text-stone-500">Profissional</span>
                      <span className="text-stone-900 truncate">{sale.professional}</span>
                    </div>
                  )}
                  {/* Detalhamento completo do pagamento */}
                  <div className="space-y-1.5">
                    <span className="text-stone-500 block">Pagamento</span>
                    {sale.payments && sale.payments.length > 0 ? (
                      <ul className="space-y-1">
                        {sale.payments.map((p) => (
                          <li key={p.id} className="flex justify-between items-center gap-2 text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPaymentMethodBadge(p.paymentMethod)}`}>
                              {getPaymentMethodLabel(p.paymentMethod)}
                              {p.paymentMethod === 'CARTAO_CREDITO' && p.installments != null && p.installments > 1 && (
                                <span className="ml-1">{p.installments}×</span>
                              )}
                            </span>
                            <span className="font-medium text-stone-900">
                              {formatCurrency(p.value)}
                              {p.paymentMethod === 'CARTAO_CREDITO' && p.installments != null && p.installments > 1 && p.installmentValue != null && (
                                <span className="text-stone-500 font-normal text-xs ml-1">
                                  ({formatCurrency(p.installmentValue)}/parcela)
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <>
                        <div className="flex justify-between items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPaymentMethodBadge(sale.paymentMethod)}`}>
                            {getPaymentMethodLabel(sale.paymentMethod)}
                          </span>
                          <span className="font-medium text-stone-900">{formatCurrency(sale.total)}</span>
                        </div>
                        {sale.paymentMethod === 'CARTAO_CREDITO' && sale.installments != null && sale.installments > 1 && (
                          <div className="text-stone-500 text-xs">
                            {sale.installments}× de {formatCurrency(sale.installmentValue || 0)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Itens: lista simples */}
                <div className="px-4 py-3">
                  <div className="space-y-1.5">
                    {sale.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-baseline gap-2 text-sm">
                        <span className="text-stone-700 truncate">
                          {item.quantity}× {item.product?.name || item.service?.name}
                        </span>
                        <span className="text-stone-900 font-medium whitespace-nowrap">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
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
