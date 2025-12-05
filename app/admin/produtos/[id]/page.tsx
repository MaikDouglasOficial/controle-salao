'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sku: string | null;
  photo: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function VisualizarProdutoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { success, error, confirm } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

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
      
      const data = await response.json();
      setProduct(data);
    } catch (err) {
      console.error('Erro ao buscar produto:', err);
      setLoadError(true);
      error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Excluir Produto',
      message: 'Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/products?id=${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        success('Produto excluído com sucesso');
        router.push('/admin/produtos');
      } else {
        error('Erro ao excluir produto');
      }
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      error('Erro ao excluir produto');
    }
  };

  if (loading) {
    return (
      <div className="container-app flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loadError || !product) {
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

  const stockStatus =
    product.stock === 0
      ? { label: 'Sem estoque', color: 'red' }
      : product.stock < 10
      ? { label: 'Estoque baixo', color: 'yellow' }
      : { label: 'Em estoque', color: 'green' };

  return (
    <div className="container-app">
      {/* Header */}
      <div className="mb-spacing-section">
        <Link href="/admin/produtos" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 touch-target">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white">
              {product.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Detalhes do produto
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/admin/produtos/${product.id}/editar`}>
              <Button variant="outline" className="touch-target">
                <Pencil className="w-5 h-5 mr-2" />
                Editar
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 touch-target"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card - Spans 2 columns on desktop */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Image & Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Image */}
              <div className="relative w-full sm:w-48 h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                {product.photo ? (
                  <Image
                    src={product.photo}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <Package className="w-16 h-16" />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {product.name}
                </h2>
                {product.sku && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    SKU: <span className="font-mono">{product.sku}</span>
                  </p>
                )}
                {product.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Preço de Venda</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações de Estoque
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Quantidade Disponível
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {product.stock}
                  </p>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      stockStatus.color === 'red'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : stockStatus.color === 'yellow'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {stockStatus.label}
                  </span>
                </div>
              </div>

              {product.stock < 10 && (
                <div className="sm:col-span-2">
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                        Atenção: Estoque baixo
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
                        Considere reabastecer este produto em breve para evitar rupturas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Details */}
        <div className="space-y-6">
          {/* Additional Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações Adicionais
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Código SKU
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                  {product.sku || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Cadastrado em
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(product.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Última atualização
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(product.updatedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
