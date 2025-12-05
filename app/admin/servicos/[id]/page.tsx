'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2, Scissors, Clock, DollarSign, AlertTriangle } from 'lucide-react';
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

export default function VisualizarServicoPage({ params }: PageProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchService();
  }, [params.id]);

  const fetchService = async () => {
    try {
      const response = await fetch(`/api/services?id=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setService(data);
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

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/services?id=${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        success('Serviço excluído com sucesso');
        router.push('/admin/servicos');
      } else {
        const errorData = await response.json();
        error(errorData.error || 'Erro ao excluir serviço');
      }
    } catch (err) {
      console.error('Erro ao excluir serviço:', err);
      error('Erro ao excluir serviço');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
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

  if (!service) {
    return (
      <div className="container-app">
        <ErrorState
          title="Serviço não encontrado"
          message="Não foi possível carregar as informações do serviço."
          onRetry={fetchService}
        />
      </div>
    );
  }

  return (
    <div className="container-app">
      {/* Header */}
      <div className="mb-spacing-section">
        <Link href="/admin/servicos" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 touch-target">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white">
              {service.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Detalhes do serviço
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/servicos/${params.id}/editar`)}
              className="touch-target"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="touch-target text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </div>

      {/* Service Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Scissors className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Informações Básicas
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Nome do Serviço
                </label>
                <p className="text-base text-gray-900 dark:text-white">
                  {service.name}
                </p>
              </div>
              {service.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Descrição
                  </label>
                  <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap">
                    {service.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Duration Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Duração
                </label>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {service.duration} min
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Price Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Preço
                </label>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  R$ {service.price.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Confirmar Exclusão
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tem certeza que deseja excluir o serviço <strong>{service.name}</strong>? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="touch-target"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="touch-target bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
