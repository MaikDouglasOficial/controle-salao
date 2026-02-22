'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Search, Pencil, Trash2, Package, Camera, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ProdutoEditarModal from '@/components/ProdutoEditarModal';
import { Button } from '@/components/ui/Button';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { LoadingSpinner } from '@/components/ui/Layout';
import { useToast } from '@/hooks/useToast';
import { fetchAuth } from '@/lib/api';
import { useScrollToTopOnFocus } from '@/hooks/useScrollToTopOnFocus';
import { PhotoViewerModal } from '@/components/PhotoViewerModal';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sku: string | null;
  photo: string | null;
  commissionType?: string | null;
  commissionValue?: number | null;
}

export default function ProdutosPage() {
  const { success, error, confirm } = useToast();
  const scrollToTopOnFocus = useScrollToTopOnFocus();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [photoViewUrl, setPhotoViewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetchAuth('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setEditingProduct(product);
      setShowEditModal(true);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Excluir Produto',
      message: 'Deseja realmente excluir este produto?',
      type: 'danger',
      requirePassword: true
    });
    if (!confirmed) return;

    try {
      const response = await fetchAuth(`/api/products?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        success('Produto excluído com sucesso');
        fetchProducts();
      } else {
        error('Erro ao deletar produto');
      }
    } catch (err) {
      console.error('Erro ao deletar produto:', err);
      error('Erro ao deletar produto');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterStock === 'in_stock') return product.stock > 0;
    if (filterStock === 'out_of_stock') return product.stock === 0;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 mt-6">
      <div className="page-header">
        <h1 className="page-title">Produtos</h1>
        <p className="page-subtitle">Estoque e catálogo de produtos</p>
      </div>
      <button
        onClick={() => setShowNewModal(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-black text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all z-50"
        aria-label="Novo Produto"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      {/* Resumo em cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Estoque total</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{products.reduce((acc, p) => acc + p.stock, 0)}</p>
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-[var(--bg-main)] pt-1 pb-2 -mx-1 px-1">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={scrollToTopOnFocus}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilterStock('all')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStock === 'all' ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterStock('in_stock')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStock === 'in_stock' ? 'bg-green-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Em estoque
              </button>
              <button
                type="button"
                onClick={() => setFilterStock('out_of_stock')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStock === 'out_of_stock' ? 'bg-red-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Sem estoque
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-visible md:overflow-hidden">
        <div className="md:hidden divide-y divide-gray-100">
          {filteredProducts.length === 0 ? (
            <div className="min-h-[200px] flex items-center justify-center px-5 py-10 text-center text-sm text-gray-500">Nenhum produto encontrado</div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="p-4 pr-2 pt-4 pb-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className="relative w-12 h-12 rounded-full overflow-hidden bg-stone-100 flex-shrink-0 cursor-pointer"
                      onClick={product.photo ? () => setPhotoViewUrl(product.photo) : undefined}
                    >
                      {product.photo ? (
                        <Image src={product.photo} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-gray-900">{product.name}</span>
                      {product.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{product.description}</p>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 pt-0.5">
                    <ActionsMenu
                      alignRight={true}
                      items={[
                        { icon: Pencil, label: 'Editar informações', onClick: () => handleEdit(product.id) },
                        { icon: Trash2, label: 'Excluir', onClick: () => handleDelete(product.id), danger: true },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <p className="text-gray-600">
                    <span className="text-gray-400">Código</span>
                    <span className="ml-2 text-gray-900 font-medium">{product.sku || '–'}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="text-gray-400">Preço</span>
                    <span className="ml-2 font-medium text-gray-900">{formatCurrency(product.price)}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="text-gray-400">Estoque</span>
                    <span className="ml-2">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-50 text-green-700 border border-green-200' : product.stock > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {product.stock} unid.
                      </span>
                    </span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-stone-50">
              <tr>
                <th className="sticky left-0 z-[1] bg-stone-50 px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                <th className="px-5 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">Nenhum produto encontrado</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="group hover:bg-stone-50/50 transition-colors">
                    <td className="sticky left-0 z-[1] bg-white group-hover:bg-stone-50/50 px-5 py-3.5 whitespace-nowrap text-sm text-gray-600 font-medium">{product.sku || '–'}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="relative w-10 h-10 rounded-full overflow-hidden bg-stone-100 flex-shrink-0 cursor-pointer"
                          onClick={product.photo ? () => setPhotoViewUrl(product.photo) : undefined}
                        >
                          {product.photo ? (
                            <Image src={product.photo} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.description && <div className="text-xs text-gray-500">{product.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(product.price)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-50 text-green-700 border border-green-200' : product.stock > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {product.stock} unid.
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        <ActionsMenu
                          items={[
                            { icon: Pencil, label: 'Editar informações', onClick: () => handleEdit(product.id) },
                            { icon: Trash2, label: 'Excluir', onClick: () => handleDelete(product.id), danger: true },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && editingProduct && (
        <ProdutoEditarModal
          produto={{
            id: editingProduct.id,
            nome: editingProduct.name,
            sku: editingProduct.sku || '',
            preco: editingProduct.price,
            estoque: editingProduct.stock,
            descricao: editingProduct.description || '',
            photo: editingProduct.photo || ''
          }}
          onSave={async (produtoAtualizado) => {
            try {
              const response = await fetchAuth('/api/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: produtoAtualizado.id,
                  name: produtoAtualizado.nome,
                  sku: produtoAtualizado.sku,
                  price: produtoAtualizado.preco,
                  stock: produtoAtualizado.estoque,
                  description: produtoAtualizado.descricao,
                  photo: produtoAtualizado.photo || null,
                  commissionType: produtoAtualizado.commissionType ?? 'PERCENT',
                  commissionValue: produtoAtualizado.commissionValue ?? 0
                })
              });
              if (response.ok) {
                success('Produto atualizado com sucesso');
                setShowEditModal(false);
                setEditingProduct(null);
                fetchProducts();
              } else {
                error('Erro ao atualizar produto');
              }
            } catch (err) {
              error('Erro ao atualizar produto');
            }
          }}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {showNewModal && (
        <ProdutoEditarModal
          onSave={async (novoProduto) => {
            try {
              const response = await fetchAuth('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: novoProduto.nome,
                  sku: novoProduto.sku,
                  price: novoProduto.preco,
                  stock: novoProduto.estoque,
                  description: novoProduto.descricao,
                  photo: novoProduto.photo || null,
                  commissionType: novoProduto.commissionType ?? 'PERCENT',
                  commissionValue: novoProduto.commissionValue ?? 0
                })
              });
              if (response.ok) {
                success('Produto criado com sucesso');
                setShowNewModal(false);
                fetchProducts();
              } else {
                error('Erro ao criar produto');
              }
            } catch (err) {
              error('Erro ao criar produto');
            }
          }}
          onClose={() => setShowNewModal(false)}
        />
      )}
      {photoViewUrl && (
        <PhotoViewerModal
          src={photoViewUrl}
          alt="Foto do produto"
          isOpen
          onClose={() => setPhotoViewUrl(null)}
        />
      )}
    </div>
  );
}
