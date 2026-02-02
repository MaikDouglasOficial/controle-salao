'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/useToast';

import { Search, Pencil, Trash2, Eye, Users, Camera, X } from 'lucide-react';
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
  const toast = useToast();
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
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
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
        toast.error(error.error || 'Erro ao fazer upload');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da foto');
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
        toast.success(editingCustomer ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar cliente');
      }
    } catch (error) {
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = await toast.confirm({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o cliente "${name}"?\n\nEsta ação não pode ser desfeita e irá remover:\n• Todos os agendamentos\n• Histórico de vendas\n• Todas as informações do cliente`,
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Cliente excluído com sucesso!');
        await fetchCustomers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Não foi possível excluir cliente. Tente novamente.');
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
    <div className="page-container space-y-6">
        {/* Header Minimalista */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Clientes
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie seus clientes
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingCustomer(null);
              setForm({ nome: '', email: '', telefone: '', aniversario: '', observacoes: '' });
              setShowModal(true);
            }}
            size="lg"
          >
            Novo Cliente
          </Button>
        </div>

        {/* Busca */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-gray-500">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aniversário
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link 
                        href={`/admin/clientes/${customer.id}`}
                        className="flex items-center space-x-3 hover:text-gray-900 transition-colors"
                      >
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {customer.photo ? (
                            <Image
                              src={customer.photo}
                              alt={customer.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Users className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          {customer.notes && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {customer.notes}
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatPhone(customer.phone)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {customer.email || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {customer.birthday ? formatDate(customer.birthday) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/admin/clientes/${customer.id}`}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Button
                          onClick={() => handleEdit(customer.id)}
                          variant="edit"
                          size="sm"
                          icon={Pencil}
                          title="Editar Cliente"
                        />
                        <Button
                          onClick={() => handleDelete(customer.id, customer.name)}
                          variant="danger"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Total de Clientes</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {customers.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">
            Aniversariantes do Mês
          </p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
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
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Com Email</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
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
            <div className="modal-actions flex flex-row gap-3 justify-end">
              <Button variant="secondary" type="button" onClick={() => {
                setShowModal(false);
                setEditingCustomer(null);
                setForm(null);
              }} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" form="cliente-form" className="w-full sm:w-auto">
                {editingCustomer ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          }
        >
          <form id="cliente-form" onSubmit={handleSaveCustomer} className="space-y-4">
            {/* Upload de Foto */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Cliente</label>
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  {photoPreview ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                      <Image
                        src={photoPreview}
                        alt="Foto do cliente"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
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
                    className={`inline-block cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      uploading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {uploading ? 'Enviando...' : 'Adicionar Foto'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG ou WEBP (máx. 5MB)</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome Completo *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={form?.nome || ''}
                  onChange={e => setForm((f: any) => ({ ...f, nome: e.target.value }))}
                  required
                  placeholder="Ex: Maria Silva"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CPF</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form?.cpf || ''}
                    onChange={e => setForm((f: any) => ({ ...f, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form?.telefone || ''}
                    onChange={e => setForm((f: any) => ({ ...f, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={form?.email || ''}
                  onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))}
                  type="email"
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de Nascimento</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={form?.aniversario || ''}
                  onChange={e => setForm((f: any) => ({ ...f, aniversario: e.target.value }))}
                  type="date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
  );
}
