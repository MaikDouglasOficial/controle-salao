'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Receipt, Tag, DollarSign, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

export default function NovaDespesaPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    value: '',
    type: 'VARIAVEL',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      error('Nome da despesa é obrigatório');
      return;
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      error('Valor deve ser maior que zero');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category || 'Outros',
          value: parseFloat(formData.value),
          type: formData.type,
          date: new Date(formData.date).toISOString(),
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        success('Despesa cadastrada com sucesso');
        router.push(`/admin/despesas/${data.id}`);
      } else {
        const errorData = await response.json();
        error(errorData.error || 'Erro ao cadastrar despesa');
      }
    } catch (err) {
      console.error('Erro ao cadastrar despesa:', err);
      error('Erro ao cadastrar despesa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <Link href="/admin/despesas" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors min-h-[44px] gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <Receipt className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Nova Despesa
            </h1>
          </div>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Registre uma nova despesa do salão
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 shadow-sm space-y-6">
          {/* Form Fields - Grid 2 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome da Despesa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Aluguel do salão"
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoria <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="Aluguel">Aluguel</option>
                  <option value="Água">Água</option>
                  <option value="Luz">Luz</option>
                  <option value="Internet">Internet</option>
                  <option value="Produtos">Produtos</option>
                  <option value="Equipamentos">Equipamentos</option>
                  <option value="Salários">Salários</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Impostos">Impostos</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0,00"
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="FIXA">Fixa</option>
                <option value="VARIAVEL">Variável</option>
              </select>
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observações
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais sobre a despesa..."
                  rows={3}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="touch-target"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="touch-target"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Cadastrando...
              </>
            ) : (
              <>
                <Receipt className="w-5 h-5 mr-2" />
                Cadastrar Despesa
              </>
            )}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
}
