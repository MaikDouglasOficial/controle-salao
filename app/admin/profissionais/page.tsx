'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Pencil, Trash2, UserCheck, UserX, Users, BarChart3 } from 'lucide-react';
import ProfissionalEditarModal from '@/components/ProfissionalEditarModal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

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
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Modal de criar/editar
  const [showModal, setShowModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      const response = await fetch('/api/professionals');
      
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
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/professionals?id=${professional.id}`, {
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
    <div className="page-container space-y-6">
        {/* Header Minimalista */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Removido título e subtítulo para visual minimalista */}
              {/* Botão flutuante de novo profissional */}
                <button
                  onClick={() => { setEditingProfessional(null); setShowModal(true); }}
                  className="fixed bottom-6 right-6 w-12 h-12 bg-black text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all z-50"
                  aria-label="Novo Profissional"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-1 space-y-1 my-1">
          <div className="text-sm text-gray-700">
            Total de profissionais: <span className="font-semibold text-gray-900">{professionals.length}</span>
          </div>
          <div className="text-sm text-gray-700">
            Ativos: <span className="font-semibold text-gray-900">{professionals.filter((p) => p.active).length}</span>
          </div>
          <div className="text-sm text-gray-700">
            Inativos: <span className="font-semibold text-gray-900">{professionals.filter((p) => !p.active).length}</span>
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

      {/* ...existing code... */}
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, especialidade ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filtro Status */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterActive('all')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                filterActive === 'all'
                  ? 'bg-gray-300 text-gray-900 shadow-inner ring-2 ring-gray-400'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                filterActive === 'active'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                filterActive === 'inactive'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inativos
            </button>
          </div>
        </div>
      </div>
      {/* ...existing code... */}
      {/* Lista de Profissionais */}
            {/* ...existing code... */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="md:hidden divide-y divide-gray-200">
          {filteredProfessionals.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              Nenhum profissional encontrado
            </div>
          ) : (
            filteredProfessionals.map((professional) => (
              <div key={professional.id} className="p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    {professional.photo ? (
                      <Image
                        src={professional.photo}
                        alt={professional.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Users className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {professional.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {professional.specialty || '-'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                  <div>
                    <span className="text-xs text-gray-400">Telefone</span>
                    <div className="font-medium text-gray-700">{professional.phone || '-'}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Email</span>
                    <div className="font-medium text-gray-700 break-words">{professional.email || '-'}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Status</span>
                    <div>
                      {professional.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <UserCheck size={12} />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <UserX size={12} />
                          Inativo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                        <div className="flex items-center justify-start space-x-2 pt-2">
                  <Button
                    onClick={() => router.push(`/admin/profissionais/${professional.id}`)}
                    variant="secondary"
                    size="sm"
                    icon={BarChart3}
                  />
                  <Button
                    onClick={() => { setEditingProfessional(professional); setShowModal(true); }}
                    variant="edit"
                    size="sm"
                    icon={Pencil}
                  />
                  <Button
                    onClick={() => handleDeleteProfessional(professional)}
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block table-responsive">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProfessionals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Nenhum profissional encontrado
                  </td>
                </tr>
              ) : (
                filteredProfessionals.map((professional) => (
                  <tr key={professional.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          {professional.photo ? (
                            <Image
                              src={professional.photo}
                              alt={professional.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Users className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="font-medium text-gray-900">{professional.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {professional.specialty || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {professional.phone || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {professional.email || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {professional.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <UserCheck size={12} />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <UserX size={12} />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Button
                          onClick={() => router.push(`/admin/profissionais/${professional.id}`)}
                          variant="secondary"
                          size="sm"
                          icon={BarChart3}
                        />
                        <Button
                          onClick={() => { setEditingProfessional(professional); setShowModal(true); }}
                          variant="edit"
                          size="sm"
                          icon={Pencil}
                        />
                        <Button
                          onClick={() => handleDeleteProfessional(professional)}
                          variant="danger"
                          size="sm"
                          icon={Trash2}
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
              const response = await fetch(url, {
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

    </div>
  );
}
