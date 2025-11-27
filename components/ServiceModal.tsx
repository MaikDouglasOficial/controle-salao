import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface ServiceModalProps {
  service?: {
    id?: number;
    name?: string;
    description?: string;
    duration?: number;
    price?: number;
  };
  onSave: (service: any) => void;
  onClose: () => void;
}

export default function ServiceModal({ service, onSave, onClose }: ServiceModalProps) {
  const [name, setName] = useState<string>(service?.name || '');
  const [description, setDescription] = useState<string>(service?.description || '');
  const [duration, setDuration] = useState<number>(service?.duration || 0);
  const [price, setPrice] = useState<number>(service?.price || 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave({ ...service, name, description, duration, price });
  }

  return (
    <ModalBase
      isOpen={true}
      onClose={onClose}
      title={service ? 'Editar Serviço' : 'Novo Serviço'}
      subtitle={service ? 'Atualize os dados do serviço abaixo' : 'Preencha os dados para cadastrar um novo serviço'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Serviço *</label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Ex: Corte Feminino"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preço (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={price}
              onChange={e => setPrice(Number(e.target.value))}
              required
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Duração (min) *</label>
            <input
              type="number"
              min="0"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              required
              placeholder="30"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descrição detalhada do serviço..."
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">Cancelar</Button>
          <Button type="submit" className="w-full sm:w-auto">Salvar</Button>
        </div>
      </form>
    </ModalBase>
  );
}
