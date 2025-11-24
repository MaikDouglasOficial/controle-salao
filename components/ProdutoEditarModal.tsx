import { ModalBase as Modal } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, X } from 'lucide-react';

interface ProdutoEditarModalProps {
  produto?: {
    nome?: string;
    sku?: string;
    preco?: number;
    estoque?: number;
    descricao?: string;
    photo?: string;
    id?: number;
  };
  onSave: (produto: any) => void;
  onClose: () => void;
}

export default function ProdutoEditarModal({ produto, onSave, onClose }: ProdutoEditarModalProps) {
  const [nome, setNome] = useState<string>(produto?.nome || '');
  const [sku, setSku] = useState<string>(produto?.sku || '');
  const [preco, setPreco] = useState<number>(produto?.preco || 0);
  const [estoque, setEstoque] = useState<number>(produto?.estoque || 0);
  const [descricao, setDescricao] = useState<string>(produto?.descricao || '');
  const [photo, setPhoto] = useState<string>(produto?.photo || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(produto?.photo || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem');
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
        setPhoto(url);
        setPhotoPreview(url);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao fazer upload');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da foto');
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
    onSave({ ...produto, nome, sku, preco, estoque, descricao, photo });
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={produto ? 'Editar Produto' : 'Novo Produto'}
      subtitle={produto ? 'Atualize os dados do produto abaixo' : 'Preencha os dados para cadastrar um novo produto'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload de Foto */}
        <div className="flex flex-col items-center space-y-3 pb-4 border-b">
          <div className="relative">
            {photoPreview ? (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border-4 border-primary-100">
                <Image
                  src={photoPreview}
                  alt="Foto do produto"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  title="Remover foto"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-lg bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                <Camera className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            id="product-photo-upload"
          />
          <label
            htmlFor="product-photo-upload"
            className={`cursor-pointer px-4 py-2 rounded-lg font-medium transition-colors ${
              uploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
            }`}
          >
            {uploading ? 'Enviando...' : photoPreview ? 'Trocar Foto' : 'Adicionar Foto'}
          </label>
          <p className="text-xs text-gray-500">JPG, PNG ou WEBP (máx. 5MB)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nome do Produto *</label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="Ex: Shampoo Kerastase"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={sku}
              onChange={e => setSku(e.target.value)}
              placeholder="Ex: 12345"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Preço (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={preco}
              onChange={e => setPreco(Number(e.target.value))}
              required
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estoque *</label>
            <input
              type="number"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={estoque}
              onChange={e => setEstoque(Number(e.target.value))}
              required
              placeholder="0"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descrição detalhada do produto..."
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
