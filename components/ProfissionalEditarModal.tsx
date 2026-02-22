import { ModalBase as Modal } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { fetchAuth } from '@/lib/api';

interface ProfissionalEditarModalProps {
  profissional?: {
    id?: number;
    name?: string;
    phone?: string;
    email?: string;
    specialty?: string;
    active?: boolean;
    photo?: string;
    serviceIds?: number[];
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
  const [active, setActive] = useState<boolean>(profissional?.active ?? true);
  const [photo, setPhoto] = useState<string>(profissional?.photo || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(profissional?.photo || null);
  const [uploading, setUploading] = useState(false);
  const [services, setServices] = useState<{ id: number; name: string }[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>(profissional?.serviceIds ?? []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedServiceIds(profissional?.serviceIds ?? []);
  }, [profissional?.serviceIds]);

  useEffect(() => {
    fetchAuth('/api/services')
      .then((r) => r.json())
      .then((list) => setServices(Array.isArray(list) ? list : []))
      .catch(() => setServices([]));
  }, []);

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

      const response = await fetchAuth('/api/upload', {
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

  const toggleService = (id: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave({
      ...profissional,
      name,
      specialty,
      phone,
      email,
      active,
      photo,
      serviceIds: selectedServiceIds,
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
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Serviços que realiza</label>
            <p className="text-xs text-gray-500 mb-2">Marque os procedimentos que este profissional realiza. O cliente só poderá escolhê-lo ao agendar se ele realizar todos os serviços selecionados.</p>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              {services.map((s) => (
                <label key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 cursor-pointer hover:border-primary-400">
                  <input
                    type="checkbox"
                    checked={selectedServiceIds.includes(s.id)}
                    onChange={() => toggleService(s.id)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
              {services.length === 0 && <span className="text-sm text-gray-500">Nenhum serviço cadastrado.</span>}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
