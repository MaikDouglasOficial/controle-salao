'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { fetchAuth } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/Layout';

interface Professional {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  active: boolean;
}

export default function EditarProfissionalPage() {
  const { success, error } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [professional, setProfessional] = useState<Professional | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    specialty: '',
    active: true,
  });

  useEffect(() => {
    if (params.id) {
      fetchProfessional();
    }
  }, [params.id]);

  const fetchProfessional = async () => {
    try {
      const response = await fetchAuth(`/api/professionals/${params.id}`);
      if (!response.ok) {
        throw new Error('Profissional não encontrado');
      }
      
      const data = await response.json();
      setProfessional(data);
      setFormData({
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        specialty: data.specialty || '',
        active: data.active,
      });
    } catch (err) {
      console.error('Erro ao buscar profissional:', err);
      error('Erro ao carregar dados do profissional');
      router.push('/admin/profissionais');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      error('Nome é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const response = await fetchAuth('/api/professionals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar profissional');
      }

      success('Profissional atualizado com sucesso!');
      router.push('/admin/profissionais');
    } catch (err: any) {
      console.error('Erro ao atualizar profissional:', err);
      error(err.message || 'Erro ao atualizar profissional');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <p className="text-gray-500">Profissional não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 mt-6">
      <div className="page-header relative">
        <div className="absolute left-0 top-0">
          <Link href="/admin/profissionais" className="flex items-center text-amber-700 hover:text-amber-800 font-medium">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Link>
        </div>
        <h1 className="page-title">Editar profissional</h1>
        <p className="page-subtitle">Atualize os dados de {professional.name}</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ex: Maria Silva"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialidade
              </label>
              <input
                type="text"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ex: Cabeleireiro, Manicure, Barbeiro..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  Profissional ativo (pode receber agendamentos)
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <Link
              href="/admin/profissionais"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
