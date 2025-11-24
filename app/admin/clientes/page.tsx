'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { Plus, Search, Pencil, Trash2, Eye, Users, Camera, X } from 'lucide-react';
import { formatPhone, formatDate } from '@/lib/utils';
import { ModalBase as Modal } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  birthday: string | null;
  notes: string | null;
  photo: string | null;
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const response = await fetch(`/api/customers/${id}`);
      if (response.ok) {
        const customer = await response.json();
        setEditingCustomer(customer);
        setForm({
          nome: customer.name,
          email: customer.email || '',
          telefone: customer.phone,
         cpf: customer.cpf || '',
         aniversario: customer.birthday || '',
         observacoes: customer.notes || '',
         photo: customer.photo || '',
        });
        setPhotoPreview(customer.photo);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 5MB');
      return;
    }

    // Validar tipo
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
        setForm((f: any) => ({ ...f, photo: url }));
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
    setForm((f: any) => ({ ...f, photo: '' }));
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    try {
      const response = await fetch('/api/customers', {
        method: editingCustomer ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCustomer?.id,
          name: form.nome,
          email: form.email,
          phone: form.telefone,
          birthday: form.aniversario,
          notes: form.observacoes,
          cpf: form.cpf,
          photo: form.photo || null,
        }),
      });
      if (response.ok) {
        await fetchCustomers();
        setShowModal(false);
        setEditingCustomer(null);
        setForm(null);
        setPhotoPreview(null);
        alert(editingCustomer ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar cliente');
      }
    } catch (error) {
      alert('Erro ao salvar cliente');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`ATENÇÃO: Tem certeza que deseja excluir o cliente "${name}"?\n\nEsta ação não pode ser desfeita e irá remover:\n• Todos os agendamentos\n• Histórico de vendas\n• Todas as informações do cliente`)) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Cliente excluído com sucesso!');
        await fetchCustomers();
      } else {
        const error = await response.json();
        alert(`ERRO: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      alert('ERRO: Não foi possível excluir cliente. Tente novamente.');
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header Aprimorado */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-in">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-purple-700 bg-clip-text text-transparent leading-tight pb-2">
                  Clientes
                </h1>
                <p className="text-xl text-gray-600 mt-2">
                  Gerencie seus clientes e relacionamentos
                </p>
              </div>
            </div>
            <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-slideRight"></div>
          </div>
          <Button
            onClick={() => {
              setEditingCustomer(null);
              setForm({ nome: '', email: '', telefone: '', aniversario: '', observacoes: '' });
              setShowModal(true);
            }}
            icon={Plus}
            size="lg"
          >
            Novo Cliente
          </Button>
        </div>

        {/* Busca */}
        <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Nome
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Telefone
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Aniversário
                  </th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <Link 
                        href={`/admin/clientes/${customer.id}`}
                        className="flex items-center space-x-3 hover:text-primary-600 transition-colors"
                      >
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex-shrink-0">
                          {customer.photo ? (
                            <Image
                              src={customer.photo}
                              alt={customer.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Users className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {customer.name}
                          </div>
                          {customer.notes && (
                            <div className="text-sm text-gray-500 mt-1">
                              {customer.notes}
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {formatPhone(customer.phone)}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {customer.email || '-'}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {customer.birthday ? formatDate(customer.birthday) : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/clientes/${customer.id}`}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Button
                          onClick={() => handleEdit(customer.id)}
                          variant="ghost"
                          size="sm"
                          icon={Pencil}
                          title="Editar Cliente"
                        />
                        <Button
                          onClick={() => handleDelete(customer.id, customer.name)}
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          title="Excluir Cliente"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">
            {customers.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-sm font-medium text-gray-600">
            Aniversariantes do Mês
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {
              customers.filter((c) => {
                if (!c.birthday) return false;
                const birthday = new Date(c.birthday);
                const currentMonth = new Date().getMonth();
                return birthday.getMonth() === currentMonth;
              }).length
            }
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-sm font-medium text-gray-600">Com Email</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {customers.filter((c) => c.email).length}
          </p>
        </div>
      </div>

      {/* Modal de Criar/Editar Cliente */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingCustomer(null);
            setForm(null);
          }}
          title={editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
          subtitle={editingCustomer ? 'Atualize os dados do cliente' : 'Preencha os dados para cadastrar um novo cliente'}
          size="md"
          footer={
            <>
              <Button variant="secondary" type="button" onClick={() => {
                setShowModal(false);
                setEditingCustomer(null);
                setForm(null);
              }}>
                Cancelar
              </Button>
              <Button type="submit" form="cliente-form">
                {editingCustomer ? 'Salvar' : 'Cadastrar'}
              </Button>
            </>
          }
        >
          <form id="cliente-form" onSubmit={handleSaveCustomer} className="space-y-4">
            {/* Upload de Foto */}
            <div className="flex flex-col items-center space-y-3 pb-4 border-b">
              <div className="relative">
                {photoPreview ? (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary-100">
                    <Image
                      src={photoPreview}
                      alt="Foto do cliente"
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
                  <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
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
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form?.nome || ''}
                  onChange={e => setForm((f: any) => ({ ...f, nome: e.target.value }))}
                  required
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form?.telefone || ''}
                  onChange={e => setForm((f: any) => ({ ...f, telefone: e.target.value }))}
                  required
                  placeholder="(00) 00000-0000"
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form?.cpf || ''}
                    onChange={e => setForm((f: any) => ({ ...f, cpf: e.target.value }))}
                    required
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form?.email || ''}
                  onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))}
                  type="email"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form?.aniversario || ''}
                  onChange={e => setForm((f: any) => ({ ...f, aniversario: e.target.value }))}
                  type="date"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={form?.observacoes || ''}
                  onChange={e => setForm((f: any) => ({ ...f, observacoes: e.target.value }))}
                  rows={3}
                  placeholder="Ex: Cliente VIP, prefere horários pela manhã..."
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
      </div>
    </div>
  );
}
