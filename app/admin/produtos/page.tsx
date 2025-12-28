'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Pencil, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/Loading';
import { NoResults, ErrorState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useProducts, useDeleteProduct } from '@/hooks/useApi';
import type { Product } from '@/types';

export default function ProdutosPage() {
  const { confirm } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // React Query hooks
  const { data: products = [], isLoading, isError, error: queryError } = useProducts();
  const deleteMutation = useDeleteProduct();

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Excluir Produto',
      message: 'Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.',
      type: 'danger'
    });

    if (!confirmed) return;

    await deleteMutation.mutateAsync(id.toString());
  };

  // Memoizar filtro
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((product: Product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Produtos
                </h1>
              </div>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Gerencie seu estoque de produtos
              </p>
            </div>
            
            <Link href="/admin/produtos/novo">
              <Button size="lg" className="w-full sm:w-auto min-h-[44px]">
                <Plus className="w-5 h-5 mr-2" />
                Novo Produto
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome, SKU ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 md:py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
            />
        </div>
      </div>

      {/* Error State */}
      {isError && <ErrorState message={queryError?.message || 'Erro ao carregar produtos'} />}

      {/* Loading State */}
      {isLoading && <SkeletonTable />}

      {/* Empty State */}
      {!isLoading && !isError && filteredProducts.length === 0 && searchTerm && (
        <NoResults
          searchTerm={searchTerm}
          onClearSearch={() => setSearchTerm('')}
        />
      )}

      {!isLoading && !isError && products.length === 0 && !searchTerm && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum produto cadastrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Comece adicionando seu primeiro produto ao estoque
          </p>
          <Link href="/admin/produtos/novo">
            <Button>
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Produto
            </Button>
          </Link>
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && !isError && filteredProducts.length > 0 && (
        <>
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estoque
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProducts.map((product: Product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <OptimizedImage
                            src={product.photo}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="rounded-lg object-cover"
                            fallbackIcon={<Package className="w-6 h-6" />}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                            {product.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {product.sku || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.stock > 10
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : product.stock > 0
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {product.stock} unid.
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Link href={`/admin/produtos/${product.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="touch-target"
                              aria-label="Visualizar produto"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/produtos/${product.id}/editar`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="touch-target"
                              aria-label="Editar produto"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 touch-target"
                            aria-label="Excluir produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredProducts.map((product: Product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
              >
                <div className="flex items-start space-x-4 mb-4">
                  <OptimizedImage
                    src={product.photo}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="rounded-lg object-cover"
                    fallbackIcon={<Package className="w-8 h-8" />}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                      {product.name}
                    </h3>
                    {product.sku && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        SKU: {product.sku}
                      </p>
                    )}
                    {product.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preço</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estoque</p>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock > 10
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : product.stock > 0
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {product.stock} unid.
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link href={`/admin/produtos/${product.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full touch-target">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                  </Link>
                  <Link href={`/admin/produtos/${product.id}/editar`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full touch-target">
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 touch-target"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
