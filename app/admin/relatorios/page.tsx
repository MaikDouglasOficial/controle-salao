'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

type ReportType = 'vendas' | 'despesas' | 'dre';

interface Sale {
  id: number;
  date: string;
  createdAt: string;
  total: number;
  professional: string | null;
  customer: { name: string } | null;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

function getFirstDayOfMonth(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function getLastDayOfMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return d.toISOString().slice(0, 10);
}

function filterByDateRange<T>(items: T[], start: string, end: string, getDate: (item: T) => string): T[] {
  if (!start && !end) return items;
  const startD = start ? new Date(start) : new Date('1900-01-01');
  const endD = end ? new Date(end) : new Date('2100-12-31');
  startD.setHours(0, 0, 0, 0);
  endD.setHours(23, 59, 59, 999);
  return items.filter(item => {
    const date = new Date(getDate(item));
    return date >= startD && date <= endD;
  });
}

function downloadCSV(filename: string, rows: string[][]) {
  const BOM = '\uFEFF';
  const csv = BOM + rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function RelatoriosPage() {
  const { success, error } = useToast();
  const [reportType, setReportType] = useState<ReportType>('vendas');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    totalVendas?: number;
    totalDespesas?: number;
    countVendas?: number;
    countDespesas?: number;
    vendas?: Sale[];
    despesas?: Expense[];
  } | null>(null);

  useEffect(() => {
    setStartDate(getFirstDayOfMonth());
    setEndDate(getLastDayOfMonth());
  }, []);

  const generateReport = async () => {
    setResult(null);
    setLoading(true);
    try {
      if (reportType === 'vendas' || reportType === 'dre') {
        const res = await fetch('/api/sales');
        if (!res.ok) throw new Error('Erro ao buscar vendas');
        const sales: Sale[] = await res.json();
        const filtered = filterByDateRange(sales, startDate, endDate, s => s.date ?? s.createdAt);
        setResult(prev => ({
          ...prev,
          vendas: filtered,
          totalVendas: filtered.reduce((acc, s) => acc + Number(s.total), 0),
          countVendas: filtered.length,
        }));
      }
      if (reportType === 'despesas' || reportType === 'dre') {
        const res = await fetch('/api/expenses');
        if (!res.ok) throw new Error('Erro ao buscar despesas');
        const expenses: Expense[] = await res.json();
        const filtered = filterByDateRange(expenses, startDate, endDate, e => e.date);
        const totalExp = filtered.reduce((acc, e) => acc + Number(e.amount), 0);
        setResult(prev => ({
          ...prev,
          despesas: filtered,
          totalDespesas: totalExp,
          countDespesas: filtered.length,
        }));
      }
      success('Relatório gerado.');
    } catch (e) {
      console.error(e);
      error('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!result) return;
    const period = `${startDate || 'inicio'}_${endDate || 'fim'}`;
    if (result.vendas && result.vendas.length > 0) {
      const rows: string[][] = [
        ['Data', 'Total (R$)', 'Profissional', 'Cliente'],
        ...result.vendas.map(s => [
          formatDate(s.date ?? s.createdAt),
          (s.total ?? 0).toFixed(2).replace('.', ','),
          s.professional ?? '',
          s.customer?.name ?? '',
        ]),
      ];
      downloadCSV(`relatorio_vendas_${period}.csv`, rows);
      success('CSV de vendas baixado.');
    }
    if (result.despesas && result.despesas.length > 0) {
      const rows: string[][] = [
        ['Data', 'Descrição', 'Categoria', 'Valor (R$)'],
        ...result.despesas.map(e => [
          formatDate(e.date),
          e.description,
          e.category,
          (e.amount ?? 0).toFixed(2).replace('.', ','),
        ]),
      ];
      downloadCSV(`relatorio_despesas_${period}.csv`, rows);
      success('CSV de despesas baixado.');
    }
  };

  const hasResult = result && (result.countVendas !== undefined || result.countDespesas !== undefined);
  const hasExport = hasResult && ((result.vendas && result.vendas.length > 0) || (result.despesas && result.despesas.length > 0));

  return (
    <div className="page-container space-y-6 animate-fade-in mt-6">
      <div className="page-header">
        <h1 className="page-title">Relatórios</h1>
        <p className="page-subtitle">Vendas, despesas e DRE por período</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-amber-600" />
          Gerar relatório
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Tipo</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value as ReportType)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-stone-900"
            >
              <option value="vendas">Vendas</option>
              <option value="despesas">Despesas</option>
              <option value="dre">DRE (Receitas x Despesas)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Data início</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-stone-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Data fim</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-stone-900"
            />
          </div>
        </div>

        <div className={`grid gap-3 w-full ${hasExport ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            <span>{loading ? 'Gerando...' : 'Gerar'}</span>
          </button>
          {hasExport && (
            <button
              onClick={exportCSV}
              className="flex items-center justify-center gap-2 w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              <FileSpreadsheet className="h-5 w-5" />
              Baixar CSV
            </button>
          )}
        </div>
      </div>

      {hasResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Resumo do período</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.totalVendas !== undefined && (
              <div className="bg-stone-50 rounded-lg p-4 border border-stone-100">
                <p className="text-sm text-stone-600">Total vendas</p>
                <p className="text-xl font-semibold text-amber-700">{formatCurrency(result.totalVendas)}</p>
                <p className="text-xs text-stone-500">{result.countVendas} venda(s)</p>
              </div>
            )}
            {result.totalDespesas !== undefined && (
              <div className="bg-stone-50 rounded-lg p-4 border border-stone-100">
                <p className="text-sm text-stone-600">Total despesas</p>
                <p className="text-xl font-semibold text-stone-700">{formatCurrency(result.totalDespesas ?? 0)}</p>
                <p className="text-xs text-stone-500">{result.countDespesas} despesa(s)</p>
              </div>
            )}
            {reportType === 'dre' && result.totalVendas !== undefined && result.totalDespesas !== undefined && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 sm:col-span-2">
                <p className="text-sm text-stone-600">Resultado (Receita − Despesas)</p>
                <p className={`text-xl font-semibold ${(result.totalVendas - result.totalDespesas) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(result.totalVendas - result.totalDespesas)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
