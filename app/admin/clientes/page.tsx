'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/useToast';
import { useScrollToTopOnFocus } from '@/hooks/useScrollToTopOnFocus';

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
  const scrollToTopOnFocus = useScrollToTopOnFocus();
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
      if (!response.ok) {
        toast.error(data?.error || 'Erro ao buscar clientes');
        setCustomers([]);
        return;
      }
      if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        console.error('Resposta inesperada ao buscar clientes:', data);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao buscar clientes');
      setCustomers([]);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 mt-6">
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <p className="page-subtitle">Cadastro e histórico de clientes</p>
      </div>

      {/* Botão flutuante de novo cliente */}
      <button
        onClick={() => {
          setEditingCustomer(null);
          setForm({ nome: '', email: '', telefone: '', aniversario: '', observacoes: '' });
          setShowModal(true);
        }}
        className="fixed bottom-6 right-6 w-12 h-12 bg-black text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all z-50"
        aria-label="Novo Cliente"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Resumo em cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{customers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Aniversariantes do mês</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">
            {customers.filter((c) => {
              if (!c.birthday) return false;
              const birthday = new Date(c.birthday);
              return birthday.getMonth() === new Date().getMonth();
            }).length}
          </p>
        </div>
      </div>

      {/* Busca - sticky para manter no mesmo lugar ao rolar */}
      <div className="sticky top-0 z-10 bg-[var(--bg-main)] pt-1 pb-2 -mx-1 px-1">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={scrollToTopOnFocus}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          />
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="min-h-[200px] flex items-center justify-center px-5 py-10 text-center text-sm text-gray-500">
            Nenhum cliente encontrado
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-gray-100">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="p-5 space-y-4">
                  <Link
                    href={`/admin/clientes/${customer.id}`}
                    className="flex items-start gap-3"
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-stone-100 flex-shrink-0">
                      {customer.photo ? (
                        <Image
                          src={customer.photo}
                          alt={customer.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <Users className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-gray-900">{customer.name}</span>
                      {customer.notes && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{customer.notes}</p>
                      )}
                    </div>
                  </Link>

                  <div className="space-y-1.5 text-sm">
                    <p className="text-gray-600">
                      <span className="text-gray-400">Telefone</span>
                      <span className="ml-2 text-gray-900">{formatPhone(customer.phone)}</span>
                    </p>
                    <p className="text-gray-600 break-all">
                      <span className="text-gray-400">Email</span>
                      <span className="ml-2 text-gray-900">{customer.email || '–'}</span>
                    </p>
                    <p className="text-gray-600">
                      <span className="text-gray-400">Aniversário</span>
                      <span className="ml-2 text-gray-900">{customer.birthday ? formatDate(customer.birthday) : '–'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Link
                      href={`/admin/clientes/${customer.id}`}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
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
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aniversário</th>
                    <th className="px-5 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <Link
                          href={`/admin/clientes/${customer.id}`}
                          className="flex items-center gap-3 hover:text-gray-900 transition-colors"
                        >
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-stone-100 flex-shrink-0">
                            {customer.photo ? (
                              <Image src={customer.photo} alt={customer.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Users className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            {customer.notes && <div className="text-xs text-gray-500 mt-0.5">{customer.notes}</div>}
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">{formatPhone(customer.phone)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">{customer.email || '–'}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">{customer.birthday ? formatDate(customer.birthday) : '–'}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/admin/clientes/${customer.id}`} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Ver Detalhes">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Button onClick={() => handleEdit(customer.id)} variant="edit" size="sm" icon={Pencil} title="Editar" />
                          <Button onClick={() => handleDelete(customer.id, customer.name)} variant="danger" size="sm" icon={Trash2} title="Excluir" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
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