'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Pencil, Trash2, UserCheck, UserX, Users, BarChart3 } from 'lucide-react';
import ProfissionalEditarModal from '@/components/ProfissionalEditarModal';
import PhotoViewerModal from '@/components/PhotoViewerModal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useScrollToTopOnFocus } from '@/hooks/useScrollToTopOnFocus';
import { fetchAuth } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ActionsMenu } from '@/components/ui/ActionsMenu';

interface Professional {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  commissionPercentage: number;
  active: boolean;
  photo: string | null;
  createdAt: string;
}

export default function ProfessionalsPage() {
  const { success, error, confirm } = useToast();
  const router = useRouter();
  const scrollToTopOnFocus = useScrollToTopOnFocus();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Modal de criar/editar
  const [showModal, setShowModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [photoViewUrl, setPhotoViewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      const response = await fetchAuth('/api/professionals');
      
      if (!response.ok) {
        setApiError('A API de profissionais não está disponível. Execute a migration do banco de dados.');
        throw new Error('Erro ao buscar profissionais');
      }
      
      const data = await response.json();
      setProfessionals(Array.isArray(data) ? data : []);
      setApiError(null);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      setProfessionals([]);
      if (!apiError) {
        setApiError('Não foi possível carregar os profissionais. Verifique se executou: npx prisma migrate dev --name add_professional_model');
      }
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteProfessional = async (professional: Professional) => {
    const confirmed = await confirm({
      title: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o profissional "${professional.name}"?`,
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      requirePassword: true
    });

    if (!confirmed) return;

    try {
      const response = await fetchAuth(`/api/professionals?id=${professional.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar profissional');
      }

      await fetchProfessionals();
      success('Profissional removido com sucesso!');
    } catch (error: any) {
      console.error('Erro ao deletar profissional:', error);
      error(error.message || 'Erro ao deletar profissional');
    }
  };

  // Filtrar profissionais
  const filteredProfessionals = Array.isArray(professionals) ? professionals.filter(prof => {
    const matchesSearch = prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prof.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prof.phone?.includes(searchTerm);
    
    const matchesActive = filterActive === 'all' || 
                         (filterActive === 'active' && prof.active) ||
                         (filterActive === 'inactive' && !prof.active);
    
    return matchesSearch && matchesActive;
  }) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 mt-6">
      <div className="page-header">
        <h1 className="page-title">Profissionais</h1>
        <p className="page-subtitle">Equipe do salão</p>
      </div>

      <button
        onClick={() => { setEditingProfessional(null); setShowModal(true); }}
        className="fixed bottom-6 right-6 w-12 h-12 bg-black text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all z-50"
        aria-label="Novo Profissional"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Resumo em cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{professionals.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Ativos</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">{professionals.filter((p) => p.active).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Inativos</p>
          <p className="mt-1 text-2xl font-semibold text-gray-600">{professionals.filter((p) => !p.active).length}</p>
        </div>
      </div>
      {/* Aviso de Erro da API */}
      {apiError && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Atenção: Configuração necessária</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>{apiError}</p>
                <p className="mt-2">
                  <strong>Comandos necessários:</strong>
                </p>
                <pre className="mt-1 bg-amber-100 p-2 rounded text-xs overflow-x-auto">
                  npx prisma migrate dev --name add_professional_model{'\n'}
                  npx prisma generate{'\n'}
                  npm run prisma:seed
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros - sticky para manter busca no mesmo lugar ao rolar */}
      <div className="sticky top-0 z-10 bg-[var(--bg-main)] pt-1 pb-2 -mx-1 px-1">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, especialidade ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={scrollToTopOnFocus}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterActive('all')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActive === 'all'
                  ? 'bg-stone-700 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActive === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActive === 'inactive'
                  ? 'bg-red-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Inativos
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Lista de Profissionais */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-visible md:overflow-hidden">
        <div className="md:hidden divide-y divide-gray-100">
          {filteredProfessionals.length === 0 ? (
            <div className="min-h-[200px] flex items-center justify-center px-5 py-10 text-center text-sm text-gray-500">
              Nenhum profissional encontrado
            </div>
          ) : (
            filteredProfessionals.map((professional) => (
              <div key={professional.id} className="p-4 pr-2 pt-4 pb-5 space-y-4">
                {/* Topo: foto, nome, status + três pontinhos alinhados ao topo */}
                <div className="flex items-start gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className={`relative w-12 h-12 rounded-full overflow-hidden bg-stone-100 flex-shrink-0 ${professional.photo ? 'cursor-pointer' : ''}`}
                      role={professional.photo ? 'button' : undefined}
                      onClick={professional.photo ? (e) => { e.stopPropagation(); setPhotoViewUrl(professional.photo!); } : undefined}
                    >
                      {professional.photo ? (
                        <Image
                          src={professional.photo}
                          alt={professional.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <Users className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{professional.name}</span>
                        {professional.active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <UserCheck size={10} />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
                            <UserX size={10} />
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{professional.specialty || 'Sem especialidade'}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 pt-0.5">
                    <ActionsMenu
                      alignRight={true}
                      items={[
                        { icon: BarChart3, label: 'Ver informações', onClick: () => router.push(`/admin/profissionais/${professional.id}`) },
                        { icon: Pencil, label: 'Editar informações', onClick: () => { setEditingProfessional(professional); setShowModal(true); } },
                        { icon: Trash2, label: 'Excluir', onClick: () => handleDeleteProfessional(professional), danger: true },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <p className="text-gray-600">
                    <span className="text-gray-400">Telefone</span>
                    <span className="ml-2 text-gray-900">{professional.phone || '–'}</span>
                  </p>
                  <p className="text-gray-600 break-all">
                    <span className="text-gray-400">Email</span>
                    <span className="ml-2 text-gray-900">{professional.email || '–'}</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidade</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredProfessionals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">
                    Nenhum profissional encontrado
                  </td>
                </tr>
              ) : (
                filteredProfessionals.map((professional) => (
                  <tr key={professional.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`relative w-10 h-10 rounded-full overflow-hidden bg-stone-100 flex-shrink-0 ${professional.photo ? 'cursor-pointer' : ''}`}
                          role={professional.photo ? 'button' : undefined}
                          onClick={professional.photo ? () => setPhotoViewUrl(professional.photo!) : undefined}
                        >
                          {professional.photo ? (
                            <Image
                              src={professional.photo}
                              alt={professional.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <Users className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{professional.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
                      {professional.specialty || '–'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
                      {professional.phone || '–'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
                      {professional.email || '–'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {professional.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <UserCheck size={12} />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
                          <UserX size={12} />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        <ActionsMenu
                          items={[
                            { icon: BarChart3, label: 'Ver informações', onClick: () => router.push(`/admin/profissionais/${professional.id}`) },
                            { icon: Pencil, label: 'Editar informações', onClick: () => { setEditingProfessional(professional); setShowModal(true); } },
                            { icon: Trash2, label: 'Excluir', onClick: () => handleDeleteProfessional(professional), danger: true },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de criar/editar profissional */}
      {showModal && (
        <ProfissionalEditarModal
          profissional={editingProfessional ? {
            ...editingProfessional,
            phone: editingProfessional.phone ?? '',
            email: editingProfessional.email ?? '',
            specialty: editingProfessional.specialty ?? '',
            photo: editingProfessional.photo ?? '',
          } : undefined}
          onSave={async (data) => {
            try {
              const method = editingProfessional ? 'PUT' : 'POST';
              const url = editingProfessional ? `/api/professionals?id=${editingProfessional.id}` : '/api/professionals';
              const response = await fetchAuth(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });
              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao salvar profissional');
              }
              await fetchProfessionals();
              setShowModal(false);
              setEditingProfessional(null);
              success(editingProfessional ? 'Profissional atualizado com sucesso!' : 'Profissional cadastrado com sucesso!');
            } catch (error: any) {
              error(error.message || 'Erro ao salvar profissional.');
            }
          }}
          onClose={() => { setShowModal(false); setEditingProfessional(null); }}
        />
      )}
      {photoViewUrl && (
        <PhotoViewerModal
          src={photoViewUrl}
          alt="Foto do profissional"
          isOpen
          onClose={() => setPhotoViewUrl(null)}
        />
      )}
    </div>
  );
}
