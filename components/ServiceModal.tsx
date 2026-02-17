import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';

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
  const [duration, setDuration] = useState<string>(service?.duration?.toString() || '');
  const [price, setPrice] = useState<number>(service?.price ?? 0);
  const [priceDisplay, setPriceDisplay] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave({ 
      ...service, 
      name, 
      description, 
      duration: parseInt(duration) || 0, 
      price 
    });
  }

  return (
    <ModalBase
      isOpen={true}
      onClose={onClose}
      title={service ? 'Editar Serviço' : 'Novo Serviço'}
      subtitle={service ? 'Atualize os dados do serviço abaixo' : 'Preencha os dados para cadastrar um novo serviço'}
      size="lg"
      footer={
        <div className="flex flex-row gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" form="service-form">Salvar</Button>
        </div>
      }
    >
      <form id="service-form" onSubmit={handleSubmit} className="space-y-4">
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
              type="text"
              inputMode="decimal"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={priceDisplay !== null ? priceDisplay : (price === 0 ? '' : formatCurrencyInput(price))}
              onFocus={() => setPriceDisplay(price === 0 ? '' : formatCurrencyInput(price))}
              onChange={e => {
                let raw = e.target.value.replace(/[^\d,]/g, '');
                const parts = raw.split(',');
                if (parts.length > 2) raw = parts[0] + ',' + parts.slice(1).join('');
                setPriceDisplay(raw);
                setPrice(Math.max(0, parseCurrencyInput(raw)));
              }}
              onBlur={(e) => {
                const v = Math.max(0, parseCurrencyInput(e.target.value));
                setPrice(v);
                setPriceDisplay(null);
              }}
              required
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Duração (min) *</label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={duration}
              onChange={e => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setDuration(value);
              }}
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
      </form>
    </ModalBase>
  );
}
