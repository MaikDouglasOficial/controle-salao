
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="Ex: João da Silva"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="email@exemplo.com"
            />
          </div>
        </div>
        {/* Adicione outros campos aqui */}
  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">Cancelar</Button>
          <Button type="submit" className="w-full sm:w-auto">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
