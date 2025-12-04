'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { ArrowLeft, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';

export default function NovoClientePage() {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    aniversario: '',
    observacoes: '',
    photo: '',
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
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
        const { url } = await response.json();
        setForm((f) => ({ ...f, photo: url }));
        setPhotoPreview(url);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao fazer upload');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setForm((f) => ({ ...f, photo: '' }));
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nome,
          email: form.email,
          phone: form.telefone,
          cpf: form.cpf,
          birthday: form.aniversario,
          notes: form.observacoes,
          photo: form.photo || null,
        }),
      });
      
      if (response.ok) {
        toast.success('Cliente criado com sucesso!');
        router.push('/admin/clientes');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar cliente');
      }
    } catch (error) {
      toast.error('Erro ao salvar cliente');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/clientes">
            <Button variant="ghost" icon={ArrowLeft} size="sm">
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Novo Cliente</h1>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados do cliente</p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Upload de Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto do Cliente
            </label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative">
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    width={100}
                    height={100}
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button
                    type="button"
                    variant="outline"
                    icon={Camera}
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? 'Enviando...' : 'Selecionar Foto'}
                  </Button>
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG ou GIF. Máximo 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              id="nome"
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Digite o nome completo"
            />
          </div>

          {/* CPF */}
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-2">
              CPF
            </label>
            <input
              type="text"
              id="cpf"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="000.000.000-00"
            />
          </div>

          {/* Telefone */}
          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
              Telefone *
            </label>
            <input
              type="tel"
              id="telefone"
              required
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="email@exemplo.com"
            />
          </div>

          {/* Aniversário */}
          <div>
            <label htmlFor="aniversario" className="block text-sm font-medium text-gray-700 mb-2">
              Data de Nascimento
            </label>
            <input
              type="date"
              id="aniversario"
              value={form.aniversario}
              onChange={(e) => setForm({ ...form, aniversario: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              id="observacoes"
              rows={4}
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Informações adicionais sobre o cliente..."
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/clientes')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              Salvar Cliente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
