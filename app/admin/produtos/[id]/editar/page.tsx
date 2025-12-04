'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, X, ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner, ErrorState } from '@/components/ui/Loading';
import { useToast } from '@/hooks/useToast';
import { put } from '@vercel/blob';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sku: string | null;
  photo: string | null;
}

export default function EditarProdutoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    stock: '',
    photo: '',
  });

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const response = await fetch(`/api/products?id=${params.id}`);
      
      if (!response.ok) {
        throw new Error('Produto não encontrado');
      }
      
      const data: Product = await response.json();
      setFormData({
        name: data.name,
        description: data.description || '',
        sku: data.sku || '',
        price: data.price.toString(),
        stock: data.stock.toString(),
        photo: data.photo || '',
      });
      
      if (data.photo) {
        setPhotoPreview(data.photo);
      }
    } catch (err) {
      console.error('Erro ao buscar produto:', err);
      setLoadError(true);
      error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setRemoveExistingPhoto(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setRemoveExistingPhoto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      error('Nome do produto é obrigatório');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      error('Preço deve ser maior que zero');
      return;
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      error('Estoque não pode ser negativo');
      return;
    }

    setSaving(true);

    try {
      let photoUrl = formData.photo;
      
      // Upload new photo if selected
      if (photoFile) {
        const blob = await put(photoFile.name, photoFile, {
          access: 'public',
        });
        photoUrl = blob.url;
      } else if (removeExistingPhoto) {
        photoUrl = '';
      }

      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(params.id),
          name: formData.name,
          description: formData.description || null,
          sku: formData.sku || null,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          photo: photoUrl || null,
        }),
      });

      if (response.ok) {
        success('Produto atualizado com sucesso');
        router.push(`/admin/produtos/${params.id}`);
      } else {
        const errorData = await response.json();
        error(errorData.error || 'Erro ao atualizar produto');
      }
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      error('Erro ao atualizar produto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-app">
        <LoadingSpinner size="lg" message="Carregando produto..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container-app">
        <ErrorState
          title="Erro ao carregar produto"
          message="Não foi possível carregar as informações do produto"
          onRetry={fetchProduct}
        />
      </div>
    );
  }

  return (
    <div className="container-app">
      {/* Header */}
      <div className="mb-spacing-section">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 touch-target"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </button>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white">
          Editar Produto
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Atualize as informações do produto
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6 shadow-sm">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Foto do Produto
            </label>
            <div className="flex items-start space-x-4">
              <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600">
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
                      onClick={removePhoto}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    <Camera className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Adicionar foto
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Recomendamos imagens quadradas com no mínimo 400x400px.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Form Fields - Grid 2 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Produto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Shampoo Hidratante"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada do produto..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SKU / Código
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Ex: SHMP001"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preço de Venda <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0,00"
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Estoque */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantidade em Estoque <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
            className="touch-target"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="touch-target"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Package className="w-5 h-5 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
