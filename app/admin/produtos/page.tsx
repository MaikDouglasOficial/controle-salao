'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Search, Pencil, Trash2, Package, Camera, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ProdutoEditarModal from '@/components/ProdutoEditarModal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sku: string | null;
  photo: string | null;
}

export default function ProdutosPage() {
  const { success, error, confirm } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
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
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/products?id=${id}`, {
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

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Produtos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
          </p>
        </div>
      </div>
            {/* Botão flutuante de novo produto */}
            <button
              onClick={() => setShowNewModal(true)}
              className="fixed bottom-6 right-6 w-12 h-12 bg-black text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all z-50"
              aria-label="Novo Produto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
      <div className="bg-white rounded-lg border border-gray-200 px-4 py-2 space-y-1 my-2">
        <div className="text-sm text-gray-700">
          Total de produtos: <span className="font-semibold text-gray-900">{products.length}</span>
        </div>
        <div className="text-sm text-gray-700">
          Estoque total: <span className="font-semibold text-gray-900">{products.reduce((acc, p) => acc + p.stock, 0)}</span>
        </div>
      </div>

        {/* ...existing code... */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border-0 focus:ring-0 focus:outline-none"
            />
          </div>
        </div>
        {/* ...existing code... */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* ...existing code... */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">Nenhum produto encontrado</div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.photo ? (
                        <Image
                          src={product.photo}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{product.name}</div>
                      {product.description && (
                        <div className="text-xs text-gray-500 truncate">{product.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="text-xs text-gray-400">SKU</span>
                      <div className="font-medium text-gray-700">{product.sku || '-'}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Preço</span>
                      <div className="font-semibold text-gray-900">{formatCurrency(product.price)}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-gray-400">Estoque</span>
                      <div>
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${product.stock > 10 ? 'bg-green-600' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-600'}`}>
                          {product.stock} unid.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Edit/Delete buttons below info for mobile */}
                  <div className="flex items-center justify-start space-x-2 pt-2">
                    <Button onClick={() => handleEdit(product.id)} variant="edit" size="sm" icon={Pencil} />
                    <Button onClick={() => handleDelete(product.id)} variant="danger" size="sm" icon={Trash2} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block table-responsive">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">Nenhum produto encontrado</td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {product.photo ? (
                              <Image
                                src={product.photo}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            {product.description && <div className="text-xs text-gray-500">{product.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{product.sku || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${product.stock > 10 ? 'bg-green-600' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-600'}`}>
                          {product.stock} unid.
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Button onClick={() => handleEdit(product.id)} variant="edit" size="sm" icon={Pencil} />
                          <Button onClick={() => handleDelete(product.id)} variant="danger" size="sm" icon={Trash2} />
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
              const response = await fetch('/api/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: produtoAtualizado.id,
                  name: produtoAtualizado.nome,
                  sku: produtoAtualizado.sku,
                  price: produtoAtualizado.preco,
                  stock: produtoAtualizado.estoque,
                  description: produtoAtualizado.descricao,
                  photo: produtoAtualizado.photo || null
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
              const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: novoProduto.nome,
                  sku: novoProduto.sku,
                  price: novoProduto.preco,
                  stock: novoProduto.estoque,
                  description: novoProduto.descricao,
                  photo: novoProduto.photo || null
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
    </div>
  );
}
