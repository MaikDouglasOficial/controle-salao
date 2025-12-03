'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, X, Trash2, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface GalleryPhoto {
  id: number;
  photoUrl: string;
  description?: string | null;
  serviceDate?: string | null;
  createdAt: string;
}

interface CustomerGalleryProps {
  customerId: number;
  photos: GalleryPhoto[];
  onPhotosUpdate: () => void;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

export default function CustomerGallery({ customerId, photos, onPhotosUpdate }: CustomerGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [photoToUpload, setPhotoToUpload] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'A imagem deve ter no máximo 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Por favor, selecione uma imagem válida');
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
      setPhotoToUpload(data.url);
      setShowModal(true);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      showToast('error', 'Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleSavePhoto = async () => {
    if (!photoToUpload) return;

    try {
      const response = await fetch(`/api/customers/${customerId}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl: photoToUpload,
          description: description || null,
          serviceDate: serviceDate || null
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar foto');
      }

      showToast('success', 'Foto adicionada com sucesso!');
      setShowModal(false);
      setPhotoToUpload(null);
      setDescription('');
      setServiceDate('');
      onPhotosUpdate();
    } catch (error) {
      console.error('Erro ao salvar foto:', error);
      showToast('error', 'Erro ao salvar foto');
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/gallery?photoId=${photoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir foto');
      }

      showToast('success', 'Foto excluída com sucesso!');
      onPhotosUpdate();
    } catch (error) {
      console.error('Erro ao excluir foto:', error);
      showToast('error', 'Erro ao excluir foto');
    }
  };

  return (
    <div className="space-y-4">
      {/* Botão de Upload */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Galeria de Serviços</h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
            id="gallery-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            icon={Camera}
            size="sm"
          >
            {uploading ? 'Enviando...' : 'Adicionar Foto'}
          </Button>
        </div>
      </div>

      {/* Grid de Fotos */}
      {photos.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Nenhuma foto adicionada ainda</p>
          <p className="text-gray-400 text-xs mt-1">Clique em "Adicionar Foto" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <Image
                  src={photo.photoUrl}
                  alt={photo.description || 'Foto do serviço'}
                  fill
                  className="object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setSelectedPhoto(photo.photoUrl)}
                />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Excluir foto"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              {photo.description && (
                <p className="text-xs text-gray-600 mt-1 truncate">{photo.description}</p>
              )}
              {photo.serviceDate && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <Calendar className="h-3 w-3" />
                  {new Date(photo.serviceDate).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Visualização */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-[10000] flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative w-full h-full">
              <Image
                src={selectedPhoto}
                alt="Foto ampliada"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Descrição */}
      {showModal && photoToUpload && (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Adicionar Detalhes</h3>
            
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={photoToUpload}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Descrição (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Ex: Corte e escova, Coloração, Ombré hair..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Data do Serviço (opcional)
              </label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setPhotoToUpload(null);
                  setDescription('');
                  setServiceDate('');
                }}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSavePhoto}
                className="w-full sm:w-auto"
              >
                Salvar Foto
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de Notificação */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
