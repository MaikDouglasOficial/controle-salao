'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Camera, Trash2, Calendar, Grid3X3, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { ModalBase } from './ui/ModalBase';
import { useToast } from '@/hooks/useToast';

const PHOTOS_VISIBLE_INITIAL = 4;

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

export default function CustomerGallery({ customerId, photos, onPhotosUpdate }: CustomerGalleryProps) {
  const { confirm, success, error } = useToast();
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedPhotoData, setSelectedPhotoData] = useState<GalleryPhoto | null>(null);
  const [description, setDescription] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [photoToUpload, setPhotoToUpload] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photosToShow = showAll ? photos : photos.slice(0, PHOTOS_VISIBLE_INITIAL);
  const hasMore = photos.length > PHOTOS_VISIBLE_INITIAL;
  const remainingCount = photos.length - PHOTOS_VISIBLE_INITIAL;

  // Fotos ordenadas por data (serviceDate ou createdAt) para navegação no modal
  const photosByDate = useMemo(() => {
    return [...photos].sort((a, b) => {
      const dateA = new Date(a.serviceDate || a.createdAt).getTime();
      const dateB = new Date(b.serviceDate || b.createdAt).getTime();
      return dateA - dateB;
    });
  }, [photos]);

  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setPhotoToUpload(data.url);
      setShowModal(true);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      error('Erro ao fazer upload da imagem');
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

      success('Foto adicionada com sucesso!');
      setShowModal(false);
      setPhotoToUpload(null);
      setDescription('');
      setServiceDate('');
      onPhotosUpdate();
    } catch (error) {
      console.error('Erro ao salvar foto:', error);
      error('Erro ao salvar foto');
    }
  };

  const SWIPE_THRESHOLD = 50;

  const currentIndex = selectedPhotoData
    ? photosByDate.findIndex((p) => p.id === selectedPhotoData.id)
    : -1;
  const currentPhoto = currentIndex >= 0 ? photosByDate[currentIndex] : selectedPhotoData;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < photosByDate.length - 1;

  const goPrev = () => {
    if (hasPrev) setSelectedPhotoData(photosByDate[currentIndex - 1]);
  };
  const goNext = () => {
    if (hasNext) setSelectedPhotoData(photosByDate[currentIndex + 1]);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragStartX(e.clientX);
    setDragOffset(0);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartX === null) return;
    setDragOffset(e.clientX - dragStartX);
  };
  const handlePointerUp = () => {
    if (dragStartX === null) return;
    if (dragOffset > SWIPE_THRESHOLD) goPrev();
    else if (dragOffset < -SWIPE_THRESHOLD) goNext();
    setDragStartX(null);
    setDragOffset(0);
  };

  useEffect(() => {
    if (!selectedPhotoData) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedPhotoData, currentIndex]);

  const handleDeletePhoto = async (photoId: number) => {
    const confirmed = await confirm({
      title: 'Excluir foto',
      message: 'Tem certeza que deseja excluir esta foto da galeria?',
      type: 'danger',
      requirePassword: true
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/customers/${customerId}/gallery?photoId=${photoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir foto');
      }

      success('Foto excluída com sucesso!');
      onPhotosUpdate();
    } catch (error) {
      console.error('Erro ao excluir foto:', error);
      error('Erro ao excluir foto');
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
            {uploading ? 'Enviando...' : photos.length > 0 ? 'Alterar foto' : 'Adicionar Foto'}
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
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photosToShow.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img
                    src={photo.photoUrl}
                    alt={photo.description || 'Foto do serviço'}
                    className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform"
                    loading="lazy"
                    onClick={() => setSelectedPhotoData(photo)}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
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
          {hasMore && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50/50 transition-colors text-sm font-medium"
            >
              <Grid3X3 className="h-4 w-4" />
              Ver todas as {photos.length} fotos
            </button>
          )}
          {showAll && hasMore && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Mostrar menos
            </button>
          )}
        </div>
      )}

      {/* Modal de Visualização com informações salvas e navegação por arraste */}
      <ModalBase
        isOpen={Boolean(selectedPhotoData)}
        onClose={() => {
          setSelectedPhotoData(null);
          setDragStartX(null);
          setDragOffset(0);
        }}
        title="Foto do serviço"
        size="full"
      >
        {currentPhoto && (
          <div className="space-y-4">
            <div className="relative w-full h-[60vh] sm:h-[70vh] bg-stone-900 rounded-xl overflow-hidden flex items-center justify-center select-none touch-none">
              {/* Botão anterior */}
              {hasPrev && (
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
              )}
              {/* Área arrastável */}
              <div
                className="flex-1 flex items-center justify-center h-full cursor-grab active:cursor-grabbing overflow-hidden"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ touchAction: 'pan-y' }}
              >
                <img
                  src={currentPhoto.photoUrl}
                  alt={currentPhoto.description || 'Foto ampliada'}
                  className="max-h-full max-w-full w-auto object-contain transition-transform duration-75"
                  draggable={false}
                  style={{ transform: `translateX(${dragOffset}px)` }}
                />
              </div>
              {/* Botão próximo */}
              {hasNext && (
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-stone-500">
                {photosByDate.length > 0 && currentIndex >= 0
                  ? `${currentIndex + 1} de ${photosByDate.length} (por data)`
                  : ''}
              </p>
              {photosByDate.length > 1 && (
                <p className="text-xs text-stone-500">Arraste para o lado ou use as setas</p>
              )}
            </div>
            <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-2">
              {currentPhoto.description && (
                <div>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Descrição</p>
                  <p className="text-sm text-stone-900 mt-0.5">{currentPhoto.description}</p>
                </div>
              )}
              {currentPhoto.serviceDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-stone-500" />
                  <div>
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Data do serviço</p>
                    <p className="text-sm text-stone-900 mt-0.5">
                      {new Date(currentPhoto.serviceDate).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
              {!currentPhoto.description && !currentPhoto.serviceDate && (
                <p className="text-sm text-stone-500">Nenhuma informação adicional salva com esta foto.</p>
              )}
            </div>
          </div>
        )}
      </ModalBase>

      {/* Modal de Adicionar Descrição */}
      <ModalBase
        isOpen={Boolean(showModal && photoToUpload)}
        onClose={() => {
          setShowModal(false);
          setPhotoToUpload(null);
          setDescription('');
          setServiceDate('');
        }}
        title="Adicionar Detalhes"
        size="md"
      >
        {photoToUpload && (
          <div className="space-y-4">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={photoToUpload}
                alt="Preview"
                className="h-full w-full object-cover"
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

            <div className="modal-actions flex flex-col sm:flex-row gap-3 pt-2">
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
        )}
      </ModalBase>
    </div>
  );
}
