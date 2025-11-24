'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Plus, Search, Pencil, Trash2, Package, Camera, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ProdutoEditarModal from '@/components/ProdutoEditarModal';
import { Button } from '@/components/ui/Button';

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
    if (!confirm('Deseja realmente excluir este produto?')) return;

    try {
      const response = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts();
      } else {
        alert('Erro ao deletar produto');
      }
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      alert('Erro ao deletar produto');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-in">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent leading-tight pb-2">
                  Produtos
                </h1>
                <p className="text-xl text-gray-600 mt-2">
                  Gerencie seu estoque e inventário
                </p>
              </div>
            </div>
            <div className="h-1 w-32 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full animate-slideRight"></div>
          </div>
          <Button
            onClick={() => setShowNewModal(true)}
            icon={Plus}
            size="lg"
          >
            Novo Produto
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-green-500 to-emerald-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Preço</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Estoque</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhum produto encontrado</td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-green-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 flex-shrink-0">
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
                            <div className="font-medium text-gray-900">{product.name}</div>
                            {product.description && <div className="text-sm text-gray-500">{product.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock > 10 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {product.stock} unid.
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button onClick={() => handleEdit(product.id)} variant="ghost" size="sm" icon={Pencil} />
                          <Button onClick={() => handleDelete(product.id)} variant="ghost" size="sm" icon={Trash2} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
                setShowEditModal(false);
                setEditingProduct(null);
                fetchProducts();
              } else {
                alert('Erro ao atualizar produto');
              }
            } catch (error) {
              alert('Erro ao atualizar produto');
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
                setShowNewModal(false);
                fetchProducts();
              } else {
                alert('Erro ao criar produto');
              }
            } catch (error) {
              alert('Erro ao criar produto');
            }
          }}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
}
