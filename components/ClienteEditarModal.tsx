
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
      size="xl"
      footer={
        <div className="flex flex-row gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" form="customer-form">Salvar</Button>
        </div>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
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
      </form>
    </Modal>
  );
}
