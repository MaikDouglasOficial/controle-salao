
import { ModalBase as Modal } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';


interface ClienteEditarModalProps {
  cliente?: { nome?: string; email?: string; [key: string]: any };
  onSave: (cliente: any) => void;
  onClose: () => void;
}

export default function ClienteEditarModal({ cliente, onSave, onClose }: ClienteEditarModalProps) {
  const [nome, setNome] = useState<string>(cliente?.nome || '');
  const [email, setEmail] = useState<string>(cliente?.email || '');
  // Adicione outros campos conforme necessário

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave({ ...cliente, nome, email });
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={cliente ? 'Editar Cliente' : 'Novo Cliente'}
      subtitle={cliente ? 'Atualize os dados do cliente abaixo' : 'Preencha os dados para cadastrar um novo cliente'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nome *</label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="Ex: João da Silva"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="email@exemplo.com"
            />
          </div>
        </div>
        {/* Adicione outros campos aqui */}
  <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
