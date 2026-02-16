'use client';

import { useState } from 'react';
import { TrendingUp, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function RelatoriosPage() {
  const { info } = useToast();
  const [reportType, setReportType] = useState('vendas');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const generateReport = () => {
    info('Funcionalidade de geração de relatórios em desenvolvimento');
  };

  return (
    <div className="page-container space-y-8 animate-fade-in mt-6">
      <div className="page-header">
        <h1 className="page-title">Relatórios</h1>
        <p className="page-subtitle">Análises e exportação de dados</p>
      </div>

      {/* Seletor de Relatório */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Gerar Relatório
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Relatório
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="vendas">Vendas</option>
              <option value="servicos">Serviços</option>
              <option value="despesas">Despesas</option>
              <option value="clientes">Clientes</option>
              <option value="produtos">Produtos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fim
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={generateReport}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg"
        >
          <Download className="h-5 w-5" />
          <span>Gerar e Baixar Relatório</span>
        </button>
      </div>

      {/* Relatórios Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Vendas do Mês
          </h3>
          <p className="text-sm text-gray-600">
            Relatório detalhado das vendas realizadas no mês atual
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Agendamentos
          </h3>
          <p className="text-sm text-gray-600">
            Análise de agendamentos por período e status
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            DRE - Demonstrativo
          </h3>
          <p className="text-sm text-gray-600">
            Demonstrativo de Resultados: receitas vs despesas
          </p>
        </div>
      </div>

      {/* Aviso */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <p className="text-blue-800">
          <strong>💡 Em desenvolvimento:</strong> Os relatórios detalhados serão gerados em formato PDF e Excel. Por enquanto, você pode visualizar as informações no Dashboard.
        </p>
        </div>
    </div>
  );
}
