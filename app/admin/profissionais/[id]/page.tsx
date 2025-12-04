'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Edit2, Trash2, Users, UserCheck, UserX, Phone, Mail, Briefcase, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';

interface Professional {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  active: boolean;
  photo: string | null;
  createdAt: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function VisualizarProfissionalPage({ params }: PageProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProfessional();
  }, [params.id]);

  const fetchProfessional = async () => {
    try {
      const response = await fetch(`/api/professionals?id=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfessional(data);
      } else {
        error('Erro ao carregar profissional');
      }
    } catch (err) {
      console.error('Erro ao carregar profissional:', err);
      error('Erro ao carregar profissional');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/professionals?id=${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        success('Profissional excluído com sucesso');
        router.push('/admin/profissionais');
      } else {
        const errorData = await response.json();
        error(errorData.error || 'Erro ao excluir profissional');
      }
    } catch (err) {
      console.error('Erro ao excluir profissional:', err);
      error('Erro ao excluir profissional');
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

  if (!professional) {
    return (
      <div className="container-app">
        <ErrorState
          title="Profissional não encontrado"
          message="Não foi possível carregar as informações do profissional."
          onRetry={fetchProfessional}
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
              {professional.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Detalhes do profissional
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/profissionais/${params.id}/editar`)}
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

      {/* Professional Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo and Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                {professional.photo ? (
                  <Image
                    src={professional.photo}
                    alt={professional.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <Users className="w-16 h-16" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Nome Completo
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {professional.name}
                  </p>
                </div>
                {professional.specialty && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Especialidade
                    </label>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <p className="text-base text-gray-900 dark:text-white">
                        {professional.specialty}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações de Contato
            </h2>
            <div className="space-y-4">
              {professional.phone ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                      Telefone
                    </label>
                    <p className="text-base text-gray-900 dark:text-white">
                      {professional.phone}
                    </p>
                  </div>
                </div>
              ) : null}

              {professional.email ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                      Email
                    </label>
                    <p className="text-base text-gray-900 dark:text-white break-all">
                      {professional.email}
                    </p>
                  </div>
                </div>
              ) : null}

              {!professional.phone && !professional.email && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Nenhuma informação de contato cadastrada
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              Status
            </label>
            {professional.active ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-900 dark:text-green-300">Ativo</p>
                  <p className="text-sm text-green-700 dark:text-green-400">Disponível para agendamentos</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-red-900 dark:text-red-300">Inativo</p>
                  <p className="text-sm text-red-700 dark:text-red-400">Não disponível</p>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              Informações do Sistema
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Cadastrado em:</span>
                <p className="text-gray-900 dark:text-white font-medium">
                  {new Date(professional.createdAt).toLocaleDateString('pt-BR', {
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
                  Tem certeza que deseja excluir o profissional <strong>{professional.name}</strong>? Esta ação não pode ser desfeita.
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
