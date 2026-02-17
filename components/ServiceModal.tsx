import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';

const COMMISSION_TYPES = [
  { value: 'PERCENT', label: 'Porcentagem (%)' },
  { value: 'FIXED', label: 'Valor fixo (R$)' },
] as const;

interface ServiceModalProps {
  service?: {
    id?: number;
    name?: string;
    description?: string;
    duration?: number;
    price?: number;
    commissionType?: string | null;
    commissionValue?: number | null;
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
  const [commissionType, setCommissionType] = useState<string>(service?.commissionType || 'PERCENT');
  const [commissionValue, setCommissionValue] = useState<string>((service?.commissionValue ?? 0).toString());
  const [commissionDisplay, setCommissionDisplay] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const commVal = commissionType === 'FIXED'
      ? parseCurrencyInput(commissionDisplay !== null ? commissionDisplay : commissionValue)
      : Math.max(0, Math.min(100, parseFloat(commissionValue) || 0));
    onSave({
      ...service,
      name,
      description,
      duration: parseInt(duration) || 0,
      price,
      commissionType,
      commissionValue: commVal,
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
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Comissão</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1">Tipo</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  value={commissionType}
                  onChange={e => setCommissionType(e.target.value)}
                >
                  {COMMISSION_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">{commissionType === 'FIXED' ? 'Valor (R$)' : 'Valor (%)'}</label>
                {commissionType === 'FIXED' ? (
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    value={commissionDisplay !== null ? commissionDisplay : (parseFloat(commissionValue) ? formatCurrencyInput(parseFloat(commissionValue)) : '')}
                    onFocus={() => setCommissionDisplay(parseFloat(commissionValue) ? formatCurrencyInput(parseFloat(commissionValue)) : '')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d,]/g, '');
                      setCommissionDisplay(raw);
                      setCommissionValue(parseCurrencyInput(raw).toString());
                    }}
                    onBlur={e => {
                      const v = parseCurrencyInput(e.target.value);
                      setCommissionValue(v.toString());
                      setCommissionDisplay(null);
                    }}
                    placeholder="0,00"
                  />
                ) : (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    value={commissionValue}
                    onChange={e => setCommissionValue(e.target.value.replace(/[^0-9.,]/g, ''))}
                    placeholder="0"
                  />
                )}
              </div>
            </div>
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
