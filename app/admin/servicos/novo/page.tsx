'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Scissors, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

export default function NovoServicoPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      error('Nome do serviço é obrigatório');
      return;
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      error('Duração deve ser maior que zero');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      error('Preço deve ser maior que zero');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        success('Serviço cadastrado com sucesso');
        router.push(`/admin/servicos/${data.id}`);
      } else {
        const errorData = await response.json();
        error(errorData.error || 'Erro ao cadastrar serviço');
      }
    } catch (err) {
      console.error('Erro ao cadastrar serviço:', err);
      error('Erro ao cadastrar serviço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <Link href="/admin/servicos" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors min-h-[44px] gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Scissors className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Novo Serviço
            </h1>
          </div>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Adicione um novo serviço ao catálogo
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 shadow-sm space-y-6">
          {/* Form Fields - Grid 2 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Serviço <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Corte de Cabelo"
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada do serviço..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            {/* Duração */}
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duração (minutos) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="Ex: 30"
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Preço */}
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preço <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0,00"
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
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
                <Scissors className="w-5 h-5 mr-2" />
                Cadastrar Serviço
              </>
            )}
          </Button>
        </div>
        </form>
      </div>
    </div>
  );
}
