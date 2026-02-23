import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { fetchAuth } from '@/lib/api';
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
    sku?: string | null;
    photo?: string | null;
    commissionType?: string | null;
    commissionValue?: number | null;
  };
  onSave: (service: any) => void;
  onClose: () => void;
}

export default function ServiceModal({ service, onSave, onClose }: ServiceModalProps) {
  const { error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string>(service?.name || '');
  const [description, setDescription] = useState<string>(service?.description || '');
  const [duration, setDuration] = useState<string>(service?.duration?.toString() || '');
  const [price, setPrice] = useState<number>(service?.price ?? 0);
  const [priceDisplay, setPriceDisplay] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string>(service?.photo ?? '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(service?.photo ?? null);
  const [uploading, setUploading] = useState(false);
  const [commissionType, setCommissionType] = useState<string>(service?.commissionType || 'PERCENT');
  const [commissionValue, setCommissionValue] = useState<string>((service?.commissionValue ?? 0).toString());
  const [commissionDisplay, setCommissionDisplay] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      error('Arquivo muito grande. Máximo 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      error('Por favor, selecione uma imagem');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetchAuth('/api/upload', { method: 'POST', body: formData });
      if (response.ok) {
        const { url } = await response.json();
        setPhoto(url);
        setPhotoPreview(url);
      } else {
        const err = await response.json();
        error(err.error || 'Erro ao fazer upload');
      }
    } catch (err) {
      console.error(err);
      error('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto('');
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const commVal = commissionType === 'FIXED'
      ? parseCurrencyInput(commissionDisplay !== null ? commissionDisplay : commissionValue)
      : Math.max(0, Math.min(100, parseFloat(commissionValue) || 0));
    onSave({
      ...service,
      name,
      sku: service ? service.sku : undefined,
      description,
      duration: parseInt(duration) || 0,
      price,
      photo: photo || null,
      commissionType,
      commissionValue: commVal,
    });
  }

  return (
    <ModalBase
      isOpen={true}
      onClose={onClose}
      title={service ? 'Editar Serviço' : 'Novo Serviço'}
      size="lg"
      footer={
        <div className="flex flex-row gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" form="service-form">Salvar</Button>
        </div>
      }
    >
      <form id="service-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="w-full mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Serviço</label>
          <div className="w-full rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
            {photoPreview ? (
              <div className="relative w-full aspect-video">
                <Image src={photoPreview} alt="Foto do serviço" fill className="object-cover" />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow"
                  aria-label="Remover foto"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="service-photo-upload"
                className={`flex flex-col items-center justify-center w-full aspect-video cursor-pointer transition-colors ${
                  uploading ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-100'
                }`}
              >
                <Camera className="h-10 w-10 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">{uploading ? 'Enviando...' : 'Clique para adicionar foto'}</span>
              </label>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            id="service-photo-upload"
          />
          {photoPreview && (
            <label
              htmlFor="service-photo-upload"
              className={`mt-2 flex w-full justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition-colors ${
                uploading ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              {uploading ? 'Enviando...' : 'Alterar foto'}
            </label>
          )}
          <p className="text-xs text-gray-500 mt-1.5">PNG, JPG ou WEBP (máx. 5MB)</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Código</label>
            {service?.sku ? (
              <div className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                {service.sku}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Será gerado automaticamente ao salvar.</p>
            )}
          </div>
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
