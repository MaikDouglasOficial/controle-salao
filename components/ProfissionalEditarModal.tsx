import { ModalBase as Modal } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, X, Check } from 'lucide-react';
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
        <div className="w-full mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Foto do Profissional</label>
          <div className="w-full rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
            {photoPreview ? (
              <div className="relative w-full aspect-video">
                <Image
                  src={photoPreview}
                  alt="Foto do profissional"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow"
                  aria-label="Remover foto"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="photo-upload"
                className={`flex flex-col items-center justify-center w-full aspect-video cursor-pointer transition-colors ${
                  uploading ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-100'
                }`}
              >
                <Camera className="h-10 w-10 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">{uploading ? 'Enviando...' : 'Clique para adicionar foto'}</span>
              </label>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
          />
          {photoPreview && (
            <label
              htmlFor="photo-upload"
              className="mt-2 flex w-full justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              {uploading ? 'Enviando...' : 'Trocar foto'}
            </label>
          )}
          <p className="text-xs text-gray-500 mt-1.5">PNG, JPG ou WEBP (máx. 5MB)</p>
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
            <p className="text-xs text-gray-500 mb-3">Marque os procedimentos que este profissional realiza. O cliente só poderá escolhê-lo ao agendar se ele realizar todos os serviços selecionados.</p>
            <div className="max-h-48 overflow-y-auto rounded-xl p-3 bg-gradient-to-br from-gray-50 to-white border border-gray-200">
              {services.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Nenhum serviço cadastrado.</p>}
              <ul className="flex flex-col gap-1">
                {services.map((s) => {
                  const selected = selectedServiceIds.includes(s.id);
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                          selected
                            ? 'bg-stone-800 text-amber-400 border border-amber-500 shadow-sm'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                            selected ? 'bg-amber-400' : 'bg-gray-200'
                          }`}
                        >
                          {selected && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
                        </span>
                        <span>{s.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
