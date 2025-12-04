'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Trash2, Receipt, Tag, DollarSign, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';

interface Expense {
  id: number;
  name: string;
  category: string;
  value: number;
  type: string;
  date: string;
  notes: string | null;
  createdAt: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function VisualizarDespesaPage({ params }: PageProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchExpense();
  }, [params.id]);

  const fetchExpense = async () => {
    try {
      const response = await fetch(`/api/expenses?id=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setExpense(data);
      } else {
        error('Erro ao carregar despesa');
      }
    } catch (err) {
      console.error('Erro ao carregar despesa:', err);
      error('Erro ao carregar despesa');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/expenses?id=${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        success('Despesa excluída com sucesso');
        router.push('/admin/despesas');
      } else {
        const errorData = await response.json();
        error(errorData.error || 'Erro ao excluir despesa');
      }
    } catch (err) {
      console.error('Erro ao excluir despesa:', err);
      error('Erro ao excluir despesa');
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

  if (!expense) {
    return (
      <div className="container-app">
        <ErrorState
          title="Despesa não encontrada"
          message="Não foi possível carregar as informações da despesa."
          onRetry={fetchExpense}
        />
      </div>
    );
  }

  return (
    <div className="container-app">
      {/* Header */}
      <div className="mb-spacing-section">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 touch-target"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white">
              {expense.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Detalhes da despesa
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/despesas/${params.id}/editar`)}
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

      {/* Expense Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
              Informações da Despesa
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Nome
                </label>
                <p className="text-base text-gray-900 dark:text-white">
                  {expense.name}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Categoria
                  </label>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <p className="text-base text-gray-900 dark:text-white">
                      {expense.category}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Tipo
                  </label>
                  {expense.type === 'FIXA' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      Fixa
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                      Variável
                    </span>
                  )}
                </div>
              </div>

              {expense.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Observações
                  </label>
                  <div className="flex items-start gap-2 mt-2">
                    <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap">
                      {expense.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Value Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Valor
                </label>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  R$ {expense.value.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          {/* Date Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Data
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(expense.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              Informações do Sistema
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Cadastrada em:</span>
                <p className="text-gray-900 dark:text-white font-medium">
                  {new Date(expense.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
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
                  Tem certeza que deseja excluir a despesa <strong>{expense.name}</strong>? Esta ação não pode ser desfeita.
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
