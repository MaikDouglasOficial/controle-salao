import { ModalBase as Modal } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface ProfissionalEditarModalProps {
  profissional?: {
    id?: number;
    name?: string;
    phone?: string;
    email?: string;
    specialty?: string;
    commissionPercentage?: number;
    active?: boolean;
    photo?: string;
  };
  onSave: (profissional: any) => void;
  onClose: () => void;
}

export default function ProfissionalEditarModal({ profissional, onSave, onClose }: ProfissionalEditarModalProps) {
  const { error } = useToast();
  const [name, setName] = useState<string>(profissional?.name || '');
  const [specialty, setSpecialty] = useState<string>(profissional?.specialty || '');
  const [phone, setPhone] = useState<string>(profissional?.phone || '');
  const [email, setEmail] = useState<string>(profissional?.email || '');
  const [commissionPercentage, setCommissionPercentage] = useState<number>(
    typeof profissional?.commissionPercentage === 'number' ? profissional.commissionPercentage : 0
  );
  const [active, setActive] = useState<boolean>(profissional?.active ?? true);
  const [photo, setPhoto] = useState<string>(profissional?.photo || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(profissional?.photo || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      error('A imagem deve ter no máximo 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      error('Por favor, selecione uma imagem válida');
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

      if (!response.ok) {
        throw new Error('Falha ao fazer upload da imagem');
      }

      const data = await response.json();
      setPhoto(data.url);
      setPhotoPreview(data.url);
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      error('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto('');
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave({
      ...profissional,
      name,
      specialty,
      phone,
      email,
      commissionPercentage,
      active,
      photo,
    });
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={profissional ? 'Editar Profissional' : 'Novo Profissional'}
      subtitle={profissional ? 'Atualize os dados do profissional abaixo' : 'Preencha os dados para cadastrar um novo profissional'}
      size="lg"
      footer={
        <div className="flex flex-row gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" form="professional-form">Salvar</Button>
        </div>
      }
    >
      <form id="professional-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Upload de Foto */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Foto do Profissional</label>
          <div className="flex items-center space-x-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {photoPreview ? (
                <>
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <Camera className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Enviando...' : photoPreview ? 'Trocar Foto' : 'Adicionar Foto'}
                </Button>
              </label>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG ou WEBP (máx. 5MB)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome Completo *</label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Ex: Maria Silva"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Especialidade</label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              placeholder="Ex: Cabeleireiro, Manicure, Barbeiro..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Comissão (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={commissionPercentage}
              onChange={e => setCommissionPercentage(parseFloat(e.target.value || '0'))}
              placeholder="Ex: 10"
            />
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                Profissional ativo (pode receber agendamentos)
              </label>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
