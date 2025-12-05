'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Scissors, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditarServicoPage({ params }: PageProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
  });

  useEffect(() => {
    fetchService();
  }, [params.id]);

  const fetchService = async () => {
    try {
      const response = await fetch(`/api/services?id=${params.id}`);
      if (response.ok) {
        const data: Service = await response.json();
        setFormData({
          name: data.name,
          description: data.description || '',
          duration: data.duration.toString(),
          price: data.price.toString(),
        });
      } else {
        error('Erro ao carregar serviço');
      }
    } catch (err) {
      console.error('Erro ao carregar serviço:', err);
      error('Erro ao carregar serviço');
    } finally {
      setLoading(false);
    }
  };

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

    setSaving(true);

    try {
      const response = await fetch('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.id,
          name: formData.name,
          description: formData.description || null,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price),
        }),
      });

      if (response.ok) {
        success('Serviço atualizado com sucesso');
        router.push(`/admin/servicos/${params.id}`);
      } else {
        const errorData = await response.json();
        error(errorData.error || 'Erro ao atualizar serviço');
      }
    } catch (err) {
      console.error('Erro ao atualizar serviço:', err);
      error('Erro ao atualizar serviço');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-app">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-app">
      {/* Header */}
      <div className="mb-spacing-section">
        <Link href={`/admin/servicos/${params.id}`} className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 touch-target">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Link>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white">
          Editar Serviço
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Atualize as informações do serviço
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6 shadow-sm">
          {/* Form Fields - Grid 2 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            disabled={saving}
            className="touch-target"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="touch-target"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Scissors className="w-5 h-5 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
