'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Phone, Mail, Briefcase, Image as ImageIcon, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

export default function NovoProfissionalPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    specialty: '',
    active: true,
    photo: '',
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      error('Por favor, selecione um arquivo de imagem');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, photo: data.url }));
        success('Foto enviada com sucesso');
      } else {
        error('Erro ao enviar foto');
      }
    } catch (err) {
      console.error('Erro ao enviar foto:', err);
      error('Erro ao enviar foto');
    } finally {
      setUploading(false);
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
      const response = await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          specialty: formData.specialty || null,
          active: formData.active,
          photo: formData.photo || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        success('Profissional cadastrado com sucesso');
        router.push(`/admin/profissionais/${data.id}`);
      } else {
        const errorData = await response.json();
        error(errorData.error || 'Erro ao cadastrar profissional');
      }
    } catch (err) {
      console.error('Erro ao cadastrar profissional:', err);
      error('Erro ao cadastrar profissional');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <Link href="/admin/profissionais" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors min-h-[44px] gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <UserPlus className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Novo Profissional
            </h1>
          </div>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Adicione um novo membro à sua equipe
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 shadow-sm space-y-6">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
              Foto
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                {formData.photo ? (
                  <img
                    src={formData.photo}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <Users className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="photo"
                  className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {uploading ? 'Enviando...' : 'Escolher Foto'}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  JPG, PNG ou GIF. Máximo 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields - Grid 2 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Maria Silva"
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Especialidade */}
            <div className="md:col-span-2">
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Especialidade
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="Ex: Cabeleireiro, Manicure, Barbeiro"
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                Status
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.active}
                    onChange={() => setFormData({ ...formData, active: true })}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Ativo</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={!formData.active}
                    onChange={() => setFormData({ ...formData, active: false })}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Inativo</span>
                </label>
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
            disabled={loading || uploading}
            className="touch-target"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Cadastrando...
              </>
            ) : (
              <>
                <Users className="w-5 h-5 mr-2" />
                Cadastrar Profissional
              </>
            )}
          </Button>
        </div>
        </form>
      </div>
    </div>
  );
}
