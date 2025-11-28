'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Search, Edit2, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import ProfissionalEditarModal from '@/components/ProfissionalEditarModal';
import { Button } from '@/components/ui/Button';
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

export default function ProfessionalsPage() {
  const { success, error } = useToast();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Modal de criar/editar
  const [showModal, setShowModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  // Modal de deletar
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProfessional, setDeletingProfessional] = useState<Professional | null>(null);

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



  const handleDeleteProfessional = async () => {
    if (!deletingProfessional) return;

    try {
      const response = await fetch(`/api/professionals?id=${deletingProfessional.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar profissional');
      }

      await fetchProfessionals();
      setShowDeleteModal(false);
      setDeletingProfessional(null);
      success('Profissional removido com sucesso!');
    } catch (error: any) {
      console.error('Erro ao deletar profissional:', error);
      error(error.message || 'Erro ao deletar profissional');
    }
  };

  const handleDeleteClick = (professional: Professional) => {
    setDeletingProfessional(professional);
    setShowDeleteModal(true);
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Minimalista */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Profissionais
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie sua equipe
            </p>
          </div>
          <Button
            onClick={() => { setEditingProfessional(null); setShowModal(true); }}
            icon={Plus}
            size="lg"
          >
            Novo Profissional
          </Button>
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
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
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

      {/* Lista de Profissionais */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                  Nome
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                  Especialidade
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                  Telefone
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                  Email
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProfessionals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <p className="text-gray-500">Nenhum profissional encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredProfessionals.map((professional) => (
                  <tr key={professional.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex-shrink-0">
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
                    <td className="py-4 px-6 text-gray-600">
                      {professional.specialty || '-'}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {professional.phone || '-'}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {professional.email || '-'}
                    </td>
                    <td className="py-4 px-6">
                      {professional.active ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                          <UserCheck size={14} />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                          <UserX size={14} />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => { setEditingProfessional(professional); setShowModal(true); }}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(professional)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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

      {/* Modal Confirmar Exclusão */}
      {showDeleteModal && deletingProfessional && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirmar Exclusão</h2>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o profissional <strong className="text-gray-900">{deletingProfessional.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingProfessional(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteProfessional}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium shadow-lg"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
